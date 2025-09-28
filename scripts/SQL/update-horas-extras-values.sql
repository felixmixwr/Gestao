-- Script para atualizar valores das horas extras com a nova fórmula
-- Nova fórmula: FIXO/220+50%

-- Função para calcular o novo valor das horas extras
CREATE OR REPLACE FUNCTION calcular_novo_valor_hora_extra(
  salario_fixo DECIMAL,
  horas DECIMAL,
  tipo_dia tipo_dia_hora_extra
) RETURNS DECIMAL AS $$
BEGIN
  -- Nova fórmula: salário fixo dividido por 220 horas mensais + 50%
  RETURN horas * ((salario_fixo / 220) * 1.5);
END;
$$ LANGUAGE plpgsql;

-- Atualizar todos os registros de horas extras existentes
UPDATE colaboradores_horas_extras 
SET valor_calculado = calcular_novo_valor_hora_extra(
  (SELECT salario_fixo FROM colaboradores WHERE id = colaboradores_horas_extras.colaborador_id),
  horas,
  tipo_dia
);

-- Mostrar os valores atualizados
SELECT 
  c.nome,
  c.salario_fixo,
  he.data,
  he.horas,
  he.tipo_dia,
  he.valor_calculado as novo_valor,
  -- Mostrar também o cálculo antigo para comparação
  CASE 
    WHEN he.tipo_dia = 'segunda-sexta' THEN he.horas * ((c.salario_fixo / 30) / 2)
    WHEN he.tipo_dia = 'sabado' THEN he.horas * (c.salario_fixo / 30)
    ELSE 0
  END as valor_antigo
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id
ORDER BY he.created_at DESC;

-- Remover a função temporária
DROP FUNCTION calcular_novo_valor_hora_extra(DECIMAL, DECIMAL, tipo_dia_hora_extra);
