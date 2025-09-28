-- Script para testar JOIN manual e verificar dados
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar dados específicos do relatório REL-04
SELECT 'DADOS DO RELATÓRIO REL-04' as info;
SELECT 
    id,
    report_number,
    client_id,
    pump_id,
    company_id,
    client_rep_name
FROM reports 
WHERE report_number = '#REL-04';

-- 2. Verificar dados do cliente específico
SELECT 'DADOS DO CLIENTE' as info;
SELECT 
    id,
    name,
    email,
    phone,
    company_name
FROM clients 
WHERE id = '183125c8-574b-4d87-9ff2-f02bb3fbbe1e';

-- 3. Verificar dados da bomba específica
SELECT 'DADOS DA BOMBA' as info;
SELECT 
    id,
    prefix,
    model,
    brand
FROM pumps 
WHERE id = 'd1e55621-d31b-4803-829c-2d4a009f9c19';

-- 4. Verificar dados da empresa específica
SELECT 'DADOS DA EMPRESA' as info;
SELECT 
    id,
    name
FROM companies 
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

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
WHERE r.report_number = '#REL-04';

-- 6. Verificar se há problemas de RLS específicos
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

-- 8. Testar uma query simples sem JOIN
SELECT 'QUERY SIMPLES SEM JOIN' as info;
SELECT 
    id,
    report_number,
    client_id,
    pump_id,
    company_id
FROM reports 
WHERE report_number = '#REL-04';
