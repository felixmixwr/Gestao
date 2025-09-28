-- Script para verificar a estrutura da tabela clients
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura completa da tabela clients
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- 2. Verificar se a coluna company_name existe
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name = 'company_name';

-- 3. Verificar dados dos clientes
SELECT 
  id,
  name,
  email,
  phone,
  company_name,
  created_at
FROM clients 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Verificar se há clientes com company_name preenchido
SELECT 
  COUNT(*) as total_clients,
  COUNT(company_name) as clients_with_company_name,
  COUNT(*) - COUNT(company_name) as clients_without_company_name
FROM clients;

-- 5. Verificar relacionamento com relatórios
SELECT 
  r.id,
  r.report_number,
  r.client_id,
  r.client_rep_name,
  c.name as client_name,
  c.company_name
FROM reports r
LEFT JOIN clients c ON r.client_id = c.id
ORDER BY r.created_at DESC
LIMIT 10;
