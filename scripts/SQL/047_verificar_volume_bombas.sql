-- Script para verificar e corrigir dados de volume nas bombas
-- Este script verifica se os dados de volume realizado estão sendo exibidos corretamente

-- 1. Verificar se existem relatórios com volume realizado
SELECT 
    r.id,
    r.report_number,
    r.pump_id,
    p.prefix as bomba_prefix,
    r.realized_volume,
    r.date,
    c.rep_name as cliente_nome
FROM reports r
LEFT JOIN pumps p ON r.pump_id = p.id
LEFT JOIN clients c ON r.client_id = c.id
WHERE r.realized_volume IS NOT NULL 
  AND r.realized_volume > 0
ORDER BY r.date DESC
LIMIT 10;

-- 2. Verificar volume total por bomba
SELECT 
    p.id as pump_id,
    p.prefix as bomba_prefix,
    COUNT(r.id) as total_relatorios,
    COALESCE(SUM(r.realized_volume), 0) as volume_total_m3,
    COALESCE(AVG(r.realized_volume), 0) as volume_medio_m3
FROM pumps p
LEFT JOIN reports r ON p.id = r.pump_id
GROUP BY p.id, p.prefix
ORDER BY volume_total_m3 DESC;

-- 3. Verificar se há relatórios sem volume realizado
SELECT 
    COUNT(*) as relatorios_sem_volume,
    COUNT(CASE WHEN realized_volume IS NULL OR realized_volume = 0 THEN 1 END) as relatorios_volume_zero
FROM reports;

-- 4. Atualizar relatórios que podem ter volume zero ou nulo (se necessário)
-- ATENÇÃO: Execute apenas se necessário e com cuidado
/*
UPDATE reports 
SET realized_volume = 0 
WHERE realized_volume IS NULL;
*/

-- 5. Verificar integridade dos dados
SELECT 
    'Total de relatórios' as metrica,
    COUNT(*) as valor
FROM reports
UNION ALL
SELECT 
    'Relatórios com volume > 0' as metrica,
    COUNT(*) as valor
FROM reports 
WHERE realized_volume > 0
UNION ALL
SELECT 
    'Bombas com relatórios' as metrica,
    COUNT(DISTINCT pump_id) as valor
FROM reports
WHERE pump_id IS NOT NULL;
