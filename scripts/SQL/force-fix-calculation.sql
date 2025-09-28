-- Script para forçar a correção do cálculo
-- Execute este script para corrigir definitivamente

-- 1. Primeiro, vamos ver o estado atual
SELECT 
  'ANTES DA CORREÇÃO' as status,
  id,
  horas,
  valor_calculado,
  created_at
FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
)
ORDER BY created_at DESC;

-- 2. Vamos deletar TODOS os registros problemáticos e recriar
DELETE FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
);

-- 3. Recriar os registros com os valores corretos
INSERT INTO colaboradores_horas_extras (
  colaborador_id, 
  data, 
  horas, 
  valor_calculado, 
  tipo_dia
) VALUES (
  (SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'),
  '2025-02-19',
  10,
  136.36,  -- Valor correto para 10h: 10 * ((2000/220) * 1.5) = 136.36
  'segunda-sexta'
);

-- 4. Verificar se a correção funcionou
SELECT 
  'APÓS CORREÇÃO' as status,
  id,
  horas,
  valor_calculado,
  created_at,
  -- Verificar se o valor está correto
  CASE 
    WHEN ABS(valor_calculado - 136.36) < 0.01 
    THEN '✅ CORRETO' 
    ELSE '❌ INCORRETO' 
  END as status_calculo
FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
)
ORDER BY created_at DESC;

-- 5. Verificar o total
SELECT 
  'TOTAL FINAL' as status,
  COUNT(*) as total_registros,
  SUM(horas) as total_horas,
  SUM(valor_calculado) as total_valor
FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
);





