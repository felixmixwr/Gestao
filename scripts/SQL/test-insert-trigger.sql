-- Script para testar se há trigger AFTER INSERT
-- Execute este script para verificar se o valor é alterado após o INSERT

-- 1. Primeiro, vamos ver o estado atual
SELECT 
  'ESTADO ATUAL' as status,
  COUNT(*) as total_registros,
  SUM(horas) as total_horas,
  SUM(valor_calculado) as total_valor
FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
);

-- 2. Vamos inserir um registro de teste com valor específico
INSERT INTO colaboradores_horas_extras (
  colaborador_id, 
  data, 
  horas, 
  valor_calculado, 
  tipo_dia
) VALUES (
  (SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'),
  '2025-01-01',
  1,
  13.64,  -- Valor correto para 1h
  'segunda-sexta'
);

-- 3. Verificar imediatamente após o INSERT
SELECT 
  'APÓS INSERT' as status,
  id,
  horas,
  valor_calculado,
  created_at
FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
)
AND data = '2025-01-01'
ORDER BY created_at DESC 
LIMIT 1;

-- 4. Se o valor foi alterado, vamos deletar o registro de teste
DELETE FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
)
AND data = '2025-01-01';

-- 5. Verificar se foi deletado
SELECT 
  'APÓS DELETE' as status,
  COUNT(*) as registros_restantes
FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
)
AND data = '2025-01-01';





