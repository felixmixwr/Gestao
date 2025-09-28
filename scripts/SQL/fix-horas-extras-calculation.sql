-- Script para corrigir o cálculo de horas extras com a nova fórmula
-- Nova fórmula: (salário_fixo / 220) * 1.5 * horas

-- 1. Primeiro, vamos verificar os valores atuais
SELECT 
  c.nome,
  c.salario_fixo,
  he.data,
  he.horas,
  he.tipo_dia,
  he.valor_calculado as valor_atual,
  -- Mostrar o valor correto com a nova fórmula
  (he.horas * ((c.salario_fixo / 220) * 1.5)) as valor_correto,
  -- Mostrar a diferença
  ((he.horas * ((c.salario_fixo / 220) * 1.5)) - he.valor_calculado) as diferenca
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id
ORDER BY he.created_at DESC;

-- 2. Atualizar todos os registros com a nova fórmula
UPDATE colaboradores_horas_extras 
SET valor_calculado = horas * ((SELECT salario_fixo FROM colaboradores WHERE colaboradores.id = colaboradores_horas_extras.colaborador_id) / 220) * 1.5;

-- 3. Verificar se a correção funcionou
SELECT 
  c.nome,
  c.salario_fixo,
  he.data,
  he.horas,
  he.tipo_dia,
  he.valor_calculado as valor_corrigido,
  -- Mostrar o cálculo para verificação
  (he.horas * ((c.salario_fixo / 220) * 1.5)) as calculo_manual,
  -- Verificar se os valores são iguais
  CASE 
    WHEN ABS(he.valor_calculado - (he.horas * ((c.salario_fixo / 220) * 1.5))) < 0.01 
    THEN '✅ CORRETO' 
    ELSE '❌ INCORRETO' 
  END as status
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id
ORDER BY he.created_at DESC;

-- 4. Mostrar um exemplo de cálculo detalhado
SELECT 
  'EXEMPLO DE CÁLCULO' as titulo,
  c.nome,
  c.salario_fixo,
  he.horas,
  -- Passo a passo do cálculo
  (c.salario_fixo / 220) as valor_base_por_hora,
  ((c.salario_fixo / 220) * 1.5) as valor_hora_extra,
  he.valor_calculado as resultado_final
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id
LIMIT 1;





