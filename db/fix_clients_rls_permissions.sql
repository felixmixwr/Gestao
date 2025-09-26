-- Script para corrigir permissões e RLS da tabela clients
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'clients';

-- 2. Verificar todas as políticas RLS atuais
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'clients'
ORDER BY policyname;

-- 3. Remover políticas existentes (se necessário)
DROP POLICY IF EXISTS "Allow all client operations" ON clients;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON clients;
DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
DROP POLICY IF EXISTS "Enable update for users based on email" ON clients;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON clients;

-- 4. Recriar políticas RLS mais permissivas
-- Política para SELECT (leitura)
CREATE POLICY "Enable read access for all users" ON clients
    FOR SELECT USING (true);

-- Política para INSERT (inserção)
CREATE POLICY "Enable insert for authenticated users" ON clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE (atualização)
CREATE POLICY "Enable update for authenticated users" ON clients
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para DELETE (exclusão)
CREATE POLICY "Enable delete for authenticated users" ON clients
    FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Verificar se a tabela companies existe (necessária para foreign key)
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'companies';

-- 6. Se companies não existir, criar
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Inserir empresa padrão se não existir
INSERT INTO companies (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Felix Mix')
ON CONFLICT (id) DO NOTHING;

INSERT INTO companies (id, name) 
VALUES ('00000000-0000-0000-0000-000000000002', 'WorldRental')
ON CONFLICT (id) DO NOTHING;

-- 8. Verificar se a coluna company_id existe na tabela clients
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients'
AND column_name = 'company_id';

-- 9. Se company_id não existir, adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'company_id'
    ) THEN
        ALTER TABLE clients ADD COLUMN company_id UUID REFERENCES companies(id);
        RAISE NOTICE 'Coluna company_id adicionada à tabela clients';
    ELSE
        RAISE NOTICE 'Coluna company_id já existe na tabela clients';
    END IF;
END $$;

-- 10. Testar inserção de cliente
DO $$
DECLARE
    test_company_id UUID;
    test_client_id UUID;
BEGIN
    -- Pegar ID de uma empresa
    SELECT id INTO test_company_id FROM companies LIMIT 1;
    
    IF test_company_id IS NOT NULL THEN
        -- Tentar inserir cliente de teste
        INSERT INTO clients (name, company_id) 
        VALUES ('Cliente Teste RLS', test_company_id)
        RETURNING id INTO test_client_id;
        
        RAISE NOTICE 'Cliente de teste inserido com sucesso. ID: %', test_client_id;
        
        -- Limpar cliente de teste
        DELETE FROM clients WHERE id = test_client_id;
        RAISE NOTICE 'Cliente de teste removido';
    ELSE
        RAISE NOTICE 'Nenhuma empresa encontrada para teste';
    END IF;
END $$;

-- 11. Verificar políticas finais
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'clients'
ORDER BY policyname;
