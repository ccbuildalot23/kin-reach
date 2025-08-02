-- Phase 4: Additional Security Enhancements
-- Implement final security measures and cleanup

-- 1. Create user registration rate limiting
CREATE TABLE IF NOT EXISTS public.registration_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  email_domain text NOT NULL,
  registration_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ip_address, email_domain, window_start)
);

-- Enable RLS for registration rate limits
ALTER TABLE public.registration_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can manage registration rate limits
CREATE POLICY "system_manages_registration_limits" ON public.registration_rate_limits
FOR ALL
USING (true);

-- 2. Create function to check registration rate limits
CREATE OR REPLACE FUNCTION public.check_registration_rate_limit(
  client_ip inet,
  email_address text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  email_domain text;
  ip_count integer;
  domain_count integer;
  window_start_time timestamp with time zone;
BEGIN
  -- Extract domain from email
  email_domain := split_part(email_address, '@', 2);
  window_start_time := date_trunc('hour', now());
  
  -- Check IP-based rate limit (max 5 registrations per hour per IP)
  SELECT COALESCE(SUM(registration_count), 0) INTO ip_count
  FROM public.registration_rate_limits
  WHERE ip_address = client_ip
  AND window_start >= window_start_time;
  
  -- Check domain-based rate limit (max 10 registrations per hour per domain)
  SELECT COALESCE(SUM(registration_count), 0) INTO domain_count
  FROM public.registration_rate_limits
  WHERE email_domain = check_registration_rate_limit.email_domain
  AND window_start >= window_start_time;
  
  -- Check rate limits
  IF ip_count >= 5 OR domain_count >= 10 THEN
    -- Log rate limit violation
    INSERT INTO public.audit_logs (
      user_id,
      action,
      details_encrypted,
      timestamp
    ) VALUES (
      NULL, -- No user ID for registration attempts
      'REGISTRATION_RATE_LIMIT_EXCEEDED',
      jsonb_build_object(
        'ip_address', host(client_ip),
        'email_domain', email_domain,
        'ip_count', ip_count,
        'domain_count', domain_count,
        'security_context', 'registration_rate_limiting',
        'timestamp', now()
      )::text,
      now()
    );
    
    RETURN false;
  END IF;
  
  -- Increment counters
  INSERT INTO public.registration_rate_limits (ip_address, email_domain, registration_count, window_start)
  VALUES (client_ip, email_domain, 1, window_start_time)
  ON CONFLICT (ip_address, email_domain, window_start)
  DO UPDATE SET 
    registration_count = registration_rate_limits.registration_count + 1,
    created_at = now();
  
  RETURN true;
END;
$$;

-- 3. Create session management and security monitoring
CREATE OR REPLACE FUNCTION public.create_security_session(
  session_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  session_id uuid;
  user_uuid uuid;
BEGIN
  user_uuid := auth.uid();
  session_id := gen_random_uuid();
  
  -- Log session creation
  INSERT INTO public.audit_logs (
    user_id,
    action,
    details_encrypted,
    timestamp
  ) VALUES (
    user_uuid,
    'SECURE_SESSION_CREATED',
    jsonb_build_object(
      'session_id', session_id,
      'session_data', session_data,
      'created_at', now(),
      'security_context', 'session_management'
    )::text,
    now()
  );
  
  RETURN session_id;
END;
$$;

-- 4. Create comprehensive security monitoring function
CREATE OR REPLACE FUNCTION public.get_security_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  recent_violations integer;
  failed_logins integer;
  rate_limit_hits integer;
  suspicious_activity integer;
BEGIN
  -- Only providers can access security dashboard
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'provider'::app_role
  ) THEN
    RAISE EXCEPTION 'Access denied: Provider role required';
  END IF;
  
  -- Count recent security violations (last 24 hours)
  SELECT COUNT(*) INTO recent_violations
  FROM public.audit_logs
  WHERE action LIKE '%SECURITY_VIOLATION%'
  AND timestamp >= now() - INTERVAL '24 hours';
  
  -- Count failed login attempts
  SELECT COUNT(*) INTO failed_logins
  FROM public.audit_logs
  WHERE action LIKE '%FAILED_LOGIN%'
  AND timestamp >= now() - INTERVAL '24 hours';
  
  -- Count rate limit hits
  SELECT COUNT(*) INTO rate_limit_hits
  FROM public.audit_logs
  WHERE action LIKE '%RATE_LIMIT%'
  AND timestamp >= now() - INTERVAL '24 hours';
  
  -- Count suspicious activities
  SELECT COUNT(*) INTO suspicious_activity
  FROM public.audit_logs
  WHERE (
    action LIKE '%UNAUTHORIZED%' OR
    action LIKE '%ESCALATION%' OR
    action LIKE '%INJECTION%'
  )
  AND timestamp >= now() - INTERVAL '24 hours';
  
  -- Build security dashboard
  SELECT jsonb_build_object(
    'security_status', CASE
      WHEN recent_violations > 10 OR suspicious_activity > 5 THEN 'critical'
      WHEN recent_violations > 5 OR rate_limit_hits > 20 THEN 'warning'
      ELSE 'normal'
    END,
    'metrics', jsonb_build_object(
      'recent_violations', recent_violations,
      'failed_logins', failed_logins,
      'rate_limit_hits', rate_limit_hits,
      'suspicious_activity', suspicious_activity
    ),
    'active_users_24h', (
      SELECT COUNT(DISTINCT user_id)
      FROM public.audit_logs
      WHERE timestamp >= now() - INTERVAL '24 hours'
      AND user_id IS NOT NULL
    ),
    'last_update', now(),
    'recommendations', jsonb_build_array(
      CASE WHEN recent_violations > 10 THEN 'Review security violations immediately' END,
      CASE WHEN suspicious_activity > 5 THEN 'Investigate suspicious activities' END,
      CASE WHEN rate_limit_hits > 20 THEN 'Review rate limiting thresholds' END
    ) - 'null'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 5. Create cleanup function for old security data
CREATE OR REPLACE FUNCTION public.cleanup_security_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  deleted_logs integer;
  deleted_rate_limits integer;
  deleted_notifications integer;
BEGIN
  -- Clean up old audit logs (keep for 90 days)
  DELETE FROM public.audit_logs
  WHERE timestamp < now() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_logs = ROW_COUNT;
  
  -- Clean up old rate limit data (keep for 7 days)
  DELETE FROM public.sms_rate_limits
  WHERE created_at < now() - INTERVAL '7 days';
  GET DIAGNOSTICS deleted_rate_limits = ROW_COUNT;
  
  -- Clean up old registration rate limits (keep for 24 hours)
  DELETE FROM public.registration_rate_limits
  WHERE created_at < now() - INTERVAL '24 hours';
  
  -- Clean up old notifications
  DELETE FROM public.recovery_notifications
  WHERE expires_at < now() AND is_read = true;
  GET DIAGNOSTICS deleted_notifications = ROW_COUNT;
  
  -- Log cleanup operation
  INSERT INTO public.audit_logs (
    user_id,
    action,
    details_encrypted,
    timestamp
  ) VALUES (
    auth.uid(),
    'SECURITY_DATA_CLEANUP',
    jsonb_build_object(
      'deleted_logs', deleted_logs,
      'deleted_rate_limits', deleted_rate_limits,
      'deleted_notifications', deleted_notifications,
      'cleanup_timestamp', now(),
      'security_context', 'automated_cleanup'
    )::text,
    now()
  );
  
  -- Build cleanup result
  SELECT jsonb_build_object(
    'success', true,
    'deleted_logs', deleted_logs,
    'deleted_rate_limits', deleted_rate_limits,
    'deleted_notifications', deleted_notifications,
    'cleanup_timestamp', now()
  ) INTO result;
  
  RETURN result;
END;
$$;