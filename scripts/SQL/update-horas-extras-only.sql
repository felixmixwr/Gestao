-- Script simples apenas para atualizar valores das horas extras
-- Nova fórmula: FIXO/220+50%

-- Atualizar usando subquery
UPDATE colaboradores_horas_extras 
SET valor_calculado = horas * ((SELECT salario_fixo FROM colaboradores WHERE colaboradores.id = colaboradores_horas_extras.colaborador_id) / 220) * 1.5;

-- Verificar resultado
SELECT 
  c.nome,
  c.salario_fixo,
  he.horas,
  he.valor_calculado as novo_valor
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id;





