-- Fix remaining functions with missing search_path settings

-- Fix all remaining security definer functions identified by the linter
CREATE OR REPLACE FUNCTION public.update_story_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.interaction_type = 'like' THEN
      UPDATE success_stories 
      SET likes_count = likes_count + 1
      WHERE id = NEW.story_id;
    ELSIF NEW.interaction_type = 'view' THEN
      UPDATE success_stories 
      SET views_count = views_count + 1
      WHERE id = NEW.story_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.interaction_type = 'like' THEN
      UPDATE success_stories 
      SET likes_count = likes_count - 1
      WHERE id = OLD.story_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_support_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.support_stats (date, total_requests, crisis_requests, connection_requests, tough_day_requests, practice_requests)
  VALUES (CURRENT_DATE, 0, 0, 0, 0, 0)
  ON CONFLICT (date) DO UPDATE SET
    total_requests = public.support_stats.total_requests + 1,
    crisis_requests = public.support_stats.crisis_requests + CASE WHEN NEW.request_type = 'crisis' THEN 1 ELSE 0 END,
    connection_requests = public.support_stats.connection_requests + CASE WHEN NEW.request_type = 'connection' THEN 1 ELSE 0 END,
    tough_day_requests = public.support_stats.tough_day_requests + CASE WHEN NEW.request_type = 'tough_day' THEN 1 ELSE 0 END,
    practice_requests = public.support_stats.practice_requests + CASE WHEN NEW.request_type IN ('practice', 'check_in', 'wellness_check') THEN 1 ELSE 0 END,
    updated_at = NOW();

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_supporter_chat_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE peer_supporters 
        SET current_chat_count = current_chat_count + 1
        WHERE user_id = NEW.peer_supporter_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status IN ('ended', 'escalated') THEN
        UPDATE peer_supporters 
        SET current_chat_count = current_chat_count - 1,
            total_chats_completed = total_chats_completed + 1
        WHERE user_id = NEW.peer_supporter_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_typing_indicators()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    DELETE FROM peer_chat_typing 
    WHERE updated_at < NOW() - INTERVAL '5 minutes';
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_supporter_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    IF NEW.user_rating IS NOT NULL THEN
        UPDATE peer_supporters 
        SET average_rating = (
            SELECT AVG(user_rating) 
            FROM peer_chat_sessions 
            WHERE peer_supporter_id = NEW.peer_supporter_id 
            AND user_rating IS NOT NULL
        )
        WHERE user_id = NEW.peer_supporter_id;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_next_queue_user(supporter_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    next_user_id UUID;
BEGIN
    SELECT user_id INTO next_user_id
    FROM peer_support_queue
    WHERE (preferred_supporter_id IS NULL OR preferred_supporter_id = supporter_id)
    ORDER BY 
        CASE priority 
            WHEN 'crisis' THEN 1 
            WHEN 'high' THEN 2 
            ELSE 3 
        END,
        created_at ASC
    LIMIT 1;
    
    IF next_user_id IS NOT NULL THEN
        DELETE FROM peer_support_queue WHERE user_id = next_user_id;
    END IF;
    
    RETURN next_user_id;
END;
$function$;