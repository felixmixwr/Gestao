-- Script para corrigir a estrutura da tabela clients
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura atual da tabela clients
SELECT 
  'Estrutura atual da tabela clients:' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- 2. Adicionar coluna 'name' se não existir (baseado na estrutura esperada)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- 3. Se a coluna 'name' foi adicionada, preenchê-la com dados existentes
-- Usar rep_name como fallback, depois company_name, depois um valor padrão
UPDATE clients 
SET name = COALESCE(rep_name, company_name, 'Cliente ' || id)
WHERE name IS NULL OR name = '';

-- 4. Verificar se há dados na tabela clients
SELECT 
  'Dados na tabela clients após correção:' as status,
  COUNT(*) as total_clients
FROM clients;

-- 5. Mostrar alguns dados de exemplo
SELECT 
  id,
  name,
  rep_name,
  company_name,
  email,
  phone
FROM clients 
LIMIT 5;

-- 6. Verificar estrutura final
SELECT 
  'Estrutura final da tabela clients:' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;
