-- Script para verificar KPIs das bombas terceiras
-- Este script verifica se os dados de KPIs estão sendo calculados corretamente

-- 1. Verificar relatórios por prefixo de bomba terceira
SELECT 
    r.pump_prefix,
    COUNT(*) as total_relatorios,
    COALESCE(SUM(r.realized_volume), 0) as volume_total_m3,
    COALESCE(SUM(r.total_value), 0) as receita_total,
    COALESCE(AVG(r.total_value), 0) as valor_medio_servico,
    MAX(r.date) as ultimo_servico,
    MIN(r.date) as primeiro_servico
FROM reports r
WHERE r.pump_prefix IS NOT NULL
  AND r.pump_prefix != ''
GROUP BY r.pump_prefix
ORDER BY volume_total_m3 DESC;

-- 2. Verificar bombas terceiras cadastradas
SELECT 
    bt.id,
    bt.prefixo,
    bt.modelo,
    bt.status,
    bt.valor_diaria,
    et.nome_fantasia as empresa_nome
FROM bombas_terceiras bt
LEFT JOIN empresas_terceiras et ON bt.empresa_id = et.id
ORDER BY bt.prefixo;

-- 3. Verificar se há relatórios para bombas terceiras
SELECT 
    bt.prefixo,
    bt.modelo,
    et.nome_fantasia as empresa_nome,
    COUNT(r.id) as total_relatorios,
    COALESCE(SUM(r.realized_volume), 0) as volume_total,
    COALESCE(SUM(r.total_value), 0) as receita_total
FROM bombas_terceiras bt
LEFT JOIN empresas_terceiras et ON bt.empresa_id = et.id
LEFT JOIN reports r ON bt.prefixo = r.pump_prefix
GROUP BY bt.id, bt.prefixo, bt.modelo, et.nome_fantasia
ORDER BY volume_total DESC;

-- 4. Verificar view de bombas terceiras com empresa
SELECT 
    id,
    prefixo,
    modelo,
    status,
    valor_diaria,
    empresa_nome_fantasia,
    empresa_razao_social
FROM view_bombas_terceiras_com_empresa
LIMIT 10;

-- 5. Estatísticas gerais das bombas terceiras
SELECT 
    'Total de bombas terceiras' as metrica,
    COUNT(*) as valor
FROM bombas_terceiras
UNION ALL
SELECT 
    'Bombas ativas' as metrica,
    COUNT(*) as valor
FROM bombas_terceiras 
WHERE status = 'ativa'
UNION ALL
SELECT 
    'Bombas em manutenção' as metrica,
    COUNT(*) as valor
FROM bombas_terceiras 
WHERE status = 'em manutenção'
UNION ALL
SELECT 
    'Bombas indisponíveis' as metrica,
    COUNT(*) as valor
FROM bombas_terceiras 
WHERE status = 'indisponível'
UNION ALL
SELECT 
    'Bombas com relatórios' as metrica,
    COUNT(DISTINCT bt.id) as valor
FROM bombas_terceiras bt
INNER JOIN reports r ON bt.prefixo = r.pump_prefix;
