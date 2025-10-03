-- Script para diagnosticar problemas nos KPIs do financeiro
-- Este script verifica se os dados estão corretos e identifica problemas

-- 1. Verificar se existem relatórios com status PAGO
SELECT 
    'Relatórios PAGO' as categoria,
    COUNT(*) as total,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
WHERE status = 'PAGO';

-- 2. Verificar relatórios por status
SELECT 
    status,
    COUNT(*) as total,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
GROUP BY status
ORDER BY total DESC;

-- 3. Verificar relatórios de hoje
SELECT 
    'Relatórios de hoje' as categoria,
    COUNT(*) as total,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
WHERE DATE(date) = CURRENT_DATE;

-- 4. Verificar relatórios de hoje com status PAGO
SELECT 
    'Relatórios de hoje PAGO' as categoria,
    COUNT(*) as total,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
WHERE DATE(date) = CURRENT_DATE 
  AND status = 'PAGO';

-- 5. Verificar relatórios do mês atual
SELECT 
    'Relatórios do mês atual' as categoria,
    COUNT(*) as total,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE);

-- 6. Verificar relatórios do mês atual com status PAGO
SELECT 
    'Relatórios do mês atual PAGO' as categoria,
    COUNT(*) as total,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'PAGO';

-- 7. Verificar relatórios da semana atual
SELECT 
    'Relatórios da semana atual' as categoria,
    COUNT(*) as total,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
WHERE DATE_TRUNC('week', date) = DATE_TRUNC('week', CURRENT_DATE);

-- 8. Verificar relatórios da semana atual com status PAGO
SELECT 
    'Relatórios da semana atual PAGO' as categoria,
    COUNT(*) as total,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
WHERE DATE_TRUNC('week', date) = DATE_TRUNC('week', CURRENT_DATE)
  AND status = 'PAGO';

-- 9. Verificar datas dos relatórios mais recentes
SELECT 
    date,
    status,
    COUNT(*) as total_relatorios,
    SUM(total_value) as valor_total,
    SUM(realized_volume) as volume_total
FROM reports 
GROUP BY date, status
ORDER BY date DESC
LIMIT 10;

-- 10. Verificar se há relatórios com pump_prefix
SELECT 
    'Relatórios com pump_prefix' as categoria,
    COUNT(*) as total,
    COUNT(CASE WHEN pump_prefix IS NOT NULL THEN 1 END) as com_prefixo,
    COUNT(CASE WHEN pump_prefix IS NULL THEN 1 END) as sem_prefixo
FROM reports;

-- 11. Verificar relatórios com pump_prefix e status PAGO
SELECT 
    pump_prefix,
    COUNT(*) as total_servicos,
    SUM(realized_volume) as volume_total,
    SUM(total_value) as faturamento_total
FROM reports 
WHERE status = 'PAGO'
  AND pump_prefix IS NOT NULL
GROUP BY pump_prefix
ORDER BY volume_total DESC
LIMIT 10;

-- 12. Verificar se a view view_estatisticas_faturamento existe
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'view_estatisticas_faturamento';

-- 13. Verificar se a view view_faturamento_bruto existe
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'view_faturamento_bruto';

-- 14. Testar consulta direta da view (se existir)
-- SELECT * FROM view_estatisticas_faturamento;

-- 15. Verificar estrutura da tabela reports
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'reports'
ORDER BY ordinal_position;
