-- Script para verificar se há funções personalizadas que estão causando o problema

-- 1. Verificar se a função calcular_novo_valor_hora_extra ainda existe
SELECT 
  proname as function_name,
  prosrc as function_source,
  proargnames as argument_names,
  proargtypes as argument_types
FROM pg_proc 
WHERE proname = 'calcular_novo_valor_hora_extra';

-- 2. Verificar TODAS as funções que podem estar relacionadas a horas extras
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE prosrc LIKE '%valor_calculado%' 
   OR prosrc LIKE '%colaboradores_horas_extras%'
   OR prosrc LIKE '%hora%extra%'
   OR prosrc LIKE '%salario%'
   OR prosrc LIKE '%666%'
   OR prosrc LIKE '%333%'
   OR prosrc LIKE '%2000%';

-- 3. Verificar se há triggers que chamam funções
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.action_statement,
  t.action_timing,
  p.proname as function_name,
  p.prosrc as function_source
FROM information_schema.triggers t
LEFT JOIN pg_proc p ON p.proname = REGEXP_REPLACE(t.action_statement, '.*EXECUTE FUNCTION\s+(\w+).*', '\1')
WHERE t.event_object_table = 'colaboradores_horas_extras';

-- 4. Verificar se há alguma view que pode estar interferindo
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE definition LIKE '%colaboradores_horas_extras%'
   OR definition LIKE '%valor_calculado%';

-- 5. Verificar se há alguma regra (rule) na tabela
SELECT 
  schemaname,
  tablename,
  rulename,
  definition
FROM pg_rules 
WHERE tablename = 'colaboradores_horas_extras';





