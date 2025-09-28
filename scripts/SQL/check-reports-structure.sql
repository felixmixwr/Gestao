-- Script para verificar a estrutura atual da tabela reports
-- Execute este script primeiro para entender a estrutura existente

-- 1. Verificar se a tabela reports existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reports') 
    THEN 'Tabela reports existe'
    ELSE 'Tabela reports NÃO existe'
  END as status;

-- 2. Se a tabela existe, mostrar sua estrutura
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- 3. Verificar se existe alguma coluna relacionada a bombas
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'reports' 
  AND (column_name LIKE '%pump%' OR column_name LIKE '%bomba%')
ORDER BY column_name;

-- 4. Verificar constraints e foreign keys da tabela reports
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'reports'
ORDER BY tc.constraint_type, tc.constraint_name;
