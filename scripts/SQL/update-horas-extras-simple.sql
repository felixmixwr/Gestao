-- Script simples para atualizar valores das horas extras com a nova fórmula
-- Nova fórmula: FIXO/220+50%

-- Atualizar todos os registros de horas extras existentes
UPDATE colaboradores_horas_extras 
SET valor_calculado = horas * ((c.salario_fixo / 220) * 1.5)
FROM colaboradores c 
WHERE c.id = colaboradores_horas_extras.colaborador_id;

-- Mostrar os valores atualizados para verificação
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





