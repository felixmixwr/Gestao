-- =============================================
-- VERIFICAR DISCREPÂNCIA DE VOLUME ENTRE DASHBOARD E FINANCEIRO
-- =============================================
-- Este script identifica a diferença entre os cálculos de volume

-- 1. VERIFICAR VOLUME TOTAL (TODOS OS RELATÓRIOS - COMO NO DASHBOARD PRINCIPAL)
SELECT 
    'TODOS OS RELATÓRIOS (Dashboard Principal)' as fonte,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3,
    SUM(total_value) as valor_total
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);

-- 2. VERIFICAR VOLUME APENAS PAGOS (COMO NO MÓDULO FINANCEIRO)
SELECT 
    'APENAS PAGOS (Módulo Financeiro)' as fonte,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3,
    SUM(total_value) as valor_total
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'PAGO';

-- 3. VERIFICAR DISTRIBUIÇÃO POR STATUS
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

-- 4. VERIFICAR RELATÓRIOS NÃO PAGOS COM MAIOR VOLUME
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
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status != 'PAGO'
  AND realized_volume > 0
ORDER BY realized_volume DESC
LIMIT 10;

-- 5. VERIFICAR RELATÓRIOS RECENTES POR STATUS
SELECT 
    DATE(date) as data,
    status,
    COUNT(*) as quantidade,
    SUM(realized_volume) as volume_dia,
    SUM(total_value) as valor_dia
FROM reports 
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(date), status
ORDER BY data DESC, status;

-- 6. COMPARAR CÁLCULOS ESPECÍFICOS
SELECT 
    'COMPARAÇÃO DETALHADA' as info;

-- Volume total do mês (todos)
SELECT 
    'Volume Total Mês (Todos)' as tipo,
    SUM(realized_volume) as volume_m3
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);

-- Volume total do mês (apenas pagos)
SELECT 
    'Volume Total Mês (Pagos)' as tipo,
    SUM(realized_volume) as volume_m3
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'PAGO';

-- Volume hoje (todos)
SELECT 
    'Volume Hoje (Todos)' as tipo,
    SUM(realized_volume) as volume_m3
FROM reports 
WHERE date = CURRENT_DATE;

-- Volume hoje (apenas pagos)
SELECT 
    'Volume Hoje (Pagos)' as tipo,
    SUM(realized_volume) as volume_m3
FROM reports 
WHERE date = CURRENT_DATE
  AND status = 'PAGO';

-- 7. VERIFICAR SE HÁ RELATÓRIOS COM STATUS DIFERENTE DE PAGO
SELECT 
    'RELATÓRIOS NÃO PAGOS NO MÊS' as info;

SELECT 
    status,
    COUNT(*) as quantidade,
    SUM(realized_volume) as volume_perdido_m3,
    SUM(total_value) as valor_perdido
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status != 'PAGO'
GROUP BY status
ORDER BY volume_perdido_m3 DESC;

