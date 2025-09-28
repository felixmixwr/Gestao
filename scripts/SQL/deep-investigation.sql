-- Script para investigação profunda do problema
-- Execute este script para encontrar a causa raiz

-- 1. Verificar a estrutura completa da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'colaboradores_horas_extras'
ORDER BY ordinal_position;

-- 2. Verificar se há algum constraint CHECK que está forçando um cálculo
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'colaboradores_horas_extras'
  AND tc.constraint_type = 'CHECK';

-- 3. Verificar se há alguma função que está sendo executada automaticamente
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) LIKE '%colaboradores_horas_extras%'
   OR pg_get_functiondef(p.oid) LIKE '%valor_calculado%'
   OR pg_get_functiondef(p.oid) LIKE '%333%'
   OR pg_get_functiondef(p.oid) LIKE '%666%';

-- 4. Verificar se há alguma regra (rule) que está sendo aplicada
SELECT 
  schemaname,
  tablename,
  rulename,
  definition,
  ev_type
FROM pg_rules 
WHERE tablename = 'colaboradores_horas_extras';

-- 5. Verificar se há algum trigger que não foi removido
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'colaboradores_horas_extras';

-- 6. Verificar se há alguma view que pode estar interferindo
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE definition LIKE '%colaboradores_horas_extras%';

-- 7. Testar inserção manual para ver se o problema persiste
-- Vamos inserir um registro de teste
INSERT INTO colaboradores_horas_extras (
  colaborador_id, 
  data, 
  horas, 
  valor_calculado, 
  tipo_dia
) VALUES (
  (SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'),
  '2025-01-02',
  1,
  13.64,  -- Valor correto para 1h
  'segunda-sexta'
);

-- 8. Verificar imediatamente o que foi inserido
SELECT 
  'TESTE INSERT' as status,
  id,
  horas,
  valor_calculado,
  created_at
FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
)
AND data = '2025-01-02';

-- 9. Deletar o registro de teste
DELETE FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
)
AND data = '2025-01-02';





