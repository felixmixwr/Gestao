-- Script para investigar funções e triggers no banco de dados
-- Execute este script para identificar o que está causando o problema

-- 1. Verificar se existem triggers na tabela colaboradores_horas_extras
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'colaboradores_horas_extras';

-- 2. Verificar se existem funções que podem estar sendo chamadas
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND (routine_definition LIKE '%colaboradores_horas_extras%' 
       OR routine_definition LIKE '%valor_calculado%'
       OR routine_definition LIKE '%hora%extra%');

-- 3. Verificar se há constraints ou regras na tabela
SELECT 
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'colaboradores_horas_extras';

-- 4. Verificar a estrutura atual da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'colaboradores_horas_extras'
ORDER BY ordinal_position;

-- 5. Verificar se há alguma view que pode estar afetando
SELECT 
  table_name,
  view_definition
FROM information_schema.views 
WHERE view_definition LIKE '%colaboradores_horas_extras%';

-- 6. Verificar se há alguma regra (rule) na tabela
SELECT 
  schemaname,
  tablename,
  rulename,
  definition
FROM pg_rules 
WHERE tablename = 'colaboradores_horas_extras';





