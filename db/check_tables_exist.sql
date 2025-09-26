-- Script para verificar se as tabelas básicas existem no Supabase
-- Execute este script no Supabase SQL Editor para diagnosticar o problema

-- 1. Verificar se as tabelas principais existem
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'companies',
    'clients', 
    'bombas',
    'reports',
    'notas_fiscais',
    'colaboradores',
    'programacao',
    'admin_users',
    'banned_users',
    'audit_logs_comprehensive'
)
ORDER BY table_name;

-- 2. Verificar estrutura da tabela clients (se existir)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients'
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela clients
SELECT COUNT(*) as total_clients FROM clients;

-- 4. Verificar RLS policies na tabela clients
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
WHERE tablename = 'clients';

-- 5. Verificar se o usuário atual tem permissões
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_database() as current_database;

-- 6. Testar inserção simples (comentado para não executar acidentalmente)
-- INSERT INTO clients (name, company_id) VALUES ('Teste', (SELECT id FROM companies LIMIT 1)) RETURNING *;
