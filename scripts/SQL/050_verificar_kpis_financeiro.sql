-- Script para verificar os novos KPIs do módulo financeiro
-- Este script testa as consultas de volume e faturamento por período

-- 1. Verificar faturamento mensal
SELECT 
    DATE_TRUNC('month', date) as mes,
    SUM(total_value) as faturamento_total,
    SUM(realized_volume) as volume_total,
    COUNT(*) as total_relatorios
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'PAGO'
GROUP BY DATE_TRUNC('month', date)
ORDER BY mes DESC;

-- 2. Verificar volume diário com bombas
SELECT 
    pump_prefix,
    SUM(realized_volume) as volume_total,
    COUNT(*) as total_servicos,
    SUM(total_value) as faturamento_total
FROM reports 
WHERE date = CURRENT_DATE
  AND status = 'PAGO'
GROUP BY pump_prefix
ORDER BY volume_total DESC;

-- 3. Verificar volume semanal com bombas
SELECT 
    pump_prefix,
    SUM(realized_volume) as volume_total,
    COUNT(*) as total_servicos,
    SUM(total_value) as faturamento_total
FROM reports 
WHERE date >= DATE_TRUNC('week', CURRENT_DATE)
  AND status = 'PAGO'
GROUP BY pump_prefix
ORDER BY volume_total DESC;

-- 4. Verificar volume mensal com bombas
SELECT 
    pump_prefix,
    SUM(realized_volume) as volume_total,
    COUNT(*) as total_servicos,
    SUM(total_value) as faturamento_total
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'PAGO'
GROUP BY pump_prefix
ORDER BY volume_total DESC;

-- 5. Verificar relatórios por status
SELECT 
    status,
    COUNT(*) as total_relatorios,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY status
ORDER BY total_relatorios DESC;

-- 6. Verificar bombas mais ativas no mês
SELECT 
    pump_prefix,
    COUNT(*) as total_servicos,
    SUM(realized_volume) as volume_total,
    SUM(total_value) as faturamento_total,
    AVG(realized_volume) as volume_medio_por_servico
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'PAGO'
  AND pump_prefix IS NOT NULL
GROUP BY pump_prefix
ORDER BY volume_total DESC
LIMIT 10;

-- 7. Verificar distribuição de volume por dia da semana
SELECT 
    EXTRACT(DOW FROM date) as dia_semana,
    CASE EXTRACT(DOW FROM date)
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Segunda'
        WHEN 2 THEN 'Terça'
        WHEN 3 THEN 'Quarta'
        WHEN 4 THEN 'Quinta'
        WHEN 5 THEN 'Sexta'
        WHEN 6 THEN 'Sábado'
    END as nome_dia,
    COUNT(*) as total_servicos,
    SUM(realized_volume) as volume_total,
    SUM(total_value) as faturamento_total
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'PAGO'
GROUP BY EXTRACT(DOW FROM date)
ORDER BY dia_semana;

-- 8. Verificar eficiência por bomba (volume/faturamento)
SELECT 
    pump_prefix,
    SUM(realized_volume) as volume_total,
    SUM(total_value) as faturamento_total,
    CASE 
        WHEN SUM(realized_volume) > 0 THEN 
            ROUND(SUM(total_value) / SUM(realized_volume), 2)
        ELSE 0 
    END as valor_por_m3,
    COUNT(*) as total_servicos
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'PAGO'
  AND pump_prefix IS NOT NULL
GROUP BY pump_prefix
HAVING SUM(realized_volume) > 0
ORDER BY valor_por_m3 DESC;

-- 9. Verificar tendência de faturamento nos últimos 30 dias
SELECT 
    DATE(date) as data,
    COUNT(*) as relatorios_dia,
    SUM(total_value) as faturamento_dia,
    SUM(realized_volume) as volume_dia
FROM reports 
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
  AND status = 'PAGO'
GROUP BY DATE(date)
ORDER BY data DESC;

-- 10. Verificar top clientes por faturamento no mês
SELECT 
    client_rep_name as cliente,
    COUNT(*) as total_servicos,
    SUM(total_value) as faturamento_total,
    SUM(realized_volume) as volume_total
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'PAGO'
  AND client_rep_name IS NOT NULL
GROUP BY client_rep_name
ORDER BY faturamento_total DESC
LIMIT 10;
