-- Migration: Add Missing Audit Triggers
-- Description: Add audit triggers for tables that were missing from the initial audit system

-- 1. Add audit triggers for missing tables

-- Users table
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Pumps table (bombas is already covered, but pumps might be different)
DROP TRIGGER IF EXISTS audit_pumps_trigger ON pumps;
CREATE TRIGGER audit_pumps_trigger
    AFTER INSERT OR UPDATE OR DELETE ON pumps
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Notes table
DROP TRIGGER IF EXISTS audit_notes_trigger ON notes;
CREATE TRIGGER audit_notes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON notes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Colaboradores dependentes table
DROP TRIGGER IF EXISTS audit_colaboradores_dependentes_trigger ON colaboradores_dependentes;
CREATE TRIGGER audit_colaboradores_dependentes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON colaboradores_dependentes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Colaboradores documentos table
DROP TRIGGER IF EXISTS audit_colaboradores_documentos_trigger ON colaboradores_documentos;
CREATE TRIGGER audit_colaboradores_documentos_trigger
    AFTER INSERT OR UPDATE OR DELETE ON colaboradores_documentos
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Colaboradores horas extras table
DROP TRIGGER IF EXISTS audit_colaboradores_horas_extras_trigger ON colaboradores_horas_extras;
CREATE TRIGGER audit_colaboradores_horas_extras_trigger
    AFTER INSERT OR UPDATE OR DELETE ON colaboradores_horas_extras
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Empresas terceiras table
DROP TRIGGER IF EXISTS audit_empresas_terceiras_trigger ON empresas_terceiras;
CREATE TRIGGER audit_empresas_terceiras_trigger
    AFTER INSERT OR UPDATE OR DELETE ON empresas_terceiras
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Pagamentos receber table
DROP TRIGGER IF EXISTS audit_pagamentos_receber_trigger ON pagamentos_receber;
CREATE TRIGGER audit_pagamentos_receber_trigger
    AFTER INSERT OR UPDATE OR DELETE ON pagamentos_receber
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Bombas terceiras table
DROP TRIGGER IF EXISTS audit_bombas_terceiras_trigger ON bombas_terceiras;
CREATE TRIGGER audit_bombas_terceiras_trigger
    AFTER INSERT OR UPDATE OR DELETE ON bombas_terceiras
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Invoices table (if exists)
DROP TRIGGER IF EXISTS audit_invoices_trigger ON invoices;
CREATE TRIGGER audit_invoices_trigger
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 2. Update the audit dashboard view to include new tables
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
        WHEN al.table_name = 'pumps' THEN 'Bomba (Pumps)'
        WHEN al.table_name = 'reports' THEN 'Relatório'
        WHEN al.table_name = 'notas_fiscais' THEN 'Nota Fiscal'
        WHEN al.table_name = 'notes' THEN 'Nota'
        WHEN al.table_name = 'colaboradores' THEN 'Colaborador'
        WHEN al.table_name = 'colaboradores_dependentes' THEN 'Dependente'
        WHEN al.table_name = 'colaboradores_documentos' THEN 'Documento'
        WHEN al.table_name = 'colaboradores_horas_extras' THEN 'Hora Extra'
        WHEN al.table_name = 'empresas_terceiras' THEN 'Empresa Terceira'
        WHEN al.table_name = 'pagamentos_receber' THEN 'Pagamento a Receber'
        WHEN al.table_name = 'bombas_terceiras' THEN 'Bomba Terceira'
        WHEN al.table_name = 'invoices' THEN 'Fatura'
        WHEN al.table_name = 'users' THEN 'Usuário'
        WHEN al.table_name = 'programacao' THEN 'Programação'
        WHEN al.table_name = 'admin_users' THEN 'Usuário Admin'
        WHEN al.table_name = 'banned_users' THEN 'Usuário Banido'
        ELSE al.table_name
    END as table_name_pt
FROM audit_logs_comprehensive al
ORDER BY al.timestamp DESC;

-- 3. Update the system statistics view to include new tables
CREATE OR REPLACE VIEW system_statistics AS
SELECT 
    -- Counts
    (SELECT COUNT(*) FROM clients) as total_clients,
    (SELECT COUNT(*) FROM companies) as total_companies,
    (SELECT COUNT(*) FROM bombas) as total_bombas,
    (SELECT COUNT(*) FROM pumps) as total_pumps,
    (SELECT COUNT(*) FROM reports) as total_reports,
    (SELECT COUNT(*) FROM notas_fiscais) as total_notas_fiscais,
    (SELECT COUNT(*) FROM notes) as total_notes,
    (SELECT COUNT(*) FROM colaboradores) as total_colaboradores,
    (SELECT COUNT(*) FROM colaboradores_dependentes) as total_dependentes,
    (SELECT COUNT(*) FROM colaboradores_documentos) as total_documentos,
    (SELECT COUNT(*) FROM colaboradores_horas_extras) as total_horas_extras,
    (SELECT COUNT(*) FROM empresas_terceiras) as total_empresas_terceiras,
    (SELECT COUNT(*) FROM pagamentos_receber) as total_pagamentos_receber,
    (SELECT COUNT(*) FROM bombas_terceiras) as total_bombas_terceiras,
    (SELECT COUNT(*) FROM invoices) as total_invoices,
    (SELECT COUNT(*) FROM users) as total_users,
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

-- 4. Create a function to get all monitored tables
CREATE OR REPLACE FUNCTION get_monitored_tables()
RETURNS TABLE(table_name VARCHAR(100), table_name_pt VARCHAR(100)) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name,
        CASE 
            WHEN t.table_name = 'clients' THEN 'Cliente'
            WHEN t.table_name = 'companies' THEN 'Empresa'
            WHEN t.table_name = 'bombas' THEN 'Bomba'
            WHEN t.table_name = 'pumps' THEN 'Bomba (Pumps)'
            WHEN t.table_name = 'reports' THEN 'Relatório'
            WHEN t.table_name = 'notas_fiscais' THEN 'Nota Fiscal'
            WHEN t.table_name = 'notes' THEN 'Nota'
            WHEN t.table_name = 'colaboradores' THEN 'Colaborador'
            WHEN t.table_name = 'colaboradores_dependentes' THEN 'Dependente'
            WHEN t.table_name = 'colaboradores_documentos' THEN 'Documento'
            WHEN t.table_name = 'colaboradores_horas_extras' THEN 'Hora Extra'
            WHEN t.table_name = 'empresas_terceiras' THEN 'Empresa Terceira'
            WHEN t.table_name = 'pagamentos_receber' THEN 'Pagamento a Receber'
            WHEN t.table_name = 'bombas_terceiras' THEN 'Bomba Terceira'
            WHEN t.table_name = 'invoices' THEN 'Fatura'
            WHEN t.table_name = 'users' THEN 'Usuário'
            WHEN t.table_name = 'programacao' THEN 'Programação'
            WHEN t.table_name = 'admin_users' THEN 'Usuário Admin'
            WHEN t.table_name = 'banned_users' THEN 'Usuário Banido'
            ELSE t.table_name
        END as table_name_pt
    FROM (
        SELECT DISTINCT table_name 
        FROM audit_logs_comprehensive 
        ORDER BY table_name
    ) t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION get_monitored_tables() TO authenticated;

COMMENT ON FUNCTION get_monitored_tables() IS 'Get list of all tables being monitored by audit system';
COMMENT ON TRIGGER audit_users_trigger ON users IS 'Audit trigger for users table';
COMMENT ON TRIGGER audit_pumps_trigger ON pumps IS 'Audit trigger for pumps table';
COMMENT ON TRIGGER audit_notes_trigger ON notes IS 'Audit trigger for notes table';
COMMENT ON TRIGGER audit_colaboradores_dependentes_trigger ON colaboradores_dependentes IS 'Audit trigger for colaboradores_dependentes table';
COMMENT ON TRIGGER audit_colaboradores_documentos_trigger ON colaboradores_documentos IS 'Audit trigger for colaboradores_documentos table';
COMMENT ON TRIGGER audit_colaboradores_horas_extras_trigger ON colaboradores_horas_extras IS 'Audit trigger for colaboradores_horas_extras table';
COMMENT ON TRIGGER audit_empresas_terceiras_trigger ON empresas_terceiras IS 'Audit trigger for empresas_terceiras table';
COMMENT ON TRIGGER audit_pagamentos_receber_trigger ON pagamentos_receber IS 'Audit trigger for pagamentos_receber table';
COMMENT ON TRIGGER audit_bombas_terceiras_trigger ON bombas_terceiras IS 'Audit trigger for bombas_terceiras table';
COMMENT ON TRIGGER audit_invoices_trigger ON invoices IS 'Audit trigger for invoices table';
