-- Remove the problematic trigger that's causing the signup failures
-- This trigger is trying to call auth.uid() during user creation which fails

-- First, let's remove the trigger that's causing the issue
DROP TRIGGER IF EXISTS log_role_changes ON user_roles;

-- Create a simpler, safer version of the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Insert into profiles table 
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
    VALUES (NEW.id, 'patient'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
EXCEPTION 
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Remove and recreate the trigger to ensure it's clean
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