-- Script simples para corrigir o problema
-- Execute este script passo a passo

-- 1. Ver o registro atual
SELECT 
  id,
  horas,
  valor_calculado,
  data
FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
);

-- 2. Atualizar diretamente o valor
UPDATE colaboradores_horas_extras 
SET valor_calculado = 136.36
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
)
AND horas = 10;

-- 3. Verificar se funcionou
SELECT 
  id,
  horas,
  valor_calculado,
  data,
  CASE 
    WHEN valor_calculado = 136.36 THEN '✅ CORRETO'
    ELSE '❌ INCORRETO'
  END as status
FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
);





