-- =============================================
-- TESTAR ALTERAÇÕES NO MÓDULO FINANCEIRO
-- =============================================
-- Este script testa as alterações implementadas

-- 1. VERIFICAR FATURAMENTO BRUTO (APENAS PAGOS)
SELECT 
    'FATURAMENTO BRUTO (Apenas PAGOS)' as tipo,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3,
    SUM(total_value) as valor_total,
    ROUND(AVG(realized_volume), 2) as volume_medio_por_relatorio
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'PAGO';

-- 2. VERIFICAR VOLUME TOTAL (TODOS OS RELATÓRIOS)
SELECT 
    'VOLUME TOTAL (Todos os relatórios)' as tipo,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3,
    SUM(total_value) as valor_total
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);

-- 3. VERIFICAR PAGAMENTOS A RECEBER
SELECT 
    'PAGAMENTOS A RECEBER - ESTATÍSTICAS' as info;

SELECT 
    status,
    COUNT(*) as total_pagamentos,
    SUM(valor_total) as valor_total,
    ROUND(AVG(valor_total), 2) as valor_medio
FROM pagamentos_receber
GROUP BY status
ORDER BY valor_total DESC;

-- 4. VERIFICAR PAGAMENTOS PRÓXIMOS DO VENCIMENTO
SELECT 
    'PAGAMENTOS PRÓXIMOS DO VENCIMENTO' as info;

SELECT 
    pr.id,
    pr.valor_total,
    pr.prazo_data,
    pr.status,
    pr.forma_pagamento,
    c.name as cliente_nome,
    comp.name as empresa_nome
FROM pagamentos_receber pr
LEFT JOIN reports r ON pr.relatorio_id = r.id
LEFT JOIN clients c ON r.client_id = c.id
LEFT JOIN companies comp ON c.company_id = comp.id
WHERE pr.prazo_data >= CURRENT_DATE
  AND pr.prazo_data <= CURRENT_DATE + INTERVAL '7 days'
  AND pr.status != 'pago'
ORDER BY pr.prazo_data ASC
LIMIT 10;

-- 5. VERIFICAR PAGAMENTOS VENCIDOS
SELECT 
    'PAGAMENTOS VENCIDOS' as info;

SELECT 
    pr.id,
    pr.valor_total,
    pr.prazo_data,
    pr.status,
    pr.forma_pagamento,
    c.name as cliente_nome,
    comp.name as empresa_nome,
    CURRENT_DATE - pr.prazo_data as dias_vencido
FROM pagamentos_receber pr
LEFT JOIN reports r ON pr.relatorio_id = r.id
LEFT JOIN clients c ON r.client_id = c.id
LEFT JOIN companies comp ON c.company_id = comp.id
WHERE pr.prazo_data < CURRENT_DATE
  AND pr.status != 'pago'
ORDER BY pr.prazo_data ASC
LIMIT 10;

-- 6. VERIFICAR DISTRIBUIÇÃO DE STATUS DOS RELATÓRIOS
SELECT 
    'DISTRIBUIÇÃO DE STATUS DOS RELATÓRIOS' as info;

SELECT 
    status,
    COUNT(*) as total_relatorios,
    SUM(realized_volume) as volume_total_m3,
    SUM(total_value) as valor_total,
    ROUND(
        (COUNT(*) * 100.0 / 
         (SELECT COUNT(*) FROM reports WHERE date >= DATE_TRUNC('month', CURRENT_DATE))
        ), 2
    ) as percentual_relatorios,
    ROUND(
        (SUM(realized_volume) * 100.0 / 
         (SELECT SUM(realized_volume) FROM reports WHERE date >= DATE_TRUNC('month', CURRENT_DATE))
        ), 2
    ) as percentual_volume
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY status
ORDER BY volume_total_m3 DESC;

-- 7. VERIFICAR RELATÓRIOS NÃO PAGOS COM MAIOR VOLUME
SELECT 
    'RELATÓRIOS NÃO PAGOS COM MAIOR VOLUME' as info;

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

-- 8. VERIFICAR RESUMO GERAL
SELECT 
    'RESUMO GERAL DO MÓDULO FINANCEIRO' as info;

-- Faturamento bruto (apenas pagos)
SELECT 
    'Faturamento Bruto (Pagos)' as metric,
    COUNT(*) as quantidade,
    SUM(realized_volume) as volume_m3,
    SUM(total_value) as valor_total
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'PAGO';

-- Volume total (todos os relatórios)
SELECT 
    'Volume Total (Todos)' as metric,
    COUNT(*) as quantidade,
    SUM(realized_volume) as volume_m3,
    SUM(total_value) as valor_total
FROM reports 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);

-- Pagamentos a receber
SELECT 
    'Pagamentos a Receber' as metric,
    COUNT(*) as quantidade,
    0 as volume_m3,
    SUM(valor_total) as valor_total
FROM pagamentos_receber
WHERE status != 'pago';

-- Despesas
SELECT 
    'Despesas' as metric,
    COUNT(*) as quantidade,
    0 as volume_m3,
    SUM(valor) as valor_total
FROM expenses
WHERE data_despesa >= DATE_TRUNC('month', CURRENT_DATE);

