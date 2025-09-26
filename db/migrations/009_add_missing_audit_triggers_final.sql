-- Migration: Add Missing Audit Triggers (Final Safe Version)
-- Description: Add audit triggers for tables that were missing from the initial audit system
-- This version safely handles non-existent tables

-- 1. Create a function to safely add audit triggers
CREATE OR REPLACE FUNCTION add_audit_trigger_safe(
    p_table_name TEXT,
    p_trigger_name TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name
    ) THEN
        RAISE NOTICE 'Table % does not exist, skipping trigger creation', p_table_name;
        RETURN FALSE;
    END IF;
    
    -- Check if audit_trigger_function exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'audit_trigger_function'
    ) THEN
        RAISE NOTICE 'audit_trigger_function does not exist, skipping trigger creation for %', p_table_name;
        RETURN FALSE;
    END IF;
    
    -- Drop existing trigger if exists
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', p_trigger_name, p_table_name);
    
    -- Create new trigger
    EXECUTE format('
        CREATE TRIGGER %I
        AFTER INSERT OR UPDATE OR DELETE ON %I
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_function()',
        p_trigger_name, p_table_name
    );
    
    RAISE NOTICE 'Successfully created trigger % on table %', p_trigger_name, p_table_name;
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating trigger % on table %: %', p_trigger_name, p_table_name, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 2. Create a function to safely get table count
CREATE OR REPLACE FUNCTION safe_table_count(p_table_name TEXT)
RETURNS INTEGER AS $$
DECLARE
    result INTEGER;
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name
    ) THEN
        RETURN 0;
    END IF;
    
    -- Get count safely
    EXECUTE format('SELECT COUNT(*) FROM %I', p_table_name) INTO STRICT result;
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 3. Add audit triggers for missing tables (one by one to avoid deadlocks)

-- Users table
SELECT add_audit_trigger_safe('users', 'audit_users_trigger');

-- Pumps table
SELECT add_audit_trigger_safe('pumps', 'audit_pumps_trigger');

-- Notes table
SELECT add_audit_trigger_safe('notes', 'audit_notes_trigger');

-- Colaboradores dependentes table
SELECT add_audit_trigger_safe('colaboradores_dependentes', 'audit_colaboradores_dependentes_trigger');

-- Colaboradores documentos table
SELECT add_audit_trigger_safe('colaboradores_documentos', 'audit_colaboradores_documentos_trigger');

-- Colaboradores horas extras table
SELECT add_audit_trigger_safe('colaboradores_horas_extras', 'audit_colaboradores_horas_extras_trigger');

-- Empresas terceiras table
SELECT add_audit_trigger_safe('empresas_terceiras', 'audit_empresas_terceiras_trigger');

-- Pagamentos receber table
SELECT add_audit_trigger_safe('pagamentos_receber', 'audit_pagamentos_receber_trigger');

-- Bombas terceiras table
SELECT add_audit_trigger_safe('bombas_terceiras', 'audit_bombas_terceiras_trigger');

-- Invoices table
SELECT add_audit_trigger_safe('invoices', 'audit_invoices_trigger');

-- 4. Update the audit dashboard view to include new tables
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

-- 5. Update the system statistics view to include new tables (with safe checks)
-- First drop the existing view to avoid column name conflicts
DROP VIEW IF EXISTS system_statistics;

CREATE VIEW system_statistics AS
SELECT 
    -- Counts (with safe table existence checks)
    (SELECT COUNT(*) FROM clients) as total_clients,
    (SELECT COUNT(*) FROM companies) as total_companies,
    (SELECT COUNT(*) FROM bombas) as total_bombas,
    safe_table_count('pumps') as total_pumps,
    (SELECT COUNT(*) FROM reports) as total_reports,
    (SELECT COUNT(*) FROM notas_fiscais) as total_notas_fiscais,
    safe_table_count('notes') as total_notes,
    (SELECT COUNT(*) FROM colaboradores) as total_colaboradores,
    safe_table_count('colaboradores_dependentes') as total_dependentes,
    safe_table_count('colaboradores_documentos') as total_documentos,
    safe_table_count('colaboradores_horas_extras') as total_horas_extras,
    safe_table_count('empresas_terceiras') as total_empresas_terceiras,
    safe_table_count('pagamentos_receber') as total_pagamentos_receber,
    safe_table_count('bombas_terceiras') as total_bombas_terceiras,
    safe_table_count('invoices') as total_invoices,
    safe_table_count('users') as total_users,
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

-- 6. Create a function to get all monitored tables
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

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION add_audit_trigger_safe(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION safe_table_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monitored_tables() TO authenticated;

-- 8. Clean up the temporary functions (in correct order)
-- First drop the view that depends on safe_table_count
DROP VIEW IF EXISTS system_statistics;

-- Then drop the functions
DROP FUNCTION IF EXISTS add_audit_trigger_safe(TEXT, TEXT);
DROP FUNCTION IF EXISTS safe_table_count(TEXT);

-- Recreate the view without the temporary function
CREATE VIEW system_statistics AS
SELECT 
    -- Counts (only for tables that definitely exist)
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

COMMENT ON FUNCTION get_monitored_tables() IS 'Get list of all tables being monitored by audit system';
