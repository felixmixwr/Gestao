-- Script para verificar foreign keys e estrutura das tabelas
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todas as foreign keys da tabela reports
SELECT 'FOREIGN KEYS DA TABELA REPORTS' as info;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'reports';

-- 2. Verificar se as tabelas relacionadas existem
SELECT 'VERIFICAR EXISTÊNCIA DAS TABELAS' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('reports', 'clients', 'pumps', 'companies')
ORDER BY table_name;

-- 3. Verificar estrutura específica da tabela reports
SELECT 'ESTRUTURA DA TABELA REPORTS' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name IN ('client_id', 'pump_id', 'company_id', 'service_company_id')
ORDER BY ordinal_position;

-- 4. Verificar se os IDs dos relatórios existem nas tabelas relacionadas
SELECT 'VERIFICAR IDs DOS RELATÓRIOS NAS TABELAS RELACIONADAS' as info;

-- Verificar client_id
SELECT 'CLIENT_ID CHECK' as check_type;
SELECT 
    r.id as report_id,
    r.report_number,
    r.client_id,
    CASE 
        WHEN c.id IS NOT NULL THEN 'CLIENT EXISTS'
        ELSE 'CLIENT NOT FOUND'
    END as client_status,
    c.name as client_name
FROM reports r
LEFT JOIN clients c ON r.client_id = c.id
WHERE r.report_number = '#REL-03'
LIMIT 1;

-- Verificar pump_id
SELECT 'PUMP_ID CHECK' as check_type;
SELECT 
    r.id as report_id,
    r.report_number,
    r.pump_id,
    CASE 
        WHEN p.id IS NOT NULL THEN 'PUMP EXISTS'
        ELSE 'PUMP NOT FOUND'
    END as pump_status,
    p.prefix as pump_prefix
FROM reports r
LEFT JOIN pumps p ON r.pump_id = p.id
WHERE r.report_number = '#REL-03'
LIMIT 1;

-- Verificar company_id
SELECT 'COMPANY_ID CHECK' as check_type;
SELECT 
    r.id as report_id,
    r.report_number,
    r.company_id,
    CASE 
        WHEN comp.id IS NOT NULL THEN 'COMPANY EXISTS'
        ELSE 'COMPANY NOT FOUND'
    END as company_status,
    comp.name as company_name
FROM reports r
LEFT JOIN companies comp ON r.company_id = comp.id
WHERE r.report_number = '#REL-03'
LIMIT 1;

-- 5. Testar JOIN manual completo
SELECT 'JOIN MANUAL COMPLETO' as info;
SELECT 
    r.id,
    r.report_number,
    r.date,
    r.client_id,
    r.client_rep_name,
    r.pump_id,
    r.pump_prefix,
    r.company_id,
    r.service_company_id,
    c.id as client_table_id,
    c.name as client_name,
    c.email as client_email,
    c.phone as client_phone,
    c.company_name as client_company_name,
    p.id as pump_table_id,
    p.prefix as pump_prefix_from_table,
    p.model as pump_model,
    p.brand as pump_brand,
    comp.id as company_table_id,
    comp.name as company_name_from_table
FROM reports r
LEFT JOIN clients c ON r.client_id = c.id
LEFT JOIN pumps p ON r.pump_id = p.id
LEFT JOIN companies comp ON r.company_id = comp.id
WHERE r.report_number = '#REL-03';

-- 6. Verificar se há problemas de RLS (Row Level Security)
SELECT 'VERIFICAR RLS POLICIES' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('reports', 'clients', 'pumps', 'companies')
ORDER BY tablename, policyname;

-- 7. Verificar permissões do usuário atual
SELECT 'PERMISSÕES DO USUÁRIO' as info;
SELECT 
    current_user,
    session_user,
    current_database(),
    current_schema();

-- 8. Verificar se as tabelas têm dados
SELECT 'CONTAGEM DE DADOS' as info;
SELECT 
    'reports' as tabela,
    COUNT(*) as total_registros
FROM reports
UNION ALL
SELECT 
    'clients' as tabela,
    COUNT(*) as total_registros
FROM clients
UNION ALL
SELECT 
    'pumps' as tabela,
    COUNT(*) as total_registros
FROM pumps
UNION ALL
SELECT 
    'companies' as tabela,
    COUNT(*) as total_registros
FROM companies;
