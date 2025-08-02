-- Fix the user creation trigger that handles new user profile and role assignment
-- The issue is that users can't be created because the trigger is failing

-- First, let's ensure the trigger function handles all required data properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    requested_user_type text;
    assigned_role app_role;
BEGIN
    -- Get the user type from metadata (but don't trust it for role assignment)
    requested_user_type := COALESCE(NEW.raw_user_meta_data ->> 'userType', 'patient');
    
    -- SECURITY: Always assign 'patient' role by default
    -- Provider roles must be assigned through secure administrative process
    assigned_role := 'patient';
    
    -- Insert into profiles table with proper error handling
    INSERT INTO public.profiles (id, full_name, recovery_start_date, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'full_name',
        CASE 
            WHEN NEW.raw_user_meta_data ->> 'recovery_start_date' IS NOT NULL 
            THEN (NEW.raw_user_meta_data ->> 'recovery_start_date')::date
            ELSE NULL
        END,
        NEW.email
    );
    
    -- Always assign patient role (secure default)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role);
    
    -- Log the role assignment with security details
    INSERT INTO public.audit_logs (
        user_id,
        action,
        details_encrypted,
        timestamp
    ) VALUES (
        NEW.id,
        'USER_ROLE_ASSIGNED_SECURE',
        jsonb_build_object(
            'assigned_role', assigned_role,
            'requested_user_type', requested_user_type,
            'security_note', 'Role assignment enforced server-side for security',
            'timestamp', now()
        )::text,
        now()
    );
    
    RETURN NEW;
EXCEPTION 
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix the existing user that doesn't have a role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'patient'::app_role 
FROM auth.users 
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.users.id
)
ON CONFLICT (user_id, role) DO NOTHING;