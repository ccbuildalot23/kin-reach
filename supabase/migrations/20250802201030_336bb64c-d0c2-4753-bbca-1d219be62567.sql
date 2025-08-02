-- Fix the user creation trigger and role assignment issues
-- The audit_logs table requires user_id to be NOT NULL, so we need to handle this properly

-- First, let's update the trigger function to work without audit logs causing constraint violations
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
    assigned_role := 'patient';
    
    -- Insert into profiles table - this should already exist but let's make sure it's updated
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
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        recovery_start_date = EXCLUDED.recovery_start_date,
        email = EXCLUDED.email,
        updated_at = now();
    
    -- Always assign patient role (secure default)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
EXCEPTION 
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Remove the problematic trigger and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix the existing user that doesn't have a role (without causing constraint violations)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'patient'::app_role 
FROM auth.users 
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.users.id
)
ON CONFLICT (user_id, role) DO NOTHING;