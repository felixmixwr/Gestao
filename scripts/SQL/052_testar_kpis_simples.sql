-- Script simples para testar os KPIs do financeiro
-- Execute este script para verificar se os dados estão corretos

-- 1. Verificar relatórios PAGO (deve retornar dados)
SELECT 
    'Relatórios PAGO' as teste,
    COUNT(*) as total,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
WHERE status = 'PAGO';

-- 2. Verificar relatórios de hoje (pode estar vazio se não houver relatórios hoje)
SELECT 
    'Relatórios de hoje' as teste,
    COUNT(*) as total,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
WHERE DATE(date) = CURRENT_DATE;

-- 3. Verificar relatórios de hoje PAGO
SELECT 
    'Relatórios de hoje PAGO' as teste,
    COUNT(*) as total,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
WHERE DATE(date) = CURRENT_DATE 
  AND status = 'PAGO';

-- 4. Verificar relatórios do mês atual PAGO
SELECT 
    'Relatórios do mês PAGO' as teste,
    COUNT(*) as total,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'PAGO';

-- 5. Verificar relatórios da semana atual PAGO
SELECT 
    'Relatórios da semana PAGO' as teste,
    COUNT(*) as total,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
WHERE DATE_TRUNC('week', date) = DATE_TRUNC('week', CURRENT_DATE)
  AND status = 'PAGO';

-- 6. Verificar datas dos relatórios mais recentes
SELECT 
    'Datas recentes' as teste,
    date,
    status,
    COUNT(*) as total,
    SUM(total_value) as valor_total
FROM reports 
GROUP BY date, status
ORDER BY date DESC
LIMIT 5;

-- 7. Verificar se há relatórios com pump_prefix
SELECT 
    'Bombas com prefixo' as teste,
    pump_prefix,
    COUNT(*) as total_servicos,
    SUM(realized_volume) as volume_total,
    SUM(total_value) as faturamento_total
FROM reports 
WHERE status = 'PAGO'
  AND pump_prefix IS NOT NULL
GROUP BY pump_prefix
ORDER BY volume_total DESC
LIMIT 5;

-- 8. Verificar todos os status disponíveis
SELECT 
    'Status disponíveis' as teste,
    status,
    COUNT(*) as total
FROM reports 
GROUP BY status
ORDER BY total DESC;
