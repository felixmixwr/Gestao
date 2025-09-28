-- Script completo para investigar triggers e funções no banco
-- Execute este script para encontrar o que está alterando o valor

-- 1. Verificar TODOS os triggers na tabela colaboradores_horas_extras
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'colaboradores_horas_extras'
ORDER BY trigger_name;

-- 2. Verificar se há funções que podem estar sendo chamadas
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND (
    routine_definition LIKE '%colaboradores_horas_extras%' 
    OR routine_definition LIKE '%valor_calculado%'
    OR routine_definition LIKE '%hora%extra%'
    OR routine_definition LIKE '%salario%'
    OR routine_definition LIKE '%2000%'
    OR routine_definition LIKE '%666%'
    OR routine_definition LIKE '%333%'
  );

-- 3. Verificar se há regras (rules) na tabela
SELECT 
  schemaname,
  tablename,
  rulename,
  definition
FROM pg_rules 
WHERE tablename = 'colaboradores_horas_extras';

-- 4. Verificar se há views que podem estar interferindo
SELECT 
  table_name,
  view_definition
FROM information_schema.views 
WHERE view_definition LIKE '%colaboradores_horas_extras%';

-- 5. Verificar se há alguma função personalizada para cálculo
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE prosrc LIKE '%valor_calculado%' 
   OR prosrc LIKE '%colaboradores_horas_extras%'
   OR prosrc LIKE '%salario%';

-- 6. Verificar o último registro inserido com detalhes
SELECT 
  id,
  colaborador_id,
  data,
  horas,
  valor_calculado,
  tipo_dia,
  created_at,
  -- Calcular o que deveria ser
  (horas * ((2000 / 220) * 1.5)) as valor_esperado,
  -- Calcular o que está sendo aplicado (fórmula antiga)
  (2000 / 3) as valor_fórmula_antiga
FROM colaboradores_horas_extras 
ORDER BY created_at DESC 
LIMIT 3;





