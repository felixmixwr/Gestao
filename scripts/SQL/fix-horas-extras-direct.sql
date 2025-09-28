-- Script direto para corrigir valores das horas extras
-- Nova fórmula: FIXO/220+50%

-- Primeiro, vamos ver os valores atuais
SELECT 
  'ANTES DA CORREÇÃO' as status,
  c.nome,
  c.salario_fixo,
  he.horas,
  he.valor_calculado as valor_atual,
  -- Mostrar o que deveria ser com a nova fórmula
  (he.horas * ((c.salario_fixo / 220) * 1.5)) as valor_correto
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id;

-- Agora vamos corrigir diretamente
UPDATE colaboradores_horas_extras 
SET valor_calculado = horas * ((SELECT salario_fixo FROM colaboradores WHERE colaboradores.id = colaboradores_horas_extras.colaborador_id) / 220) * 1.5;

-- Verificar se a correção funcionou
SELECT 
  'DEPOIS DA CORREÇÃO' as status,
  c.nome,
  c.salario_fixo,
  he.horas,
  he.valor_calculado as valor_corrigido,
  -- Comparar com fórmula antiga
  CASE 
    WHEN he.tipo_dia = 'segunda-sexta' THEN he.horas * ((c.salario_fixo / 30) / 2)
    WHEN he.tipo_dia = 'sabado' THEN he.horas * (c.salario_fixo / 30)
    ELSE 0
  END as valor_antigo
FROM colaboradores_horas_extras he
JOIN colaboradores c ON c.id = he.colaborador_id;





