-- Script para testar inserção de cliente
-- Execute este script no Supabase SQL Editor para verificar se a inserção funciona

-- 1. Verificar usuário atual
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_database() as current_database,
    auth.role() as auth_role;

-- 2. Verificar se há empresas disponíveis
SELECT 
    id,
    name,
    created_at
FROM companies
ORDER BY name;

-- 3. Verificar estrutura da tabela clients
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients'
ORDER BY ordinal_position;

-- 4. Verificar RLS policies
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'clients'
ORDER BY policyname;

-- 5. Testar inserção manual (descomente para testar)
/*
INSERT INTO clients (
    name, 
    company_id,
    email,
    phone
) VALUES (
    'Cliente Teste Manual',
    (SELECT id FROM companies LIMIT 1),
    'teste@exemplo.com',
    '11999999999'
) RETURNING *;
*/

-- 6. Verificar se há dados na tabela
SELECT COUNT(*) as total_clients FROM clients;

-- 7. Verificar últimos clientes inseridos
SELECT 
    id,
    name,
    email,
    phone,
    company_id,
    created_at
FROM clients
ORDER BY created_at DESC
LIMIT 5;
