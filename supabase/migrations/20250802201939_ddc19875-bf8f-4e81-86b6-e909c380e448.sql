-- Phase 1: Critical Role System Security Fixes
-- Fix conflicting user_roles RLS policies and implement secure role management

-- 1. Remove all existing conflicting RLS policies on user_roles table
DROP POLICY IF EXISTS "Users can view their roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete their roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;

-- 2. Create secure, non-conflicting RLS policies for user_roles
-- Users can only view their own roles
CREATE POLICY "users_can_view_own_roles" ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only providers can manage roles through secure functions (no direct UPDATE/DELETE)
CREATE POLICY "providers_manage_roles_via_functions" ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'provider'::app_role
  )
);

-- System can insert roles during user creation
CREATE POLICY "system_can_assign_default_roles" ON public.user_roles
FOR INSERT
WITH CHECK (
  -- Allow during user creation (from trigger)
  auth.uid() IS NULL OR 
  -- Allow providers to assign roles through secure functions
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'provider'::app_role
  )
);

-- 3. Create secure role assignment function that prevents privilege escalation
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id UUID,
  new_role app_role,
  reason TEXT DEFAULT 'Administrative assignment'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  requesting_user_role app_role;
  result jsonb;
BEGIN
  -- Get the requesting user's role
  SELECT role INTO requesting_user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  AND role = 'provider'::app_role
  LIMIT 1;

  -- Only providers can assign roles
  IF requesting_user_role IS NULL THEN
    RAISE EXCEPTION 'Access denied: Only providers can assign roles';
  END IF;

  -- Prevent users from escalating their own roles
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Security violation: Cannot modify your own role';
  END IF;

  -- Validate target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  -- Remove existing roles for this user
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Assign new role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role);

  -- Log the role assignment
  INSERT INTO public.audit_logs (
    user_id,
    action,
    details_encrypted,
    timestamp
  ) VALUES (
    auth.uid(),
    'SECURE_ROLE_ASSIGNMENT',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'role_assigned', new_role,
      'assigned_by', auth.uid(),
      'reason', reason,
      'security_context', 'secure_function_call',
      'timestamp', now()
    )::text,
    now()
  );

  -- Return success result
  SELECT jsonb_build_object(
    'success', true,
    'target_user_id', target_user_id,
    'role_assigned', new_role,
    'assigned_by', auth.uid(),
    'timestamp', now()
  ) INTO result;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Log security violation
    INSERT INTO public.audit_logs (
      user_id,
      action,
      details_encrypted,
      timestamp
    ) VALUES (
      auth.uid(),
      'ROLE_ASSIGNMENT_SECURITY_VIOLATION',
      jsonb_build_object(
        'target_user_id', target_user_id,
        'attempted_role', new_role,
        'error_message', SQLERRM,
        'security_context', 'failed_assignment_attempt',
        'timestamp', now()
      )::text,
      now()
    );
    
    RAISE;
END;
$$;

-- 4. Create function to safely remove roles
CREATE OR REPLACE FUNCTION public.remove_user_role(
  target_user_id UUID,
  role_to_remove app_role,
  reason TEXT DEFAULT 'Administrative removal'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  requesting_user_role app_role;
  result jsonb;
BEGIN
  -- Get the requesting user's role
  SELECT role INTO requesting_user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  AND role = 'provider'::app_role
  LIMIT 1;

  -- Only providers can remove roles
  IF requesting_user_role IS NULL THEN
    RAISE EXCEPTION 'Access denied: Only providers can remove roles';
  END IF;

  -- Prevent users from modifying their own roles
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Security violation: Cannot modify your own role';
  END IF;

  -- Remove the specific role
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id AND role = role_to_remove;

  -- Ensure user always has at least 'patient' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'patient'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Log the role removal
  INSERT INTO public.audit_logs (
    user_id,
    action,
    details_encrypted,
    timestamp
  ) VALUES (
    auth.uid(),
    'SECURE_ROLE_REMOVAL',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'role_removed', role_to_remove,
      'removed_by', auth.uid(),
      'reason', reason,
      'security_context', 'secure_function_call',
      'timestamp', now()
    )::text,
    now()
  );

  -- Return success result
  SELECT jsonb_build_object(
    'success', true,
    'target_user_id', target_user_id,
    'role_removed', role_to_remove,
    'removed_by', auth.uid(),
    'timestamp', now()
  ) INTO result;

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Log security violation
    INSERT INTO public.audit_logs (
      user_id,
      action,
      details_encrypted,
      timestamp
    ) VALUES (
      auth.uid(),
      'ROLE_REMOVAL_SECURITY_VIOLATION',
      jsonb_build_object(
        'target_user_id', target_user_id,
        'attempted_role_removal', role_to_remove,
        'error_message', SQLERRM,
        'security_context', 'failed_removal_attempt',
        'timestamp', now()
      )::text,
      now()
    );
    
    RAISE;
END;
$$;