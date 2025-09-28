-- Script para forçar a atualização dos valores das horas extras
-- Nova fórmula: FIXO/220+50%

-- Primeiro, vamos ver exatamente qual é o valor atual
SELECT 
  he.id,
  c.nome,
  c.salario_fixo,
  he.horas,
  he.valor_calculado as valor_atual,
  -- Calcular o valor correto
  (he.horas * ((c.salario_fixo / 220) * 1.5)) as valor_correto_calculado
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id;

-- Agora vamos atualizar usando o ID específico
-- Substitua 'ID_DO_REGISTRO' pelo ID real do registro
UPDATE colaboradores_horas_extras 
SET valor_calculado = horas * ((SELECT salario_fixo FROM colaboradores WHERE colaboradores.id = colaboradores_horas_extras.colaborador_id) / 220) * 1.5
WHERE id IN (
  SELECT he.id 
  FROM colaboradores_horas_extras he 
  JOIN colaboradores c ON c.id = he.colaborador_id
);

-- Verificar se funcionou
SELECT 
  'RESULTADO FINAL' as status,
  c.nome,
  c.salario_fixo,
  he.horas,
  he.valor_calculado as valor_final,
  -- Mostrar cálculo manual para verificação
  (he.horas * ((c.salario_fixo / 220) * 1.5)) as calculo_manual
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id;





