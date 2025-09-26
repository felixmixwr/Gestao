-- Script rápido para corrigir funções de auditoria
-- Execute este script no Supabase SQL Editor

-- 1. Remover triggers que estão causando erro
DROP TRIGGER IF EXISTS audit_clients_trigger ON clients;

-- 2. Verificar se a tabela audit_logs_comprehensive existe
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

-- 3. Criar função get_current_user_info
CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS TABLE(user_id UUID, user_email VARCHAR(255)) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as user_id,
        auth.email()::VARCHAR(255) as user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar função log_audit_event_comprehensive
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

-- 5. Criar função audit_trigger_function
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

-- 6. Conceder permissões
GRANT EXECUTE ON FUNCTION get_current_user_info() TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event_comprehensive TO authenticated;
GRANT EXECUTE ON FUNCTION audit_trigger_function() TO authenticated;

-- 7. Habilitar RLS na tabela audit_logs_comprehensive
ALTER TABLE audit_logs_comprehensive ENABLE ROW LEVEL SECURITY;

-- 8. Criar política RLS para audit_logs_comprehensive
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON audit_logs_comprehensive;
CREATE POLICY "Enable read access for authenticated users" ON audit_logs_comprehensive
    FOR SELECT USING (auth.role() = 'authenticated');

-- 9. Recriar trigger para clients (agora que as funções existem)
CREATE TRIGGER audit_clients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 10. Testar inserção de cliente
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
        VALUES ('Cliente Teste Quick Fix', test_company_id)
        RETURNING id INTO test_client_id;
        
        RAISE NOTICE 'Cliente de teste inserido com sucesso. ID: %', test_client_id;
        
        -- Limpar cliente de teste
        DELETE FROM clients WHERE id = test_client_id;
        RAISE NOTICE 'Cliente de teste removido';
    ELSE
        RAISE NOTICE 'Nenhuma empresa encontrada para teste';
    END IF;
END $$;
