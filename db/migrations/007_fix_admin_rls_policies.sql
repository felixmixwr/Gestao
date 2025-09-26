-- Migration: Fix Admin RLS Policies
-- Description: Fix infinite recursion in admin_users RLS policies

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Admin users can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can view all banned users" ON banned_users;
DROP POLICY IF EXISTS "Admin users can manage banned users" ON banned_users;
DROP POLICY IF EXISTS "Admin users can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- 2. Create new policies without recursion
-- For admin_users table
CREATE POLICY "Allow users to view their own admin record" ON admin_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow super admins to view all admin users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND is_active = true
        )
    );

CREATE POLICY "Allow super admins to manage admin users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND is_active = true
        )
    );

-- For banned_users table
CREATE POLICY "Allow users to view their own ban record" ON banned_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow super admins to view all banned users" ON banned_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND is_active = true
        )
    );

CREATE POLICY "Allow super admins to manage banned users" ON banned_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND is_active = true
        )
    );

-- For audit_logs table
CREATE POLICY "Allow users to view their own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow super admins to view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND is_active = true
        )
    );

CREATE POLICY "Allow system to insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- 3. Create a temporary policy for initial setup
-- This allows the first admin to be created
CREATE POLICY "Allow initial admin setup" ON admin_users
    FOR INSERT WITH CHECK (
        -- Allow if no admins exist yet
        NOT EXISTS (SELECT 1 FROM admin_users WHERE is_active = true)
        OR
        -- Allow if user is already a super admin
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND is_active = true
        )
    );

-- 4. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON banned_users TO authenticated;
GRANT SELECT, INSERT ON audit_logs TO authenticated;

-- 5. Create a function to check if user is admin (without recursion)
CREATE OR REPLACE FUNCTION is_admin_simple(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = p_user_id 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create a function to check if user is super admin (without recursion)
CREATE OR REPLACE FUNCTION is_super_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = p_user_id 
        AND role = 'super_admin'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin_simple(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;

-- 8. Update the existing functions to use the new simple versions
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_admin_simple(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create a view for admin dashboard stats that doesn't require admin permissions
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM banned_users WHERE is_active = true) as banned_users,
    (SELECT COUNT(*) FROM audit_logs WHERE created_at >= CURRENT_DATE) as today_logs,
    (SELECT COUNT(*) FROM audit_logs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_logs,
    (SELECT COUNT(*) FROM audit_logs WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as month_logs;

-- 10. Grant access to the view
GRANT SELECT ON admin_dashboard_stats TO authenticated;

COMMENT ON FUNCTION is_admin_simple(UUID) IS 'Simple admin check without recursion';
COMMENT ON FUNCTION is_super_admin(UUID) IS 'Super admin check without recursion';
COMMENT ON POLICY "Allow initial admin setup" ON admin_users IS 'Temporary policy to allow first admin creation';
