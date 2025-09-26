-- Script para criar trigger que preenche automaticamente o campo 'name' na tabela clients
-- Execute este script no SQL Editor do Supabase

-- 1. Criar função para preencher o campo 'name' automaticamente
CREATE OR REPLACE FUNCTION fill_client_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o campo 'name' estiver vazio ou NULL, preencher com company_name ou rep_name
    IF NEW.name IS NULL OR NEW.name = '' THEN
        NEW.name = COALESCE(
            NULLIF(NEW.company_name, ''), 
            NULLIF(NEW.rep_name, ''), 
            'Cliente ' || SUBSTRING(NEW.id::text, 1, 8)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger para executar a função antes de INSERT ou UPDATE
DROP TRIGGER IF EXISTS trigger_fill_client_name ON clients;
CREATE TRIGGER trigger_fill_client_name
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION fill_client_name();

-- 3. Testar o trigger criando um cliente de teste (opcional)
-- INSERT INTO clients (rep_name, company_name, email) 
-- VALUES ('Teste Trigger', 'Empresa Teste', 'teste@exemplo.com');

-- 4. Verificar se o trigger foi criado corretamente
SELECT 'VERIFICANDO TRIGGER CRIADO' as status;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'clients' 
AND trigger_name = 'trigger_fill_client_name';
