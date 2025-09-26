-- Script para verificar as foreign keys da tabela reports
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todas as foreign keys da tabela reports
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'reports';

-- 2. Verificar estrutura da tabela reports
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- 3. Testar query simples com JOIN manual
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
