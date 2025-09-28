-- Script para forçar a atualização e verificar o que está acontecendo
-- Execute este script passo a passo

-- 1. Primeiro, vamos ver exatamente o que está na tabela
SELECT 
  id,
  colaborador_id,
  data,
  horas,
  valor_calculado,
  tipo_dia,
  created_at
FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
)
ORDER BY created_at DESC;

-- 2. Vamos atualizar UM registro específico e ver o que acontece
-- Substitua 'ID_DO_REGISTRO' pelo ID real do registro que você quer corrigir
UPDATE colaboradores_horas_extras 
SET valor_calculado = 136.36  -- Valor correto para 10h com salário R$ 2000
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
)
AND horas = 10.00
LIMIT 1;

-- 3. Verificar se a atualização funcionou
SELECT 
  id,
  colaborador_id,
  horas,
  valor_calculado,
  'APÓS ATUALIZAÇÃO MANUAL' as status
FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
)
AND horas = 10.00
ORDER BY created_at DESC;

-- 4. Se ainda não funcionou, vamos tentar uma abordagem diferente
-- Vamos deletar e recriar o registro
-- CUIDADO: Faça backup antes de executar esta parte!

-- Primeiro, vamos ver o registro atual
SELECT * FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
)
AND horas = 10.00;

-- Se você quiser deletar e recriar (descomente as linhas abaixo):
-- DELETE FROM colaboradores_horas_extras 
-- WHERE colaborador_id = (
--   SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
-- )
-- AND horas = 10.00;

-- INSERT INTO colaboradores_horas_extras (colaborador_id, data, horas, valor_calculado, tipo_dia)
-- VALUES (
--   (SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'),
--   '2025-05-24',
--   10.00,
--   136.36,
--   'segunda-sexta'
-- );





