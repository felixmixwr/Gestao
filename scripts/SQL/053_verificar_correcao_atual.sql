-- =============================================
-- VERIFICAR SE A CORREÇÃO ESTÁ FUNCIONANDO
-- =============================================
-- Este script verifica os dados atuais após a correção

-- 1. VERIFICAR VOLUME TOTAL (TODOS OS RELATÓRIOS - COMO DEVE SER AGORA)
SELECT 
    'VOLUME TOTAL CORRIGIDO' as tipo,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3,
    SUM(total_value) as valor_total,
    ROUND(AVG(realized_volume), 2) as volume_medio_por_relatorio
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);

-- 2. VERIFICAR VOLUME DE HOJE (2025-10-02)
SELECT 
    'VOLUME DE HOJE (2025-10-02)' as tipo,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3,
    SUM(total_value) as valor_total
FROM reports 
WHERE date = '2025-10-02';

-- 3. VERIFICAR DISTRIBUIÇÃO POR STATUS NO MÊS
SELECT 
    'DISTRIBUIÇÃO POR STATUS NO MÊS' as info;

SELECT 
    status,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3,
    SUM(total_value) as valor_total,
    ROUND(
        (SUM(realized_volume) * 100.0 / 
         (SELECT SUM(realized_volume) FROM reports WHERE date >= DATE_TRUNC('month', CURRENT_DATE))
        ), 2
    ) as percentual_volume
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY status
ORDER BY volume_total_m3 DESC;

-- 4. VERIFICAR RELATÓRIOS DE HOJE POR STATUS
SELECT 
    'RELATÓRIOS DE HOJE POR STATUS' as info;

SELECT 
    status,
    COUNT(*) as quantidade,
    SUM(realized_volume) as volume_m3,
    SUM(total_value) as valor_total
FROM reports 
WHERE date = '2025-10-02'
GROUP BY status
ORDER BY volume_m3 DESC;

-- 5. VERIFICAR RELATÓRIOS RECENTES COM MAIOR VOLUME
SELECT 
    'RELATÓRIOS RECENTES COM MAIOR VOLUME' as info;

SELECT 
    report_number,
    date,
    client_rep_name,
    pump_prefix,
    realized_volume,
    total_value,
    status,
    created_at
FROM reports 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
  AND realized_volume > 0
ORDER BY realized_volume DESC
LIMIT 10;

-- 6. VERIFICAR VOLUME POR BOMBA NO MÊS
SELECT 
    'VOLUME POR BOMBA NO MÊS' as info;

SELECT 
    pump_prefix,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3,
    SUM(total_value) as valor_total,
    COUNT(CASE WHEN status = 'PAGO' THEN 1 END) as relatorios_pagos,
    SUM(CASE WHEN status = 'PAGO' THEN realized_volume ELSE 0 END) as volume_pagos_m3
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND pump_prefix IS NOT NULL
GROUP BY pump_prefix
ORDER BY volume_total_m3 DESC;

-- 7. COMPARAR VOLUME TOTAL VS VOLUME PAGO
SELECT 
    'COMPARAÇÃO VOLUME TOTAL VS PAGO' as info;

-- Volume total (todos os relatórios)
SELECT 
    'TODOS OS RELATÓRIOS' as tipo,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);

-- Volume apenas pagos
SELECT 
    'APENAS PAGOS' as tipo,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'PAGO';

-- 8. VERIFICAR RELATÓRIOS NÃO PAGOS COM VOLUME
SELECT 
    'RELATÓRIOS NÃO PAGOS COM VOLUME' as info;

SELECT 
    status,
    COUNT(*) as quantidade,
    SUM(realized_volume) as volume_m3,
    SUM(total_value) as valor_total,
    ROUND(AVG(realized_volume), 2) as volume_medio
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status != 'PAGO'
  AND realized_volume > 0
GROUP BY status
ORDER BY volume_m3 DESC;

