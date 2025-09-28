-- Script para verificar o último registro salvo no banco
-- Execute este script para ver se o valor está correto no banco

-- 1. Verificar o último registro inserido
SELECT 
  id,
  colaborador_id,
  data,
  horas,
  valor_calculado,
  tipo_dia,
  created_at
FROM colaboradores_horas_extras 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Verificar especificamente o registro do VINICIUS
SELECT 
  c.nome,
  he.id,
  he.data,
  he.horas,
  he.valor_calculado,
  he.tipo_dia,
  he.created_at
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id
WHERE c.nome = 'VINICIUS TAVARES AMBROZIO'
ORDER BY he.created_at DESC;

-- 3. Verificar se há algum trigger ou função que pode estar alterando o valor
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'colaboradores_horas_extras';

-- 4. Verificar se há alguma constraint ou regra
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'colaboradores_horas_extras';





