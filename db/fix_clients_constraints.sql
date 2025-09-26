-- Script para corrigir constraints da tabela clients
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura atual
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients'
ORDER BY ordinal_position;

-- 2. Tornar coluna rep_name nullable (se necessário)
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

-- 3. Tornar outras colunas nullable se necessário
DO $$
BEGIN
    -- Verificar e tornar nullable colunas que podem ser opcionais
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'company_name'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE clients ALTER COLUMN company_name DROP NOT NULL;
        RAISE NOTICE 'Coluna company_name tornada nullable';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'legal_name'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE clients ALTER COLUMN legal_name DROP NOT NULL;
        RAISE NOTICE 'Coluna legal_name tornada nullable';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'document'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE clients ALTER COLUMN document DROP NOT NULL;
        RAISE NOTICE 'Coluna document tornada nullable';
    END IF;
END $$;

-- 4. Verificar estrutura após alterações
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients'
ORDER BY ordinal_position;

-- 5. Testar inserção com campos mínimos
DO $$
DECLARE
    test_company_id UUID;
    test_client_id UUID;
BEGIN
    -- Verificar se há empresas
    SELECT id INTO test_company_id FROM companies LIMIT 1;
    
    IF test_company_id IS NOT NULL THEN
        -- Tentar inserir cliente com campos mínimos
        INSERT INTO clients (name, company_id) 
        VALUES ('Cliente Teste Constraints', test_company_id)
        RETURNING id INTO test_client_id;
        
        RAISE NOTICE 'Cliente de teste inserido com sucesso. ID: %', test_client_id;
        
        -- Limpar cliente de teste
        DELETE FROM clients WHERE id = test_client_id;
        RAISE NOTICE 'Cliente de teste removido';
    ELSE
        RAISE NOTICE 'Nenhuma empresa encontrada para teste';
    END IF;
END $$;

-- 6. Testar inserção com todos os campos
DO $$
DECLARE
    test_company_id UUID;
    test_client_id UUID;
BEGIN
    -- Verificar se há empresas
    SELECT id INTO test_company_id FROM companies LIMIT 1;
    
    IF test_company_id IS NOT NULL THEN
        -- Tentar inserir cliente com todos os campos
        INSERT INTO clients (
            name, 
            rep_name,
            company_name,
            legal_name,
            document,
            email,
            phone,
            address,
            city,
            state,
            cep,
            notes,
            company_id
        ) VALUES (
            'Cliente Teste Completo',
            'Representante Teste',
            'Empresa Teste',
            'Nome Legal Teste',
            '12345678000199',
            'teste@exemplo.com',
            '11999999999',
            'Rua Teste, 123',
            'São Paulo',
            'SP',
            '01234567',
            'Notas de teste',
            test_company_id
        ) RETURNING id INTO test_client_id;
        
        RAISE NOTICE 'Cliente completo inserido com sucesso. ID: %', test_client_id;
        
        -- Limpar cliente de teste
        DELETE FROM clients WHERE id = test_client_id;
        RAISE NOTICE 'Cliente completo removido';
    ELSE
        RAISE NOTICE 'Nenhuma empresa encontrada para teste';
    END IF;
END $$;
