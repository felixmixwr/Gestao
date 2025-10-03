-- =============================================
-- TESTAR CORREÇÃO DO VOLUME NO MÓDULO FINANCEIRO
-- =============================================
-- Este script testa se a correção está funcionando corretamente

-- 1. VERIFICAR VOLUME TOTAL (TODOS OS RELATÓRIOS - COMO DEVE SER AGORA)
SELECT 
    'VOLUME TOTAL CORRIGIDO (Todos os relatórios)' as tipo,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3,
    SUM(total_value) as valor_total,
    ROUND(AVG(realized_volume), 2) as volume_medio_por_relatorio
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);

-- 2. VERIFICAR VOLUME POR STATUS (PARA ENTENDER A DISTRIBUIÇÃO)
SELECT 
    'DISTRIBUIÇÃO POR STATUS' as info;

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

-- 3. VERIFICAR VOLUME DIÁRIO (TODOS OS RELATÓRIOS)
SELECT 
    'VOLUME DIÁRIO CORRIGIDO' as info;

SELECT 
    DATE(date) as data,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_dia_m3,
    SUM(total_value) as valor_dia,
    COUNT(CASE WHEN status = 'PAGO' THEN 1 END) as relatorios_pagos,
    SUM(CASE WHEN status = 'PAGO' THEN realized_volume ELSE 0 END) as volume_pagos_m3
FROM reports 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(date)
ORDER BY data DESC;

-- 4. VERIFICAR VOLUME SEMANAL (TODOS OS RELATÓRIOS)
SELECT 
    'VOLUME SEMANAL CORRIGIDO' as info;

SELECT 
    DATE_TRUNC('week', date) as semana,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_semana_m3,
    SUM(total_value) as valor_semana,
    COUNT(CASE WHEN status = 'PAGO' THEN 1 END) as relatorios_pagos,
    SUM(CASE WHEN status = 'PAGO' THEN realized_volume ELSE 0 END) as volume_pagos_m3
FROM reports 
WHERE date >= DATE_TRUNC('week', CURRENT_DATE)
GROUP BY DATE_TRUNC('week', date)
ORDER BY semana DESC;

-- 5. VERIFICAR VOLUME MENSAL (TODOS OS RELATÓRIOS)
SELECT 
    'VOLUME MENSAL CORRIGIDO' as info;

SELECT 
    DATE_TRUNC('month', date) as mes,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_mes_m3,
    SUM(total_value) as valor_mes,
    COUNT(CASE WHEN status = 'PAGO' THEN 1 END) as relatorios_pagos,
    SUM(CASE WHEN status = 'PAGO' THEN realized_volume ELSE 0 END) as volume_pagos_m3
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', date)
ORDER BY mes DESC;

-- 6. VERIFICAR VOLUME POR BOMBA (TODOS OS RELATÓRIOS)
SELECT 
    'VOLUME POR BOMBA CORRIGIDO' as info;

SELECT 
    pump_prefix,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3,
    SUM(total_value) as valor_total,
    COUNT(CASE WHEN status = 'PAGO' THEN 1 END) as relatorios_pagos,
    SUM(CASE WHEN status = 'PAGO' THEN realized_volume ELSE 0 END) as volume_pagos_m3,
    ROUND(AVG(realized_volume), 2) as volume_medio_por_relatorio
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND pump_prefix IS NOT NULL
GROUP BY pump_prefix
ORDER BY volume_total_m3 DESC
LIMIT 10;

-- 7. COMPARAR ANTES E DEPOIS DA CORREÇÃO
SELECT 
    'COMPARAÇÃO ANTES/DEPOIS DA CORREÇÃO' as info;

-- Volume total (todos os relatórios) - COMO DEVE SER AGORA
SELECT 
    'DEPOIS DA CORREÇÃO (Todos os relatórios)' as periodo,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);

-- Volume total (apenas pagos) - COMO ERA ANTES
SELECT 
    'ANTES DA CORREÇÃO (Apenas pagos)' as periodo,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'PAGO';

-- 8. VERIFICAR SE HÁ RELATÓRIOS COM STATUS DIFERENTE DE PAGO
SELECT 
    'RELATÓRIOS NÃO PAGOS NO MÊS' as info;

SELECT 
    status,
    COUNT(*) as quantidade,
    SUM(realized_volume) as volume_m3,
    SUM(total_value) as valor_total,
    ROUND(AVG(realized_volume), 2) as volume_medio
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status != 'PAGO'
GROUP BY status
ORDER BY volume_m3 DESC;

-- 9. VERIFICAR RELATÓRIOS RECENTES COM MAIOR VOLUME
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
LIMIT 15;

