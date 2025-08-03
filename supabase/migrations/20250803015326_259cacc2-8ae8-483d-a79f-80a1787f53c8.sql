-- Security Fix Phase 1: Update database functions to use secure search paths
-- This prevents search path manipulation attacks

-- Fix critical functions with search path vulnerabilities
CREATE OR REPLACE FUNCTION public.validate_crisis_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Ensure user_id matches authenticated user
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot create records for other users';
  END IF;
  
  -- Validate JSON payload sizes
  IF NEW.details_encrypted IS NOT NULL AND 
     length(NEW.details_encrypted::text) > 10000 THEN
    RAISE EXCEPTION 'Payload too large: Details exceed maximum size';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_security_violation(violation_type text, details jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    details_encrypted,
    timestamp
  ) VALUES (
    auth.uid(),
    'SECURITY_VIOLATION_' || violation_type,
    details::text,
    NOW()
  );
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

-- Add server-side phone number validation
CREATE OR REPLACE FUNCTION public.validate_phone_number_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Validate phone number format for E.164 standard
  IF NEW.phone IS NOT NULL AND 
     NEW.phone !~ '^\+1[2-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'Invalid phone number format. Must be E.164 format: +1XXXXXXXXXX';
  END IF;
  
  -- Validate crisis contact phone numbers
  IF TG_TABLE_NAME = 'crisis_contacts' AND NEW.phone_number IS NOT NULL AND
     NEW.phone_number !~ '^\+1[2-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'Invalid emergency contact phone number format. Must be E.164 format: +1XXXXXXXXXX';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Enhanced security logging function
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

-- Secure error handling function
CREATE OR REPLACE FUNCTION public.sanitize_error_message(error_message text, error_context text DEFAULT 'general')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log the original error for debugging
  INSERT INTO public.audit_logs (
    user_id,
    action,
    details_encrypted,
    timestamp
  ) VALUES (
    auth.uid(),
    'ERROR_LOGGED',
    jsonb_build_object(
      'original_error', error_message,
      'context', error_context,
      'timestamp', now()
    )::text,
    now()
  );
  
  -- Return sanitized error message
  CASE 
    WHEN error_message ILIKE '%permission%' OR error_message ILIKE '%access%' THEN
      RETURN 'You do not have permission to perform this action.';
    WHEN error_message ILIKE '%not found%' THEN
      RETURN 'The requested resource was not found.';
    WHEN error_message ILIKE '%constraint%' OR error_message ILIKE '%violation%' THEN
      RETURN 'The data provided does not meet our requirements.';
    ELSE
      RETURN 'An error occurred. Please try again or contact support.';
  END CASE;
END;
$function$;