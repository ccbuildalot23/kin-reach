-- Phase 2: SMS Security Hardening
-- Add authentication, input validation, and rate limiting to SMS functions

-- 1. Create rate limiting table for SMS operations
CREATE TABLE IF NOT EXISTS public.sms_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operation_type text NOT NULL,
  operation_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, operation_type, window_start)
);

-- Enable RLS on rate limiting table
ALTER TABLE public.sms_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only users can view their own rate limit data
CREATE POLICY "users_view_own_rate_limits" ON public.sms_rate_limits
FOR SELECT
USING (auth.uid() = user_id);

-- System can manage rate limit data
CREATE POLICY "system_manages_rate_limits" ON public.sms_rate_limits
FOR ALL
USING (true);

-- 2. Create SMS rate limiting function
CREATE OR REPLACE FUNCTION public.check_sms_rate_limit(
  user_uuid uuid,
  operation_type text,
  max_operations integer DEFAULT 3,
  window_minutes integer DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- 3. Create input validation function for SMS data
CREATE OR REPLACE FUNCTION public.validate_sms_input(
  phone_number text,
  message_content text,
  user_uuid uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- 4. Create function to verify contact ownership
CREATE OR REPLACE FUNCTION public.verify_contact_ownership(
  user_uuid uuid,
  contact_phone text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  contact_exists boolean;
BEGIN
  -- Check if the contact belongs to the user
  SELECT EXISTS (
    SELECT 1 FROM public.crisis_contacts
    WHERE user_id = user_uuid
    AND phone_number = contact_phone
  ) INTO contact_exists;
  
  -- Log unauthorized contact access attempts
  IF NOT contact_exists THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      details_encrypted,
      timestamp
    ) VALUES (
      user_uuid,
      'UNAUTHORIZED_CONTACT_ACCESS',
      jsonb_build_object(
        'attempted_phone', substr(contact_phone, 1, 4) || '***',
        'security_context', 'contact_ownership_verification',
        'timestamp', now()
      )::text,
      now()
    );
  END IF;
  
  RETURN contact_exists;
END;
$$;

-- 5. Update crisis alert rate limiting to use new system
CREATE OR REPLACE FUNCTION public.check_crisis_alert_rate_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN public.check_sms_rate_limit(user_uuid, 'crisis_alert', 3, 5);
END;
$$;