-- Create audit_logs table for HIPAA compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    event_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    session_id TEXT,
    resource_type TEXT,
    resource_id TEXT,
    action TEXT NOT NULL,
    outcome TEXT NOT NULL,
    error_message TEXT,
    additional_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_timestamp ON public.audit_logs(event_timestamp);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_outcome ON public.audit_logs(outcome);
CREATE INDEX idx_audit_logs_composite ON public.audit_logs(user_id, event_timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read their own audit logs
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Function to log authentication events
CREATE OR REPLACE FUNCTION public.log_auth_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_action TEXT,
    p_outcome TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_device_info JSONB DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_additional_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        event_type,
        ip_address,
        user_agent,
        device_info,
        session_id,
        action,
        outcome,
        error_message,
        additional_data
    ) VALUES (
        p_user_id,
        p_event_type,
        p_ip_address,
        p_user_agent,
        p_device_info,
        p_session_id,
        p_action,
        p_outcome,
        p_error_message,
        p_additional_data
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for audit log retention policy (6 years for HIPAA)
CREATE OR REPLACE VIEW public.audit_logs_retention AS
SELECT *
FROM public.audit_logs
WHERE event_timestamp >= now() - INTERVAL '6 years';

-- Function to clean up old audit logs (to be run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs() RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM public.audit_logs
    WHERE event_timestamp < now() - INTERVAL '6 years'
    RETURNING COUNT(*) INTO v_deleted_count;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create table for tracking user sessions (for session timeout)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for user sessions
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Enable Row Level Security for user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Function to update session activity
CREATE OR REPLACE FUNCTION public.update_session_activity(
    p_session_token TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_session_timeout INTERVAL := INTERVAL '15 minutes';
BEGIN
    UPDATE public.user_sessions
    SET last_activity = now()
    WHERE session_token = p_session_token
    AND expires_at > now()
    AND last_activity > now() - v_session_timeout;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions() RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_sessions
    WHERE expires_at < now()
    OR last_activity < now() - INTERVAL '15 minutes'
    RETURNING COUNT(*) INTO v_deleted_count;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;