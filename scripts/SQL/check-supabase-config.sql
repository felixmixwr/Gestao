-- Script para verificar configurações do Supabase que podem estar causando o problema

-- 1. Verificar se há políticas RLS (Row Level Security) que podem estar interferindo
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
WHERE tablename = 'colaboradores_horas_extras';

-- 2. Verificar se há alguma função de trigger que está sendo executada
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosrc as function_source,
  p.proargnames as argument_names
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosrc LIKE '%colaboradores_horas_extras%'
   OR p.prosrc LIKE '%valor_calculado%'
   OR p.proname LIKE '%hora%'
   OR p.proname LIKE '%extra%';

-- 3. Verificar se há alguma extensão que pode estar interferindo
SELECT 
  extname,
  extversion,
  extrelocatable
FROM pg_extension
WHERE extname LIKE '%trigger%'
   OR extname LIKE '%function%'
   OR extname LIKE '%rule%';

-- 4. Verificar se há alguma função de sistema que está sendo sobrescrita
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname IN ('now', 'current_timestamp', 'current_date')
  AND prosrc LIKE '%colaboradores_horas_extras%';

-- 5. Verificar se há alguma configuração de sessão que pode estar causando problema
SELECT 
  name,
  setting,
  context
FROM pg_settings 
WHERE name LIKE '%trigger%'
   OR name LIKE '%function%'
   OR name LIKE '%rule%';

-- 6. Verificar se há alguma função de validação que está sendo executada
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'colaboradores_horas_extras'
  AND cc.check_clause IS NOT NULL;





