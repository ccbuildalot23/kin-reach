-- Migration: Create comprehensive consent management system for HIPAA compliance

-- Create consent types enum
CREATE TYPE consent_type AS ENUM (
    'privacy_notice',           -- HIPAA Notice of Privacy Practices
    'terms_of_service',        -- General terms
    'sms_communications',      -- SMS messaging consent
    'email_communications',    -- Email messaging consent
    'data_sharing',           -- Sharing with support network
    'crisis_alerts',          -- Emergency contact notifications
    'treatment_records',      -- Recovery information storage
    'third_party_services'    -- Twilio, email providers, etc.
);

-- Create consent status enum
CREATE TYPE consent_status AS ENUM (
    'granted',
    'denied',
    'withdrawn',
    'expired'
);

-- Create consent versions table to track policy updates
CREATE TABLE public.consent_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consent_type consent_type NOT NULL,
    version VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    requires_reconfirmation BOOLEAN DEFAULT false,
    UNIQUE(consent_type, version)
);

-- Create user consents table
CREATE TABLE public.user_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_version_id UUID NOT NULL REFERENCES consent_versions(id),
    consent_type consent_type NOT NULL,
    status consent_status NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    method VARCHAR(50), -- 'checkbox', 'button', 'sms_reply', etc.
    parent_consent_id UUID REFERENCES user_consents(id), -- For consent updates
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create consent audit log for compliance
CREATE TABLE public.consent_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    consent_id UUID REFERENCES user_consents(id),
    action VARCHAR(50) NOT NULL, -- 'presented', 'granted', 'denied', 'withdrawn'
    consent_type consent_type NOT NULL,
    consent_version VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_type_status ON user_consents(consent_type, status);
CREATE INDEX idx_consent_audit_user_id ON consent_audit_log(user_id, created_at DESC);

-- Mark tables as containing PHI
COMMENT ON TABLE public.user_consents IS 'PHI: User consent records for HIPAA compliance';
COMMENT ON TABLE public.consent_audit_log IS 'PHI: Consent audit trail for compliance';

-- Create view for current active consents
CREATE OR REPLACE VIEW current_user_consents AS
SELECT DISTINCT ON (uc.user_id, uc.consent_type)
    uc.user_id,
    uc.consent_type,
    uc.status,
    uc.granted_at,
    uc.withdrawn_at,
    cv.version,
    cv.title,
    cv.effective_date,
    uc.created_at as consent_date
FROM user_consents uc
JOIN consent_versions cv ON uc.consent_version_id = cv.id
ORDER BY uc.user_id, uc.consent_type, uc.created_at DESC;

-- Function to check if user has valid consent
CREATE OR REPLACE FUNCTION has_valid_consent(
    p_user_id UUID,
    p_consent_type consent_type
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM current_user_consents 
        WHERE user_id = p_user_id 
        AND consent_type = p_consent_type 
        AND status = 'granted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record consent action
CREATE OR REPLACE FUNCTION record_consent(
    p_user_id UUID,
    p_consent_type consent_type,
    p_version_id UUID,
    p_status consent_status,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_method VARCHAR(50) DEFAULT 'checkbox'
) RETURNS UUID AS $$
DECLARE
    v_consent_id UUID;
BEGIN
    -- Insert consent record
    INSERT INTO user_consents (
        user_id,
        consent_version_id,
        consent_type,
        status,
        granted_at,
        withdrawn_at,
        ip_address,
        user_agent,
        method
    ) VALUES (
        p_user_id,
        p_version_id,
        p_consent_type,
        p_status,
        CASE WHEN p_status = 'granted' THEN NOW() ELSE NULL END,
        CASE WHEN p_status = 'withdrawn' THEN NOW() ELSE NULL END,
        p_ip_address,
        p_user_agent,
        p_method
    ) RETURNING id INTO v_consent_id;
    
    -- Log the action
    INSERT INTO consent_audit_log (
        user_id,
        consent_id,
        action,
        consent_type,
        consent_version,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        v_consent_id,
        p_status::text,
        p_consent_type,
        (SELECT version FROM consent_versions WHERE id = p_version_id),
        p_ip_address,
        p_user_agent
    );
    
    RETURN v_consent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE consent_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view consent versions
CREATE POLICY "Anyone can view active consent versions" 
ON consent_versions FOR SELECT 
USING (is_active = true);

-- Users can view their own consents
CREATE POLICY "Users can view own consents" 
ON user_consents FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own consents
CREATE POLICY "Users can create own consents" 
ON user_consents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own consents
CREATE POLICY "Users can update own consents" 
ON user_consents FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can view their own consent audit log
CREATE POLICY "Users can view own consent audit" 
ON consent_audit_log FOR SELECT 
USING (auth.uid() = user_id);

-- Insert initial consent versions
INSERT INTO consent_versions (consent_type, version, title, content, effective_date) VALUES
(
    'privacy_notice',
    '1.0',
    'HIPAA Notice of Privacy Practices',
    'This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully.

We are required by law to:
- Maintain the privacy of your protected health information (PHI)
- Provide you with this notice of our legal duties and privacy practices
- Follow the terms of the notice currently in effect

How We May Use and Disclose Your Health Information:
- Treatment: We may share your information with your support team members you have authorized
- Healthcare Operations: We may use your information to improve our services
- As Required by Law: We must disclose your information when required by federal, state, or local law

Your Rights:
- Right to inspect and copy your health information
- Right to request restrictions on uses and disclosures
- Right to request confidential communications
- Right to request amendments to your health information
- Right to receive an accounting of disclosures
- Right to receive a copy of this notice

By using our services, you acknowledge receipt of this Notice of Privacy Practices.',
    NOW()
),
(
    'sms_communications',
    '1.0',
    'SMS Messaging Consent',
    'By providing your phone number and opting in, you consent to receive SMS messages from Kin-Reach and your designated support team members. Message frequency varies. Message and data rates may apply. Reply STOP to opt out at any time.',
    NOW()
),
(
    'crisis_alerts',
    '1.0',
    'Crisis Alert Consent',
    'I authorize Kin-Reach to notify my designated emergency contacts when I trigger a crisis alert. I understand this may include sharing my current emotional state and pre-written messages with my support team.',
    NOW()
),
(
    'data_sharing',
    '1.0',
    'Support Network Data Sharing',
    'I consent to share limited profile information with members of my support team, including my name, recovery milestones, and support requests. I can manage these permissions at any time.',
    NOW()
);

-- Trigger to update updated_at
CREATE TRIGGER update_user_consents_updated_at
    BEFORE UPDATE ON user_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON consent_versions TO authenticated;
GRANT ALL ON user_consents TO authenticated;
GRANT INSERT ON consent_audit_log TO authenticated;
GRANT SELECT ON current_user_consents TO authenticated;
GRANT EXECUTE ON FUNCTION has_valid_consent TO authenticated;
GRANT EXECUTE ON FUNCTION record_consent TO authenticated;