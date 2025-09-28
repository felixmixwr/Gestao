-- Script para verificar os dados da tabela reports
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura da tabela reports
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- 2. Verificar quantos relatórios existem
SELECT COUNT(*) as total_reports FROM reports;

-- 3. Verificar os últimos 5 relatórios criados
SELECT 
  id,
  report_number,
  date,
  client_id,
  client_rep_name,
  pump_prefix,
  realized_volume,
  total_value,
  status,
  company_id,
  service_company_id,
  created_at
FROM reports 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Verificar se há relatórios com dados nulos
SELECT 
  COUNT(*) as total,
  COUNT(client_id) as with_client,
  COUNT(client_rep_name) as with_rep_name,
  COUNT(pump_prefix) as with_pump_prefix,
  COUNT(realized_volume) as with_volume,
  COUNT(total_value) as with_value
FROM reports;

-- 5. Verificar relacionamentos com outras tabelas
SELECT 
  r.id,
  r.report_number,
  r.status,
  c.name as client_name,
  p.prefix as pump_prefix,
  comp.name as company_name
FROM reports r
LEFT JOIN clients c ON r.client_id = c.id
LEFT JOIN pumps p ON r.pump_id = p.id
LEFT JOIN companies comp ON r.company_id = comp.id
ORDER BY r.created_at DESC
LIMIT 10;
