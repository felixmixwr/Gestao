-- Script para verificar a estrutura da tabela clients
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela clients existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') 
    THEN 'Tabela clients existe'
    ELSE 'Tabela clients NÃO existe'
  END as status;

-- 2. Se a tabela existe, mostrar sua estrutura
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- 3. Verificar se há dados na tabela clients
SELECT 
  'Dados na tabela clients:' as status,
  COUNT(*) as total_clients
FROM clients;

-- 4. Mostrar alguns dados de exemplo (se existirem)
SELECT * FROM clients LIMIT 3;
