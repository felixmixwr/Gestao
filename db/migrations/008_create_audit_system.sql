-- Migration: Create Comprehensive Audit System
-- Description: Create audit triggers for all tables to track all changes

-- 1. Create audit_logs_comprehensive table for detailed tracking
CREATE TABLE IF NOT EXISTS audit_logs_comprehensive (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    user_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_comprehensive_table_name ON audit_logs_comprehensive(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_comprehensive_operation ON audit_logs_comprehensive(operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_comprehensive_user_id ON audit_logs_comprehensive(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_comprehensive_timestamp ON audit_logs_comprehensive(timestamp);

-- 3. Create function to get current user info
CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS TABLE(user_id UUID, user_email VARCHAR(255)) AS $$
BEGIN
    -- Try to get user from JWT token
    BEGIN
        RETURN QUERY
        SELECT 
            auth.uid() as user_id,
            auth.jwt() ->> 'email' as user_email;
    EXCEPTION
        WHEN OTHERS THEN
            -- If JWT is not available, return null
            RETURN QUERY
            SELECT NULL::UUID as user_id, NULL::VARCHAR(255) as user_email;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event_comprehensive(
    p_table_name VARCHAR(100),
    p_operation VARCHAR(10),
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    current_user_id UUID;
    current_user_email VARCHAR(255);
BEGIN
    -- Get current user info
    SELECT user_id, user_email INTO current_user_id, current_user_email
    FROM get_current_user_info();
    
    -- Insert audit log
    INSERT INTO audit_logs_comprehensive (
        table_name, operation, old_data, new_data, 
        user_id, user_email, metadata
    ) VALUES (
        p_table_name, p_operation, p_old_data, p_new_data,
        current_user_id, current_user_email, p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    operation VARCHAR(10);
BEGIN
    -- Determine operation type
    IF TG_OP = 'DELETE' THEN
        operation := 'DELETE';
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        operation := 'UPDATE';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        operation := 'INSERT';
        old_data := NULL;
        new_data := to_jsonb(NEW);
    END IF;
    
    -- Log the audit event
    PERFORM log_audit_event_comprehensive(
        TG_TABLE_NAME,
        operation,
        old_data,
        new_data,
        jsonb_build_object(
            'trigger_name', TG_NAME,
            'trigger_schema', TG_TABLE_SCHEMA
        )
    );
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create audit triggers for all main tables

-- Clients table
DROP TRIGGER IF EXISTS audit_clients_trigger ON clients;
CREATE TRIGGER audit_clients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Companies table
DROP TRIGGER IF EXISTS audit_companies_trigger ON companies;
CREATE TRIGGER audit_companies_trigger
    AFTER INSERT OR UPDATE OR DELETE ON companies
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Bombas table
DROP TRIGGER IF EXISTS audit_bombas_trigger ON bombas;
CREATE TRIGGER audit_bombas_trigger
    AFTER INSERT OR UPDATE OR DELETE ON bombas
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Reports table
DROP TRIGGER IF EXISTS audit_reports_trigger ON reports;
CREATE TRIGGER audit_reports_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reports
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Notas fiscais table
DROP TRIGGER IF EXISTS audit_notas_fiscais_trigger ON notas_fiscais;
CREATE TRIGGER audit_notas_fiscais_trigger
    AFTER INSERT OR UPDATE OR DELETE ON notas_fiscais
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Colaboradores table
DROP TRIGGER IF EXISTS audit_colaboradores_trigger ON colaboradores;
CREATE TRIGGER audit_colaboradores_trigger
    AFTER INSERT OR UPDATE OR DELETE ON colaboradores
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Programacao table
DROP TRIGGER IF EXISTS audit_programacao_trigger ON programacao;
CREATE TRIGGER audit_programacao_trigger
    AFTER INSERT OR UPDATE OR DELETE ON programacao
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Admin users table
DROP TRIGGER IF EXISTS audit_admin_users_trigger ON admin_users;
CREATE TRIGGER audit_admin_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Banned users table
DROP TRIGGER IF EXISTS audit_banned_users_trigger ON banned_users;
CREATE TRIGGER audit_banned_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON banned_users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 7. Create view for comprehensive audit dashboard
CREATE OR REPLACE VIEW audit_dashboard AS
SELECT 
    al.id,
    al.table_name,
    al.operation,
    al.user_email,
    al.timestamp,
    al.old_data,
    al.new_data,
    al.metadata,
    CASE 
        WHEN al.operation = 'INSERT' THEN 'Criado'
        WHEN al.operation = 'UPDATE' THEN 'Atualizado'
        WHEN al.operation = 'DELETE' THEN 'Excluído'
    END as operation_pt,
    CASE 
        WHEN al.table_name = 'clients' THEN 'Cliente'
        WHEN al.table_name = 'companies' THEN 'Empresa'
        WHEN al.table_name = 'bombas' THEN 'Bomba'
        WHEN al.table_name = 'reports' THEN 'Relatório'
        WHEN al.table_name = 'notas_fiscais' THEN 'Nota Fiscal'
        WHEN al.table_name = 'colaboradores' THEN 'Colaborador'
        WHEN al.table_name = 'programacao' THEN 'Programação'
        WHEN al.table_name = 'admin_users' THEN 'Usuário Admin'
        WHEN al.table_name = 'banned_users' THEN 'Usuário Banido'
        ELSE al.table_name
    END as table_name_pt
FROM audit_logs_comprehensive al
ORDER BY al.timestamp DESC;

-- 8. Create view for system statistics
CREATE OR REPLACE VIEW system_statistics AS
SELECT 
    -- Counts
    (SELECT COUNT(*) FROM clients) as total_clients,
    (SELECT COUNT(*) FROM companies) as total_companies,
    (SELECT COUNT(*) FROM bombas) as total_bombas,
    (SELECT COUNT(*) FROM reports) as total_reports,
    (SELECT COUNT(*) FROM notas_fiscais) as total_notas_fiscais,
    (SELECT COUNT(*) FROM colaboradores) as total_colaboradores,
    (SELECT COUNT(*) FROM programacao) as total_programacao,
    (SELECT COUNT(*) FROM admin_users WHERE is_active = true) as total_admins,
    (SELECT COUNT(*) FROM banned_users WHERE is_active = true) as total_banned_users,
    
    -- Recent activity (last 24 hours)
    (SELECT COUNT(*) FROM audit_logs_comprehensive WHERE timestamp >= NOW() - INTERVAL '24 hours') as activity_24h,
    (SELECT COUNT(*) FROM audit_logs_comprehensive WHERE timestamp >= NOW() - INTERVAL '7 days') as activity_7d,
    (SELECT COUNT(*) FROM audit_logs_comprehensive WHERE timestamp >= NOW() - INTERVAL '30 days') as activity_30d,
    
    -- Most active users (last 7 days)
    (SELECT json_agg(
        json_build_object(
            'email', user_email,
            'count', count
        )
    ) FROM (
        SELECT user_email, COUNT(*) as count
        FROM audit_logs_comprehensive
        WHERE timestamp >= NOW() - INTERVAL '7 days'
        AND user_email IS NOT NULL
        GROUP BY user_email
        ORDER BY count DESC
        LIMIT 5
    ) top_users) as top_users_7d,
    
    -- Most modified tables (last 7 days)
    (SELECT json_agg(
        json_build_object(
            'table', table_name,
            'count', count
        )
    ) FROM (
        SELECT table_name, COUNT(*) as count
        FROM audit_logs_comprehensive
        WHERE timestamp >= NOW() - INTERVAL '7 days'
        GROUP BY table_name
        ORDER BY count DESC
        LIMIT 5
    ) top_tables) as top_tables_7d;

-- 9. Enable RLS on audit_logs_comprehensive
ALTER TABLE audit_logs_comprehensive ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for audit_logs_comprehensive
CREATE POLICY "Super admins can view all audit logs" ON audit_logs_comprehensive
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin' 
            AND is_active = true
        )
    );

CREATE POLICY "Users can view their own audit logs" ON audit_logs_comprehensive
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs" ON audit_logs_comprehensive
    FOR INSERT WITH CHECK (true);

-- 11. Grant permissions
GRANT SELECT ON audit_dashboard TO authenticated;
GRANT SELECT ON system_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_info() TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event_comprehensive TO authenticated;

-- 12. Create function to get audit summary by table
CREATE OR REPLACE FUNCTION get_audit_summary_by_table(
    p_table_name VARCHAR(100) DEFAULT NULL,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
    table_name VARCHAR(100),
    total_operations BIGINT,
    insertions BIGINT,
    updates BIGINT,
    deletions BIGINT,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.table_name,
        COUNT(*) as total_operations,
        COUNT(*) FILTER (WHERE al.operation = 'INSERT') as insertions,
        COUNT(*) FILTER (WHERE al.operation = 'UPDATE') as updates,
        COUNT(*) FILTER (WHERE al.operation = 'DELETE') as deletions,
        MAX(al.timestamp) as last_activity
    FROM audit_logs_comprehensive al
    WHERE al.timestamp >= NOW() - (p_days || ' days')::INTERVAL
    AND (p_table_name IS NULL OR al.table_name = p_table_name)
    GROUP BY al.table_name
    ORDER BY total_operations DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Grant execute permission
GRANT EXECUTE ON FUNCTION get_audit_summary_by_table TO authenticated;

COMMENT ON TABLE audit_logs_comprehensive IS 'Comprehensive audit log for all system changes';
COMMENT ON FUNCTION audit_trigger_function() IS 'Generic trigger function for audit logging';
COMMENT ON VIEW audit_dashboard IS 'Dashboard view for audit logs with Portuguese labels';
COMMENT ON VIEW system_statistics IS 'System statistics and activity summary';
COMMENT ON FUNCTION get_audit_summary_by_table IS 'Get audit summary by table for specified period';
