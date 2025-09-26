-- Migration: Create Admin System
-- Description: Creates tables and functions for admin panel, user banning, and audit logs

-- 1. Create admin_users table for admin permissions
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create banned_users table
CREATE TABLE IF NOT EXISTS banned_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    reason TEXT,
    banned_by UUID NOT NULL REFERENCES auth.users(id),
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL means permanent ban
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create audit_logs table for tracking all actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'BAN', 'UNBAN', etc.
    resource_type VARCHAR(100) NOT NULL, -- 'user', 'report', 'client', 'pump', etc.
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_email ON banned_users(email);
CREATE INDEX IF NOT EXISTS idx_banned_users_active ON banned_users(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 5. Create updated_at trigger for admin_users
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

-- 6. Create updated_at trigger for banned_users
CREATE OR REPLACE FUNCTION update_banned_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_banned_users_updated_at
    BEFORE UPDATE ON banned_users
    FOR EACH ROW
    EXECUTE FUNCTION update_banned_users_updated_at();

-- 7. Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_user_email VARCHAR(255),
    p_action VARCHAR(100),
    p_resource_type VARCHAR(100),
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, user_email, action, resource_type, resource_id,
        old_values, new_values, ip_address, user_agent, metadata
    ) VALUES (
        p_user_id, p_user_email, p_action, p_resource_type, p_resource_id,
        p_old_values, p_new_values, p_ip_address, p_user_agent, p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = p_user_id 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to check if user is banned
CREATE OR REPLACE FUNCTION is_user_banned(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM banned_users 
        WHERE user_id = p_user_id 
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to ban user
CREATE OR REPLACE FUNCTION ban_user(
    p_user_id UUID,
    p_reason TEXT,
    p_banned_by UUID,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    ban_id UUID;
    user_email VARCHAR(255);
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;
    
    -- Insert ban record
    INSERT INTO banned_users (user_id, email, reason, banned_by, expires_at)
    VALUES (p_user_id, user_email, p_reason, p_banned_by, p_expires_at)
    RETURNING id INTO ban_id;
    
    -- Log the ban action
    PERFORM log_audit_event(
        p_banned_by,
        (SELECT email FROM auth.users WHERE id = p_banned_by),
        'BAN_USER',
        'user',
        p_user_id,
        NULL,
        jsonb_build_object('reason', p_reason, 'expires_at', p_expires_at),
        NULL,
        NULL,
        jsonb_build_object('ban_id', ban_id)
    );
    
    RETURN ban_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to unban user
CREATE OR REPLACE FUNCTION unban_user(
    p_user_id UUID,
    p_unbanned_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Deactivate ban records
    UPDATE banned_users 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = p_user_id AND is_active = true;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Log the unban action
    PERFORM log_audit_event(
        p_unbanned_by,
        (SELECT email FROM auth.users WHERE id = p_unbanned_by),
        'UNBAN_USER',
        'user',
        p_user_id,
        NULL,
        NULL,
        NULL,
        NULL,
        jsonb_build_object('affected_rows', affected_rows)
    );
    
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- 12. Insert the super admin user (tavaresambroziovinicius@gmail.com)
-- Note: This will be handled by the application since we need the actual user_id from auth.users

-- 13. Enable Row Level Security (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 14. Create RLS policies for admin_users
CREATE POLICY "Admin users can view all admin users" ON admin_users
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can manage admin users" ON admin_users
    FOR ALL USING (
        is_admin(auth.uid()) AND 
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- 15. Create RLS policies for banned_users
CREATE POLICY "Admin users can view all banned users" ON banned_users
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admin users can manage banned users" ON banned_users
    FOR ALL USING (is_admin(auth.uid()));

-- 16. Create RLS policies for audit_logs
CREATE POLICY "Admin users can view all audit logs" ON audit_logs
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- 17. Create view for admin dashboard statistics
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM banned_users WHERE is_active = true) as banned_users,
    (SELECT COUNT(*) FROM audit_logs WHERE created_at >= CURRENT_DATE) as today_logs,
    (SELECT COUNT(*) FROM audit_logs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_logs,
    (SELECT COUNT(*) FROM audit_logs WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as month_logs;

-- 18. Grant necessary permissions
GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_banned(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION ban_user TO authenticated;
GRANT EXECUTE ON FUNCTION unban_user TO authenticated;

-- 19. Create trigger to automatically log user actions on main tables
-- This will be implemented in the application layer for better control

COMMENT ON TABLE admin_users IS 'Stores admin user permissions and roles';
COMMENT ON TABLE banned_users IS 'Stores information about banned users';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit log of all system actions';
COMMENT ON FUNCTION is_admin(UUID) IS 'Checks if a user has admin privileges';
COMMENT ON FUNCTION is_user_banned(UUID) IS 'Checks if a user is currently banned';
COMMENT ON FUNCTION log_audit_event IS 'Logs an audit event with full context';
COMMENT ON FUNCTION ban_user IS 'Bans a user and logs the action';
COMMENT ON FUNCTION unban_user IS 'Unbans a user and logs the action';
