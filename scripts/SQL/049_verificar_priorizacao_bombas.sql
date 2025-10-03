-- Script para verificar a priorização de bombas na programação
-- Este script verifica se as bombas estão sendo ordenadas corretamente

-- 1. Verificar programações ativas (próximos 7 dias)
SELECT 
    'Programações ativas' as categoria,
    COUNT(*) as total
FROM programacao 
WHERE data >= CURRENT_DATE 
  AND data <= CURRENT_DATE + INTERVAL '7 days';

-- 2. Verificar bombas com programação
SELECT 
    p.bomba_id,
    p.bomba_prefixo,
    COUNT(*) as total_programacoes,
    MIN(p.data) as primeira_programacao,
    MAX(p.data) as ultima_programacao
FROM programacao p
WHERE p.data >= CURRENT_DATE 
  AND p.data <= CURRENT_DATE + INTERVAL '7 days'
  AND (p.bomba_id IS NOT NULL OR p.bomba_prefixo IS NOT NULL)
GROUP BY p.bomba_id, p.bomba_prefixo
ORDER BY total_programacoes DESC;

-- 3. Verificar bombas internas
SELECT 
    'Bombas internas' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'Disponível' THEN 1 END) as disponiveis,
    COUNT(CASE WHEN status = 'Em Uso' THEN 1 END) as em_uso,
    COUNT(CASE WHEN status = 'Em Manutenção' THEN 1 END) as em_manutencao
FROM pumps;

-- 4. Verificar bombas terceiras
SELECT 
    'Bombas terceiras' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'ativa' THEN 1 END) as ativas,
    COUNT(CASE WHEN status = 'em manutenção' THEN 1 END) as em_manutencao,
    COUNT(CASE WHEN status = 'indisponível' THEN 1 END) as indisponiveis
FROM bombas_terceiras;

-- 5. Simular ordenação de priorização
WITH bombas_com_prioridade AS (
  -- Bombas internas
  SELECT 
    p.id,
    p.prefix as nome,
    p.model,
    p.brand,
    false as is_terceira,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM programacao pr 
        WHERE pr.bomba_id = p.id 
          AND pr.data >= CURRENT_DATE 
          AND pr.data <= CURRENT_DATE + INTERVAL '7 days'
      ) THEN true 
      ELSE false 
    END as has_programacao
  FROM pumps p
  
  UNION ALL
  
  -- Bombas terceiras
  SELECT 
    bt.id,
    bt.prefixo as nome,
    bt.modelo as model,
    et.nome_fantasia as brand,
    true as is_terceira,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM programacao pr 
        WHERE pr.bomba_prefixo = bt.prefixo 
          AND pr.data >= CURRENT_DATE 
          AND pr.data <= CURRENT_DATE + INTERVAL '7 days'
      ) THEN true 
      ELSE false 
    END as has_programacao
  FROM bombas_terceiras bt
  LEFT JOIN empresas_terceiras et ON bt.empresa_id = et.id
)
SELECT 
  nome,
  model,
  brand,
  CASE WHEN is_terceira THEN 'Terceira' ELSE 'Interna' END as tipo,
  CASE WHEN has_programacao THEN 'Sim' ELSE 'Não' END as tem_programacao,
  -- Simular ordenação de prioridade
  CASE 
    WHEN has_programacao AND NOT is_terceira THEN 1  -- Bombas internas com programação
    WHEN has_programacao AND is_terceira THEN 2      -- Bombas terceiras com programação
    WHEN NOT has_programacao AND NOT is_terceira THEN 3  -- Bombas internas sem programação
    ELSE 4  -- Bombas terceiras sem programação
  END as prioridade
FROM bombas_com_prioridade
ORDER BY 
  prioridade,
  nome;

-- 6. Verificar distribuição de programações por tipo de bomba
SELECT 
  CASE 
    WHEN p.bomba_id IS NOT NULL THEN 'Interna'
    WHEN p.bomba_prefixo IS NOT NULL THEN 'Terceira'
    ELSE 'Não definida'
  END as tipo_bomba,
  COUNT(*) as total_programacoes,
  COUNT(DISTINCT COALESCE(p.bomba_id, p.bomba_prefixo)) as bombas_unicas
FROM programacao p
WHERE p.data >= CURRENT_DATE 
  AND p.data <= CURRENT_DATE + INTERVAL '7 days'
GROUP BY 
  CASE 
    WHEN p.bomba_id IS NOT NULL THEN 'Interna'
    WHEN p.bomba_prefixo IS NOT NULL THEN 'Terceira'
    ELSE 'Não definida'
  END
ORDER BY total_programacoes DESC;
