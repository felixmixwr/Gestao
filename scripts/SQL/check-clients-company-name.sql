-- Script para verificar se a coluna company_name existe na tabela clients
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a coluna company_name existe na tabela clients
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name = 'company_name';

-- 2. Se não existir, criar a coluna company_name
-- ALTER TABLE clients ADD COLUMN company_name TEXT;

-- 3. Verificar dados dos clientes
SELECT 
  id,
  name,
  email,
  phone,
  company_name
FROM clients 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Atualizar clientes existentes com company_name baseado no name
-- UPDATE clients SET company_name = name WHERE company_name IS NULL;

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
LIMIT 5;
