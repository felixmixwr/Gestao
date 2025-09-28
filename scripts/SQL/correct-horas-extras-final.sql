-- Script final para corrigir valores das horas extras
-- Nova fórmula: FIXO/220+50%

-- Primeiro, vamos ver o estado atual
SELECT 
  'ESTADO ATUAL' as status,
  c.nome,
  c.salario_fixo,
  he.horas,
  he.valor_calculado as valor_atual,
  he.created_at
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id
ORDER BY he.created_at DESC;

-- Agora vamos corrigir TODOS os registros
UPDATE colaboradores_horas_extras 
SET valor_calculado = horas * ((SELECT salario_fixo FROM colaboradores WHERE colaboradores.id = colaboradores_horas_extras.colaborador_id) / 220) * 1.5;

-- Verificar se a correção funcionou
SELECT 
  'APÓS CORREÇÃO' as status,
  c.nome,
  c.salario_fixo,
  he.horas,
  he.valor_calculado as valor_corrigido,
  -- Mostrar o cálculo manual para verificação
  (he.horas * ((c.salario_fixo / 220) * 1.5)) as calculo_manual,
  he.created_at
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id
ORDER BY he.created_at DESC;





