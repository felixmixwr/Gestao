-- Script para debug específico do relatório REL-03
-- Execute este script no SQL Editor do Supabase

-- 1. Buscar o relatório específico REL-03
SELECT 'RELATÓRIO REL-03 ESPECÍFICO' as info;
SELECT 
  id,
  report_number,
  date,
  client_id,
  client_rep_name,
  pump_id,
  pump_prefix,
  company_id,
  service_company_id,
  created_at,
  updated_at
FROM reports 
WHERE report_number = 'REL-03'
OR client_rep_name = 'qweq'
ORDER BY created_at DESC;

-- 2. Verificar se existe cliente com ID específico
SELECT 'VERIFICAR CLIENTE POR ID' as info;
SELECT 
  id,
  name,
  email,
  phone,
  company_name,
  created_at
FROM clients 
WHERE id IN (
  SELECT DISTINCT client_id 
  FROM reports 
  WHERE report_number = 'REL-03' 
  OR client_rep_name = 'qweq'
);

-- 3. Verificar se existe bomba com ID específico
SELECT 'VERIFICAR BOMBA POR ID' as info;
SELECT 
  id,
  prefix,
  model,
  brand,
  created_at
FROM pumps 
WHERE id IN (
  SELECT DISTINCT pump_id 
  FROM reports 
  WHERE report_number = 'REL-03' 
  OR client_rep_name = 'qweq'
);

-- 4. Verificar se existe empresa com ID específico
SELECT 'VERIFICAR EMPRESA POR ID' as info;
SELECT 
  id,
  name,
  created_at
FROM companies 
WHERE id IN (
  SELECT DISTINCT company_id 
  FROM reports 
  WHERE report_number = 'REL-03' 
  OR client_rep_name = 'qweq'
);

-- 5. Testar JOIN manual para o relatório específico
SELECT 'JOIN MANUAL PARA REL-03' as info;
SELECT 
  r.id as report_id,
  r.report_number,
  r.date,
  r.client_id,
  r.client_rep_name,
  r.pump_id,
  r.pump_prefix,
  r.company_id,
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
WHERE r.report_number = 'REL-03'
OR r.client_rep_name = 'qweq';

-- 6. Verificar se há problemas de RLS específicos
SELECT 'VERIFICAR RLS PARA TABELAS' as info;
SELECT 
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
SELECT 'PERMISSÕES DO USUÁRIO ATUAL' as info;
SELECT 
  current_user,
  session_user,
  current_database(),
  current_schema();

-- 8. Verificar se há dados de teste ou desenvolvimento
SELECT 'VERIFICAR DADOS DE TESTE' as info;
SELECT 
  'REPORTS' as tabela,
  COUNT(*) as total_registros,
  COUNT(client_id) as com_client_id,
  COUNT(pump_id) as com_pump_id,
  COUNT(company_id) as com_company_id
FROM reports
UNION ALL
SELECT 
  'CLIENTS' as tabela,
  COUNT(*) as total_registros,
  COUNT(id) as com_id,
  COUNT(name) as com_name,
  COUNT(company_name) as com_company_name
FROM clients
UNION ALL
SELECT 
  'PUMPS' as tabela,
  COUNT(*) as total_registros,
  COUNT(id) as com_id,
  COUNT(prefix) as com_prefix,
  COUNT(model) as com_model
FROM pumps
UNION ALL
SELECT 
  'COMPANIES' as tabela,
  COUNT(*) as total_registros,
  COUNT(id) as com_id,
  COUNT(name) as com_name,
  0 as com_company_name
FROM companies;
