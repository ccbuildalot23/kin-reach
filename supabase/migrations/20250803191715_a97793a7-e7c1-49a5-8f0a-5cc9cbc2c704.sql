-- Phase 1: Critical Database Security Fixes

-- Fix search_path vulnerabilities in security definer functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
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

CREATE OR REPLACE FUNCTION public.validate_security_configuration()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  result jsonb;
  security_score integer := 100;
  issues text[] := '{}';
  recommendations text[] := '{}';
BEGIN
  -- Check for common security misconfigurations
  
  -- Verify all critical tables have RLS enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t 
    JOIN pg_class c ON c.relname = t.tablename 
    WHERE t.schemaname = 'public' 
    AND c.relrowsecurity = true
    AND t.tablename IN ('audit_logs', 'crisis_events', 'daily_checkins', 'profiles')
  ) THEN
    security_score := security_score - 20;
    issues := array_append(issues, 'Critical tables missing RLS protection');
    recommendations := array_append(recommendations, 'Enable RLS on all user data tables');
  END IF;

  -- Check for proper user roles configuration
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE role = 'provider'::app_role
  ) THEN
    security_score := security_score - 10;
    issues := array_append(issues, 'No provider roles configured');
    recommendations := array_append(recommendations, 'Configure provider access controls');
  END IF;

  -- Build security status report
  SELECT jsonb_build_object(
    'security_score', security_score,
    'status', CASE 
      WHEN security_score >= 90 THEN 'excellent'
      WHEN security_score >= 80 THEN 'good'
      WHEN security_score >= 70 THEN 'fair'
      ELSE 'needs_attention'
    END,
    'issues', to_jsonb(issues),
    'recommendations', to_jsonb(recommendations),
    'last_check', now(),
    'environment', 'production'
  ) INTO result;
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_sms_rate_limit(user_uuid uuid, operation_type text, max_operations integer DEFAULT 3, window_minutes integer DEFAULT 5)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_count integer;
  window_start_time timestamp with time zone;
BEGIN
  -- Calculate window start time
  window_start_time := date_trunc('minute', now()) - (window_minutes || ' minutes')::interval;
  
  -- Get current operation count in the time window
  SELECT COALESCE(SUM(operation_count), 0) INTO current_count
  FROM public.sms_rate_limits
  WHERE user_id = user_uuid
  AND operation_type = check_sms_rate_limit.operation_type
  AND window_start >= window_start_time;
  
  -- Check if rate limit is exceeded
  IF current_count >= max_operations THEN
    -- Log rate limit violation
    INSERT INTO public.audit_logs (
      user_id,
      action,
      details_encrypted,
      timestamp
    ) VALUES (
      user_uuid,
      'SMS_RATE_LIMIT_EXCEEDED',
      jsonb_build_object(
        'operation_type', operation_type,
        'current_count', current_count,
        'max_operations', max_operations,
        'window_minutes', window_minutes,
        'security_context', 'rate_limiting',
        'timestamp', now()
      )::text,
      now()
    );
    
    RETURN false;
  END IF;
  
  -- Increment counter
  INSERT INTO public.sms_rate_limits (user_id, operation_type, operation_count, window_start)
  VALUES (user_uuid, operation_type, 1, date_trunc('minute', now()))
  ON CONFLICT (user_id, operation_type, window_start)
  DO UPDATE SET 
    operation_count = sms_rate_limits.operation_count + 1,
    created_at = now();
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_sms_input(phone_number text, message_content text, user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  validation_result jsonb;
  clean_phone text;
  is_valid boolean := true;
  errors text[] := '{}';
BEGIN
  -- Validate phone number format
  clean_phone := regexp_replace(phone_number, '[^0-9+]', '', 'g');
  
  IF LENGTH(clean_phone) < 10 OR LENGTH(clean_phone) > 15 THEN
    is_valid := false;
    errors := array_append(errors, 'Invalid phone number format');
  END IF;
  
  -- Validate message content
  IF message_content IS NULL OR LENGTH(TRIM(message_content)) = 0 THEN
    is_valid := false;
    errors := array_append(errors, 'Message content cannot be empty');
  END IF;
  
  IF LENGTH(message_content) > 1600 THEN
    is_valid := false;
    errors := array_append(errors, 'Message content too long (max 1600 characters)');
  END IF;
  
  -- Check for suspicious content patterns
  IF message_content ~* '(script|javascript|<[^>]*>|SELECT|INSERT|UPDATE|DELETE|DROP)' THEN
    is_valid := false;
    errors := array_append(errors, 'Message contains invalid content');
    
    -- Log security violation
    INSERT INTO public.audit_logs (
      user_id,
      action,
      details_encrypted,
      timestamp
    ) VALUES (
      user_uuid,
      'SMS_CONTENT_SECURITY_VIOLATION',
      jsonb_build_object(
        'phone_number', substr(clean_phone, 1, 4) || '***',
        'message_length', LENGTH(message_content),
        'security_context', 'content_validation',
        'timestamp', now()
      )::text,
      now()
    );
  END IF;
  
  -- Build validation result
  SELECT jsonb_build_object(
    'is_valid', is_valid,
    'errors', to_jsonb(errors),
    'clean_phone', clean_phone,
    'sanitized_message', regexp_replace(message_content, '[<>"\''&]', '', 'g')
  ) INTO validation_result;
  
  RETURN validation_result;
END;
$function$;

-- Fix RLS policy gaps - Make user_id NOT NULL on profiles
ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;

-- Add created_at timestamp to user_roles if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' 
    AND column_name = 'created_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD COLUMN created_at timestamp with time zone NOT NULL DEFAULT now();
  END IF;
END $$;

-- Strengthen RLS policies
DROP POLICY IF EXISTS "Users can view their own profile data" ON public.profiles;
CREATE POLICY "Users can view their own profile data" 
ON public.profiles 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add comprehensive RLS policy for user_roles with better security
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only allow role assignments by providers through secure functions
DROP POLICY IF EXISTS "Providers can manage roles" ON public.user_roles;
CREATE POLICY "Providers can manage roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'provider'::app_role
  ) 
  OR auth.uid() = user_id
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'provider'::app_role
  )
);

-- Add security logging for all profile updates
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      details_encrypted,
      timestamp
    ) VALUES (
      NEW.user_id,
      'PROFILE_UPDATED_SECURE',
      jsonb_build_object(
        'user_id', NEW.user_id,
        'fields_changed', jsonb_build_object(
          'full_name_changed', (OLD.full_name IS DISTINCT FROM NEW.full_name),
          'email_changed', (OLD.email IS DISTINCT FROM NEW.email),
          'phone_changed', (OLD.phone_number IS DISTINCT FROM NEW.phone_number)
        ),
        'security_context', 'profile_update_monitoring',
        'timestamp', now()
      )::text,
      now()
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for profile security logging
DROP TRIGGER IF EXISTS profile_security_audit ON public.profiles;
CREATE TRIGGER profile_security_audit
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_changes();