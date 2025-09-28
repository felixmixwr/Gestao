-- Script para verificar a estrutura da tabela reports
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura completa da tabela reports
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- 2. Verificar se a coluna client_id existe e suas propriedades
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name = 'client_id';

-- 3. Verificar os últimos relatórios criados para ver se client_id está sendo salvo
SELECT 
  id,
  report_number,
  date,
  client_id,
  client_rep_name,
  created_at
FROM reports 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Verificar se há relatórios com client_id NULL
SELECT 
  COUNT(*) as total_reports,
  COUNT(client_id) as reports_with_client_id,
  COUNT(*) - COUNT(client_id) as reports_without_client_id
FROM reports;

-- 5. Verificar relacionamento com tabela clients
SELECT 
  r.id,
  r.report_number,
  r.client_id,
  c.name as client_name,
  c.company_name
FROM reports r
LEFT JOIN clients c ON r.client_id = c.id
ORDER BY r.created_at DESC
LIMIT 10;
