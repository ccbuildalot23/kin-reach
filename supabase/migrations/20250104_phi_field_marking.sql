-- Migration: Mark PHI (Protected Health Information) fields for HIPAA compliance
-- This migration adds comments to identify which fields contain PHI

-- PROFILES TABLE - PHI Fields
COMMENT ON COLUMN public.profiles.phone IS 'PHI: Patient phone number';
COMMENT ON COLUMN public.profiles.recovery_start_date IS 'PHI: Recovery/clean date - medical information';
COMMENT ON COLUMN public.profiles.display_name IS 'PHI: Patient identifying information';
COMMENT ON COLUMN public.profiles.bio IS 'PHI: May contain health/recovery information';
COMMENT ON COLUMN public.profiles.recovery_program IS 'PHI: Treatment program information';
COMMENT ON COLUMN public.profiles.emergency_contact_name IS 'PHI: Emergency contact identifying information';
COMMENT ON COLUMN public.profiles.emergency_contact_phone IS 'PHI: Emergency contact phone number';

-- SUPPORT_NETWORK TABLE - PHI Fields
COMMENT ON TABLE public.support_network IS 'PHI: Contains patient support network and relationships';
COMMENT ON COLUMN public.support_network.name IS 'PHI: Support person identifying information';
COMMENT ON COLUMN public.support_network.phone_number IS 'PHI: Support person phone number';
COMMENT ON COLUMN public.support_network.relationship IS 'PHI: Relationship to patient';
COMMENT ON COLUMN public.support_network.notes IS 'PHI: May contain health/recovery information';

-- CRISIS_ALERTS TABLE - PHI Fields
COMMENT ON TABLE public.crisis_alerts IS 'PHI: Crisis event records and messages';
COMMENT ON COLUMN public.crisis_alerts.message_sent IS 'PHI: Crisis message content';
COMMENT ON COLUMN public.crisis_alerts.alert_time IS 'PHI: Medical event timestamp';
COMMENT ON COLUMN public.crisis_alerts.contacts_notified IS 'PHI: Crisis response information';

-- CRISIS_CONTACTS TABLE - PHI Fields
COMMENT ON TABLE public.crisis_contacts IS 'PHI: Emergency contact information';
COMMENT ON COLUMN public.crisis_contacts.name IS 'PHI: Emergency contact name';
COMMENT ON COLUMN public.crisis_contacts.phone_number IS 'PHI: Emergency contact phone';
COMMENT ON COLUMN public.crisis_contacts.relationship IS 'PHI: Relationship to patient';

-- SUPPORT_REQUESTS TABLE - PHI Fields
COMMENT ON TABLE public.support_requests IS 'PHI: Support request history';
COMMENT ON COLUMN public.support_requests.mood IS 'PHI: Mental health status';
COMMENT ON COLUMN public.support_requests.message IS 'PHI: Support request content';
COMMENT ON COLUMN public.support_requests.request_time IS 'PHI: Medical event timestamp';

-- NOTIFICATIONS TABLE - PHI Fields
COMMENT ON TABLE public.notifications IS 'PHI: May contain health-related notifications';
COMMENT ON COLUMN public.notifications.body IS 'PHI: Notification content may contain health info';

-- NOTIFICATION_QUEUE TABLE - PHI Fields
COMMENT ON TABLE public.notification_queue IS 'PHI: Queued communications to patients';
COMMENT ON COLUMN public.notification_queue.body IS 'PHI: Message content';
COMMENT ON COLUMN public.notification_queue.recipient_address IS 'PHI: Patient contact information';

-- ACCOUNTABILITY_PARTNERSHIPS TABLE - PHI Fields
COMMENT ON TABLE public.accountability_partnerships IS 'PHI: Recovery partnership information';
COMMENT ON COLUMN public.accountability_partnerships.partnership_name IS 'PHI: Recovery relationship info';
COMMENT ON COLUMN public.accountability_partnerships.goal IS 'PHI: Recovery goals';
COMMENT ON COLUMN public.accountability_partnerships.check_in_frequency IS 'PHI: Treatment frequency';

-- Create a PHI fields view for easy reference
CREATE OR REPLACE VIEW phi_fields_registry AS
SELECT 
    c.table_schema,
    c.table_name,
    c.column_name,
    c.data_type,
    obj_description(pgc.oid, 'pg_class') as table_comment,
    col_description(pgc.oid, a.attnum) as column_comment,
    CASE 
        WHEN col_description(pgc.oid, a.attnum) LIKE 'PHI:%' THEN true
        ELSE false
    END as contains_phi
FROM information_schema.columns c
JOIN pg_class pgc ON pgc.relname = c.table_name
JOIN pg_attribute a ON a.attrelid = pgc.oid AND a.attname = c.column_name
WHERE c.table_schema = 'public'
    AND col_description(pgc.oid, a.attnum) IS NOT NULL
ORDER BY c.table_name, c.column_name;

-- Grant select on PHI registry to authenticated users
GRANT SELECT ON phi_fields_registry TO authenticated;

-- Add audit trigger for PHI access (enhanced from existing audit_log)
CREATE OR REPLACE FUNCTION log_phi_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log access to tables containing PHI
    IF TG_TABLE_NAME IN ('profiles', 'support_network', 'crisis_alerts', 'crisis_contacts', 
                         'support_requests', 'notifications', 'notification_queue', 
                         'accountability_partnerships') THEN
        INSERT INTO public.audit_logs (
            event_type,
            user_id,
            resource_type,
            resource_id,
            ip_address,
            user_agent,
            metadata
        ) VALUES (
            'phi_access',
            auth.uid(),
            TG_TABLE_NAME,
            CASE 
                WHEN TG_OP = 'DELETE' THEN OLD.id::text
                ELSE NEW.id::text
            END,
            current_setting('request.headers', true)::json->>'x-forwarded-for',
            current_setting('request.headers', true)::json->>'user-agent',
            jsonb_build_object(
                'operation', TG_OP,
                'table', TG_TABLE_NAME,
                'timestamp', NOW(),
                'phi_access', true
            )
        );
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add PHI access logging to sensitive tables
CREATE TRIGGER log_profiles_phi_access
    AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION log_phi_access();

CREATE TRIGGER log_support_network_phi_access
    AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.support_network
    FOR EACH ROW EXECUTE FUNCTION log_phi_access();

CREATE TRIGGER log_crisis_alerts_phi_access
    AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.crisis_alerts
    FOR EACH ROW EXECUTE FUNCTION log_phi_access();

-- Create index for faster PHI audit queries
CREATE INDEX idx_audit_logs_phi_access 
ON public.audit_logs(event_type, created_at) 
WHERE event_type = 'phi_access';