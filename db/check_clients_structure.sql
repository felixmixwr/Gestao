-- Script para verificar estrutura da tabela clients
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura completa da tabela clients
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients'
ORDER BY ordinal_position;

-- 2. Verificar constraints da tabela
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'clients'
ORDER BY tc.constraint_type, kcu.column_name;

-- 3. Verificar se há dados na tabela
SELECT COUNT(*) as total_clients FROM clients;

-- 4. Verificar alguns registros existentes (se houver)
SELECT 
    id,
    name,
    rep_name,
    company_name,
    legal_name,
    document,
    email,
    phone,
    company_id,
    created_at
FROM clients
ORDER BY created_at DESC
LIMIT 5;
