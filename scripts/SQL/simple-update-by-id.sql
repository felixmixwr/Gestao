-- Script simples para atualizar valores das horas extras
-- Para o colaborador VINICIUS TAVARES AMBROZIO com salário 2000

-- Atualizar diretamente usando o salário fixo conhecido
UPDATE colaboradores_horas_extras 
SET valor_calculado = horas * ((2000 / 220) * 1.5)
WHERE colaborador_id = (
  SELECT id FROM colaboradores WHERE nome = 'VINICIUS TAVARES AMBROZIO'
);

-- Verificar o resultado
SELECT 
  c.nome,
  c.salario_fixo,
  he.horas,
  he.valor_calculado as novo_valor,
  -- Mostrar o cálculo esperado
  (he.horas * ((2000 / 220) * 1.5)) as valor_esperado
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id
WHERE c.nome = 'VINICIUS TAVARES AMBROZIO';





