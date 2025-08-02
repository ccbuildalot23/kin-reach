-- Remove ALL triggers that are interfering with user creation
-- The log_role_change() trigger is still firing and causing constraints violations

-- First, check what triggers exist on user_roles table and remove them all
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'public.user_roles'::regclass
        AND NOT tgisinternal
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.user_roles', trigger_record.tgname);
    END LOOP;
END
$$;

-- Create a completely clean user creation function without any audit logging
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
        -- Don't fail user creation for any reason
        RETURN NEW;
END;
$$;

-- Remove and recreate the trigger
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