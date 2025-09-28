-- Script simples para corrigir o cálculo de horas extras
-- Execute este script no Supabase SQL Editor

-- 1. Verificar valores atuais (antes da correção)
SELECT 
  'ANTES DA CORREÇÃO' as status,
  c.nome,
  c.salario_fixo,
  he.horas,
  he.valor_calculado as valor_atual,
  (he.horas * ((c.salario_fixo / 220) * 1.5)) as valor_correto
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id
ORDER BY he.created_at DESC;

-- 2. Atualizar todos os registros com a nova fórmula
-- Nova fórmula: (salário_fixo / 220) * 1.5 * horas
UPDATE colaboradores_horas_extras 
SET valor_calculado = horas * ((SELECT salario_fixo FROM colaboradores WHERE colaboradores.id = colaboradores_horas_extras.colaborador_id) / 220) * 1.5;

-- 3. Verificar valores após correção
SELECT 
  'APÓS A CORREÇÃO' as status,
  c.nome,
  c.salario_fixo,
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
ORDER BY he.created_at DESC;





