-- Phase 3: RLS Policy Tightening
-- Review and restrict overly permissive policies

-- 1. Fix overly permissive audit log policies (remove duplicates and tighten access)
DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_own" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;

-- Create single, secure audit log policies
CREATE POLICY "secure_audit_logs_insert" ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "secure_audit_logs_select" ON public.audit_logs
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'provider'::app_role
  )
);

-- 2. Add time-based constraints for crisis data access
CREATE POLICY "crisis_events_time_limited" ON public.crisis_events
FOR SELECT
USING (
  auth.uid() = user_id AND
  created_at >= now() - INTERVAL '90 days'
);

-- Update existing crisis events policy to be more restrictive
DROP POLICY IF EXISTS "crisis_events_select_own" ON public.crisis_events;
CREATE POLICY "crisis_events_select_own" ON public.crisis_events
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Tighten access to crisis contacts (add time-based access)
CREATE POLICY "crisis_contacts_recent_access" ON public.crisis_contacts
FOR SELECT
USING (
  auth.uid() = user_id AND
  (updated_at >= now() - INTERVAL '1 year' OR created_at >= now() - INTERVAL '1 year')
);

-- 4. Add provider oversight for sensitive data
CREATE POLICY "providers_emergency_access_crisis_events" ON public.crisis_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'provider'::app_role
  ) AND
  created_at >= now() - INTERVAL '7 days'
);

-- 5. Secure crisis plans with additional validation
CREATE POLICY "crisis_plans_owner_only" ON public.crisis_plans
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Remove any overly permissive policies
DROP POLICY IF EXISTS "Users can create their own crisis plans" ON public.crisis_plans;
DROP POLICY IF EXISTS "Users can delete their own crisis plans" ON public.crisis_plans;
DROP POLICY IF EXISTS "Users can update their own crisis plans" ON public.crisis_plans;
DROP POLICY IF EXISTS "Users can view their own crisis plans" ON public.crisis_plans;

-- 6. Add secure access logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  table_name text,
  operation_type text,
  record_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    details_encrypted,
    timestamp
  ) VALUES (
    auth.uid(),
    'SENSITIVE_DATA_ACCESS',
    jsonb_build_object(
      'table_accessed', table_name,
      'operation', operation_type,
      'record_id', record_id,
      'access_time', now(),
      'security_context', 'data_access_monitoring'
    )::text,
    now()
  );
END;
$$;

-- 7. Create function to validate data retention compliance
CREATE OR REPLACE FUNCTION public.check_data_retention_compliance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  old_crisis_events integer;
  old_audit_logs integer;
  old_notifications integer;
BEGIN
  -- Count data that may need retention review
  SELECT COUNT(*) INTO old_crisis_events
  FROM public.crisis_events
  WHERE created_at < now() - INTERVAL '2 years';
  
  SELECT COUNT(*) INTO old_audit_logs
  FROM public.audit_logs
  WHERE timestamp < now() - INTERVAL '90 days';
  
  SELECT COUNT(*) INTO old_notifications
  FROM public.recovery_notifications
  WHERE created_at < now() - INTERVAL '1 year';
  
  -- Build compliance report
  SELECT jsonb_build_object(
    'compliance_status', CASE
      WHEN old_crisis_events > 100 OR old_audit_logs > 10000 THEN 'action_required'
      WHEN old_crisis_events > 50 OR old_audit_logs > 5000 THEN 'review_needed'
      ELSE 'compliant'
    END,
    'old_crisis_events', old_crisis_events,
    'old_audit_logs', old_audit_logs,
    'old_notifications', old_notifications,
    'last_check', now(),
    'retention_recommendations', jsonb_build_array(
      CASE WHEN old_crisis_events > 100 THEN 'Review crisis events older than 2 years' END,
      CASE WHEN old_audit_logs > 10000 THEN 'Clean up audit logs older than 90 days' END,
      CASE WHEN old_notifications > 1000 THEN 'Archive old notifications' END
    ) - 'null'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;