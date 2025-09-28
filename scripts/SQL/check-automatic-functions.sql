-- Script para verificar se há funções automáticas sendo executadas

-- 1. Verificar se há alguma função que está sendo chamada automaticamente
SELECT 
  schemaname,
  tablename,
  trigger_name,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'colaboradores_horas_extras';

-- 2. Verificar se há alguma função que pode estar interferindo
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_definition LIKE '%colaboradores_horas_extras%'
   OR routine_definition LIKE '%valor_calculado%';

-- 3. Verificar se há alguma regra na tabela
SELECT 
  rulename,
  definition
FROM pg_rules 
WHERE tablename = 'colaboradores_horas_extras';

-- 4. Testar inserção com valor específico
INSERT INTO colaboradores_horas_extras (
  colaborador_id, 
  data, 
  horas, 
  valor_calculado, 
  tipo_dia
) VALUES (
  (SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'),
  '2025-01-03',
  5,
  68.18,  -- Valor correto para 5h
  'segunda-sexta'
);

-- 5. Verificar o que foi inserido
SELECT 
  'TESTE INSERT' as status,
  horas,
  valor_calculado,
  CASE 
    WHEN valor_calculado = 68.18 THEN '✅ CORRETO'
    ELSE '❌ INCORRETO - Valor: ' || valor_calculado
  END as resultado
FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
)
AND data = '2025-01-03';

-- 6. Deletar o teste
DELETE FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
)
AND data = '2025-01-03';





