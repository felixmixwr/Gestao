-- Script para criar as funções de auditoria que estão faltando
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se as funções existem
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types
FROM pg_proc 
WHERE proname IN ('log_audit_event_comprehensive', 'audit_trigger_function', 'get_current_user_info')
ORDER BY proname;

-- 2. Verificar se a tabela audit_logs_comprehensive existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'audit_logs_comprehensive';

-- 3. Criar tabela audit_logs_comprehensive se não existir
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

-- 4. Criar função get_current_user_info se não existir
CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS TABLE(user_id UUID, user_email VARCHAR(255)) AS $$
BEGIN
    -- Try to get user info from auth.users
    BEGIN
        RETURN QUERY
        SELECT 
            au.id::UUID as user_id,
            au.email::VARCHAR(255) as user_email
        FROM auth.users au
        WHERE au.id = auth.uid();
    EXCEPTION
        WHEN OTHERS THEN
            -- If auth.users is not accessible, return NULL values
            RETURN QUERY
            SELECT NULL::UUID as user_id, NULL::VARCHAR(255) as user_email;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar função log_audit_event_comprehensive se não existir
CREATE OR REPLACE FUNCTION log_audit_event_comprehensive(
    p_table_name NAME,
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
        p_table_name::VARCHAR(100), p_operation, p_old_data, p_new_data,
        current_user_id, current_user_email, p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar função audit_trigger_function se não existir
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

-- 7. Conceder permissões
GRANT EXECUTE ON FUNCTION get_current_user_info() TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event_comprehensive TO authenticated;
GRANT EXECUTE ON FUNCTION audit_trigger_function() TO authenticated;

-- 8. Habilitar RLS na tabela audit_logs_comprehensive
ALTER TABLE audit_logs_comprehensive ENABLE ROW LEVEL SECURITY;

-- 9. Criar política RLS para audit_logs_comprehensive
CREATE POLICY "Enable read access for authenticated users" ON audit_logs_comprehensive
    FOR SELECT USING (auth.role() = 'authenticated');

-- 10. Verificar se as funções foram criadas
SELECT 
    proname as function_name,
    proargnames as argument_names
FROM pg_proc 
WHERE proname IN ('log_audit_event_comprehensive', 'audit_trigger_function', 'get_current_user_info')
ORDER BY proname;

-- 11. Testar as funções
DO $$
DECLARE
    test_log_id UUID;
BEGIN
    -- Testar log_audit_event_comprehensive
    SELECT log_audit_event_comprehensive(
        'test_table',
        'INSERT',
        NULL,
        '{"test": "data"}'::jsonb,
        '{"test_metadata": "value"}'::jsonb
    ) INTO test_log_id;
    
    RAISE NOTICE 'Função log_audit_event_comprehensive testada com sucesso. Log ID: %', test_log_id;
    
    -- Limpar log de teste
    DELETE FROM audit_logs_comprehensive WHERE id = test_log_id;
    RAISE NOTICE 'Log de teste removido';
END $$;
