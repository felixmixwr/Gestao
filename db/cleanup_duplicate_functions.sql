-- Script para limpar funções duplicadas de auditoria
-- Execute este script no Supabase SQL Editor

-- 1. Verificar todas as funções log_audit_event_comprehensive existentes
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types,
    oid
FROM pg_proc 
WHERE proname = 'log_audit_event_comprehensive'
ORDER BY oid;

-- 2. Verificar todas as funções audit_trigger_function existentes
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types,
    oid
FROM pg_proc 
WHERE proname = 'audit_trigger_function'
ORDER BY oid;

-- 3. Verificar todas as funções get_current_user_info existentes
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types,
    oid
FROM pg_proc 
WHERE proname = 'get_current_user_info'
ORDER BY oid;

-- 4. Remover TODAS as versões das funções (usando CASCADE para remover dependências)
DROP FUNCTION IF EXISTS log_audit_event_comprehensive CASCADE;
DROP FUNCTION IF EXISTS audit_trigger_function CASCADE;
DROP FUNCTION IF EXISTS get_current_user_info CASCADE;

-- 5. Verificar se as funções foram removidas
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types
FROM pg_proc 
WHERE proname IN ('log_audit_event_comprehensive', 'audit_trigger_function', 'get_current_user_info')
ORDER BY proname;

-- 6. Recriar função get_current_user_info
CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS TABLE(user_id UUID, user_email VARCHAR(255)) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as user_id,
        auth.email()::VARCHAR(255) as user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Recriar função log_audit_event_comprehensive
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

-- 8. Recriar função audit_trigger_function
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

-- 9. Conceder permissões
GRANT EXECUTE ON FUNCTION get_current_user_info() TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event_comprehensive TO authenticated;
GRANT EXECUTE ON FUNCTION audit_trigger_function() TO authenticated;

-- 10. Verificar se as funções foram criadas corretamente
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types
FROM pg_proc 
WHERE proname IN ('log_audit_event_comprehensive', 'audit_trigger_function', 'get_current_user_info')
ORDER BY proname;

-- 11. Tornar coluna rep_name nullable (se necessário)
DO $$
BEGIN
    -- Verificar se rep_name é NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'rep_name'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE clients ALTER COLUMN rep_name DROP NOT NULL;
        RAISE NOTICE 'Coluna rep_name tornada nullable';
    ELSE
        RAISE NOTICE 'Coluna rep_name já é nullable ou não existe';
    END IF;
END $$;

-- 12. Recriar trigger para clients
DROP TRIGGER IF EXISTS audit_clients_trigger ON clients;
CREATE TRIGGER audit_clients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 13. Testar inserção de cliente
DO $$
DECLARE
    test_company_id UUID;
    test_client_id UUID;
BEGIN
    -- Verificar se há empresas
    SELECT id INTO test_company_id FROM companies LIMIT 1;
    
    IF test_company_id IS NOT NULL THEN
        -- Tentar inserir cliente de teste
        INSERT INTO clients (name, company_id) 
        VALUES ('Cliente Teste Cleanup', test_company_id)
        RETURNING id INTO test_client_id;
        
        RAISE NOTICE 'Cliente de teste inserido com sucesso. ID: %', test_client_id;
        
        -- Limpar cliente de teste
        DELETE FROM clients WHERE id = test_client_id;
        RAISE NOTICE 'Cliente de teste removido';
    ELSE
        RAISE NOTICE 'Nenhuma empresa encontrada para teste';
    END IF;
END $$;
