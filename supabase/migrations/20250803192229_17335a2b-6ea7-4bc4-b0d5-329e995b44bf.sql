-- Fix all remaining security definer functions without proper search_path
-- Let me get the complete list and fix them systematically

CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Log role assignments/changes with enhanced security context
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            details_encrypted,
            timestamp
        ) VALUES (
            auth.uid(),
            'ROLE_ASSIGNED_SECURE',
            jsonb_build_object(
                'target_user_id', NEW.user_id,
                'role_assigned', NEW.role,
                'assigned_by', auth.uid(),
                'security_context', 'enhanced_validation',
                'timestamp', now()
            )::text,
            now()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            details_encrypted,
            timestamp
        ) VALUES (
            auth.uid(),
            'ROLE_MODIFIED_SECURE',
            jsonb_build_object(
                'target_user_id', NEW.user_id,
                'old_role', OLD.role,
                'new_role', NEW.role,
                'modified_by', auth.uid(),
                'security_context', 'administrative_action',
                'timestamp', now()
            )::text,
            now()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            details_encrypted,
            timestamp
        ) VALUES (
            auth.uid(),
            'ROLE_REMOVED_SECURE',
            jsonb_build_object(
                'target_user_id', OLD.user_id,
                'role_removed', OLD.role,
                'removed_by', auth.uid(),
                'security_context', 'administrative_action',
                'timestamp', now()
            )::text,
            now()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_security_event_enhanced(event_type text, event_data jsonb DEFAULT '{}'::jsonb, risk_level text DEFAULT 'low'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Enhanced security event logging with better metadata
  INSERT INTO public.audit_logs (
    user_id,
    action,
    details_encrypted,
    timestamp
  ) VALUES (
    auth.uid(),
    'SECURITY_EVENT_' || upper(event_type),
    jsonb_build_object(
      'event_type', event_type,
      'risk_level', risk_level,
      'user_agent', current_setting('request.headers', true)::jsonb ->> 'user-agent',
      'ip_address', current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for',
      'timestamp', now(),
      'session_context', 'enhanced_monitoring',
      'event_data', event_data
    )::text,
    now()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_checkin_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_uuid uuid;
  new_streak integer := 0;
  total_count integer;
  avg_mood numeric;
  last_checkin_date date;
BEGIN
  user_uuid := NEW.user_id;
  
  -- Calculate total checkins
  SELECT COUNT(*) INTO total_count
  FROM public.daily_checkins 
  WHERE user_id = user_uuid AND is_complete = true;
  
  -- Calculate average mood
  SELECT AVG(mood_rating) INTO avg_mood
  FROM public.daily_checkins 
  WHERE user_id = user_uuid AND mood_rating IS NOT NULL;
  
  -- Calculate current streak
  WITH consecutive_days AS (
    SELECT checkin_date,
           checkin_date - (ROW_NUMBER() OVER (ORDER BY checkin_date DESC))::integer AS group_date
    FROM public.daily_checkins
    WHERE user_id = user_uuid 
    AND is_complete = true
    AND checkin_date >= CURRENT_DATE - INTERVAL '365 days'
    ORDER BY checkin_date DESC
  ),
  streak_groups AS (
    SELECT group_date, COUNT(*) as consecutive_count
    FROM consecutive_days
    GROUP BY group_date
    ORDER BY group_date DESC
  )
  SELECT COALESCE(consecutive_count, 0) INTO new_streak
  FROM streak_groups
  LIMIT 1;
  
  -- Get last checkin date
  SELECT MAX(checkin_date) INTO last_checkin_date
  FROM public.daily_checkins 
  WHERE user_id = user_uuid AND is_complete = true;
  
  -- Upsert stats
  INSERT INTO public.checkin_stats (user_id, total_checkins, streak_count, last_checkin, average_mood, updated_at)
  VALUES (user_uuid, total_count, new_streak, last_checkin_date, avg_mood, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_checkins = EXCLUDED.total_checkins,
    streak_count = EXCLUDED.streak_count,
    last_checkin = EXCLUDED.last_checkin,
    average_mood = EXCLUDED.average_mood,
    updated_at = now();
    
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.recovery_notifications
  WHERE expires_at < now() AND is_read = true;
  
  -- Also clean up old delivery logs (keep for 90 days)
  DELETE FROM public.notification_delivery_log
  WHERE created_at < now() - INTERVAL '90 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_optimal_notification_time(user_uuid uuid)
RETURNS time without time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  optimal_hour INTEGER;
  activity_data JSONB;
BEGIN
  -- Get user's activity pattern
  SELECT most_active_hours INTO activity_data
  FROM public.user_activity_patterns
  WHERE user_id = user_uuid;
  
  -- If no data, return default time (9 AM)
  IF activity_data IS NULL OR jsonb_array_length(activity_data) = 0 THEN
    RETURN '09:00:00'::TIME;
  END IF;
  
  -- Get the first most active hour
  optimal_hour := (activity_data->0)::INTEGER;
  
  -- Return as time
  RETURN make_time(optimal_hour, 0, 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_queue_wait_time(priority_level text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    available_supporters integer;
    queue_ahead integer;
    avg_session_duration decimal;
    estimated_minutes integer;
BEGIN
    -- Count available supporters
    SELECT COUNT(*) INTO available_supporters
    FROM peer_supporters 
    WHERE is_available = true 
    AND current_chat_count < max_concurrent_chats;
    
    -- If no supporters available, return default high wait time
    IF available_supporters = 0 THEN
        RETURN 45;
    END IF;
    
    -- Count users ahead in queue with same or higher priority
    SELECT COUNT(*) INTO queue_ahead
    FROM peer_support_queue
    WHERE (
        (priority_level = 'normal' AND priority IN ('crisis', 'high', 'normal')) OR
        (priority_level = 'high' AND priority IN ('crisis', 'high')) OR
        (priority_level = 'crisis' AND priority = 'crisis')
    );
    
    -- Get average session duration from last 24 hours
    SELECT COALESCE(AVG(duration_minutes), 15) INTO avg_session_duration
    FROM peer_chat_sessions
    WHERE started_at >= now() - INTERVAL '24 hours'
    AND duration_minutes IS NOT NULL;
    
    -- Calculate estimated wait time
    estimated_minutes := CEIL((queue_ahead::decimal / available_supporters) * avg_session_duration);
    
    -- Apply priority modifiers
    CASE priority_level
        WHEN 'crisis' THEN 
            estimated_minutes := GREATEST(1, estimated_minutes * 0.1);
        WHEN 'high' THEN 
            estimated_minutes := GREATEST(2, estimated_minutes * 0.5);
        ELSE 
            estimated_minutes := GREATEST(5, estimated_minutes);
    END CASE;
    
    RETURN estimated_minutes;
END;
$function$;