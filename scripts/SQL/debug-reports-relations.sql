-- Script detalhado para debug dos relacionamentos dos relatórios
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura das tabelas relacionadas
SELECT 'REPORTS TABLE STRUCTURE' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name IN ('id', 'client_id', 'pump_id', 'company_id', 'service_company_id')
ORDER BY ordinal_position;

SELECT 'CLIENTS TABLE STRUCTURE' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

SELECT 'PUMPS TABLE STRUCTURE' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'pumps' 
ORDER BY ordinal_position;

SELECT 'COMPANIES TABLE STRUCTURE' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

-- 2. Verificar dados dos relatórios mais recentes
SELECT 'RECENT REPORTS DATA' as info;
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
  created_at
FROM reports 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verificar se existem clientes na tabela
SELECT 'CLIENTS DATA' as info;
SELECT 
  id,
  name,
  email,
  phone,
  company_name,
  created_at
FROM clients 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Verificar se existem bombas na tabela
SELECT 'PUMPS DATA' as info;
SELECT 
  id,
  prefix,
  model,
  brand,
  created_at
FROM pumps 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Verificar se existem empresas na tabela
SELECT 'COMPANIES DATA' as info;
SELECT 
  id,
  name,
  created_at
FROM companies 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Testar o JOIN exato que está sendo usado no código
SELECT 'JOIN TEST - EXACT QUERY FROM CODE' as info;
SELECT 
  r.*,
  c.id as client_id_join,
  c.name as client_name,
  c.email as client_email,
  c.phone as client_phone,
  c.company_name as client_company_name,
  p.id as pump_id_join,
  p.prefix as pump_prefix_join,
  p.model as pump_model,
  p.brand as pump_brand,
  comp.id as company_id_join,
  comp.name as company_name_join
FROM reports r
LEFT JOIN clients c ON r.client_id = c.id
LEFT JOIN pumps p ON r.pump_id = p.id
LEFT JOIN companies comp ON r.company_id = comp.id
ORDER BY r.created_at DESC
LIMIT 3;

-- 7. Verificar se há problemas de RLS (Row Level Security)
SELECT 'RLS POLICIES CHECK' as info;
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
WHERE tablename IN ('reports', 'clients', 'pumps', 'companies');

-- 8. Verificar se o usuário atual tem permissões
SELECT 'CURRENT USER PERMISSIONS' as info;
SELECT 
  current_user,
  session_user,
  current_database();

-- 9. Verificar se há dados de teste específicos
SELECT 'SPECIFIC TEST DATA' as info;
SELECT 
  r.id,
  r.report_number,
  r.client_id,
  r.client_rep_name,
  CASE 
    WHEN r.client_id IS NULL THEN 'CLIENT_ID IS NULL'
    WHEN c.id IS NULL THEN 'CLIENT NOT FOUND'
    ELSE 'CLIENT FOUND'
  END as client_status,
  c.name as client_name,
  c.company_name as client_company_name
FROM reports r
LEFT JOIN clients c ON r.client_id = c.id
WHERE r.report_number LIKE '%REL-03%'
OR r.client_rep_name = 'qweq'
ORDER BY r.created_at DESC;
