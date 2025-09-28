-- Script para corrigir definitivamente o problema de cálculo
-- Execute este script para resolver o problema

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

-- 2. Remover qualquer função personalizada que possa estar causando problema
DROP FUNCTION IF EXISTS calcular_novo_valor_hora_extra(DECIMAL, DECIMAL, tipo_dia_hora_extra);
DROP FUNCTION IF EXISTS calcular_novo_valor_hora_extra(DOUBLE PRECISION, DOUBLE PRECISION, tipo_dia_hora_extra);
DROP FUNCTION IF EXISTS calcular_novo_valor_hora_extra(NUMERIC, NUMERIC, tipo_dia_hora_extra);

-- 3. Remover qualquer trigger que possa estar interferindo
DROP TRIGGER IF EXISTS trigger_calcular_valor_hora_extra ON colaboradores_horas_extras;
DROP TRIGGER IF EXISTS calcular_valor_trigger ON colaboradores_horas_extras;
DROP TRIGGER IF EXISTS update_valor_calculado_trigger ON colaboradores_horas_extras;

-- 4. Agora vamos corrigir TODOS os registros com a fórmula correta
UPDATE colaboradores_horas_extras 
SET valor_calculado = horas * ((SELECT salario_fixo FROM colaboradores WHERE colaboradores.id = colaboradores_horas_extras.colaborador_id) / 220) * 1.5;

-- 5. Verificar se a correção funcionou
SELECT 
  'APÓS CORREÇÃO' as status,
  c.nome,
  he.data,
  he.horas,
  he.valor_calculado as valor_corrigido,
  (he.horas * ((c.salario_fixo / 220) * 1.5)) as valor_esperado,
  CASE 
    WHEN ABS(he.valor_calculado - (he.horas * ((c.salario_fixo / 220) * 1.5))) < 0.01 
    THEN '✅ CORRETO' 
    ELSE '❌ INCORRETO' 
  END as status_calculo
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id
WHERE c.nome = 'VINICIUS TAVARES AMBROZIO'
ORDER BY he.created_at DESC;

-- 6. Verificar o total geral
SELECT 
  'TOTAL GERAL' as status,
  COUNT(*) as total_registros,
  SUM(horas) as total_horas,
  SUM(valor_calculado) as total_valor
FROM colaboradores_horas_extras 
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
);





