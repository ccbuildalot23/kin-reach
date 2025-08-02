-- Fix user creation issues: Remove duplicate triggers and consolidate role assignment

-- 1. Drop the redundant assign_default_role trigger (keep handle_new_user which is more comprehensive)
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;

-- 2. Drop the assign_default_role function as it's no longer needed
DROP FUNCTION IF EXISTS public.assign_default_role();

-- 3. Update the handle_new_user function to be more robust and handle race conditions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Insert into profiles table (with conflict handling)
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
    
    -- Always assign patient role (secure default) with improved conflict handling
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'patient'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Log successful user creation
    INSERT INTO public.audit_logs (
        user_id,
        action,
        details_encrypted,
        timestamp
    ) VALUES (
        NEW.id,
        'USER_CREATED_SUCCESSFULLY',
        jsonb_build_object(
            'user_id', NEW.id,
            'email', NEW.email,
            'has_full_name', (NEW.raw_user_meta_data ->> 'full_name') IS NOT NULL,
            'security_context', 'user_registration',
            'timestamp', now()
        )::text,
        now()
    );
    
    RETURN NEW;
EXCEPTION 
    WHEN OTHERS THEN
        -- Log the error but don't fail user creation
        INSERT INTO public.audit_logs (
            user_id,
            action,
            details_encrypted,
            timestamp
        ) VALUES (
            NEW.id,
            'USER_CREATION_ERROR_HANDLED',
            jsonb_build_object(
                'user_id', NEW.id,
                'error_message', SQLERRM,
                'error_state', SQLSTATE,
                'security_context', 'error_recovery',
                'timestamp', now()
            )::text,
            now()
        );
        RETURN NEW;
END;
$$;

-- 4. Ensure the remaining trigger is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Clean up any potential duplicate role entries for existing users
WITH duplicate_roles AS (
    SELECT user_id, role, id,
           ROW_NUMBER() OVER (PARTITION BY user_id, role ORDER BY assigned_at ASC NULLS LAST, id) as rn
    FROM public.user_roles
)
DELETE FROM public.user_roles 
WHERE id IN (
    SELECT id FROM duplicate_roles WHERE rn > 1
);

-- 6. Ensure all existing users have at least the patient role
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT au.id, 'patient'::app_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;