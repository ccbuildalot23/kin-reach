-- Security Fix Phase 2: Fix remaining database functions with mutable search paths
-- Update all remaining functions that don't have secure search paths

CREATE OR REPLACE FUNCTION public.notify_partner(partner_id uuid, notification_type text, data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    details_encrypted
  ) VALUES (
    partner_id,
    'PARTNER_NOTIFICATION_' || notification_type,
    data::text
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_post_reply_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts 
    SET reply_count = reply_count + 1,
        last_activity = NEW.created_at
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts 
    SET reply_count = reply_count - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_crisis_plan_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Validate plan content length
  IF LENGTH(NEW.plan_encrypted) > 50000 THEN
    RAISE EXCEPTION 'Crisis plan content too large';
  END IF;
  
  -- Ensure user_id matches authenticated user
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot create plans for other users';
  END IF;
  
  RETURN NEW;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.cleanup_old_support_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.support_requests 
  SET deleted_at = NOW()
  WHERE created_at < NOW() - INTERVAL '24 hours'
  AND deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.support_privacy_settings 
    WHERE user_id = public.support_requests.user_id 
    AND auto_delete_history_hours = 24
  );
END;
$function$;

-- Apply phone validation triggers to relevant tables
CREATE TRIGGER validate_profile_phone_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_phone_number_trigger();

CREATE TRIGGER validate_crisis_contact_phone_trigger
    BEFORE INSERT OR UPDATE ON crisis_contacts
    FOR EACH ROW
    EXECUTE FUNCTION validate_phone_number_trigger();