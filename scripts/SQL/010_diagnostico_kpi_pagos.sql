-- =============================================
-- DIAGNÓSTICO DO PROBLEMA DOS KPIs PAGOS
-- =============================================
-- Este script diagnostica por que os KPIs não estão contando corretamente

-- 1. VERIFICAR DADOS NAS TABELAS
SELECT '=== DIAGNÓSTICO DAS TABELAS ===' as info;

-- Contar por status na tabela pagamentos_receber
SELECT 
    'Tabela pagamentos_receber' as fonte,
    status,
    COUNT(*) as quantidade,
    SUM(valor_total) as valor_total
FROM pagamentos_receber
GROUP BY status
ORDER BY status;

-- Contar por status na tabela reports
SELECT 
    'Tabela reports' as fonte,
    status,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports
GROUP BY status
ORDER BY status;

-- 2. VERIFICAR RELATÓRIOS PAGO SEM PAGAMENTO CORRESPONDENTE
SELECT '=== RELATÓRIOS PAGO SEM PAGAMENTO ===' as info;

SELECT 
    r.id as relatorio_id,
    r.report_number,
    r.status as status_relatorio,
    r.total_value,
    r.date,
    c.name as cliente_nome,
    CASE 
        WHEN pr.id IS NULL THEN 'SEM PAGAMENTO'
        ELSE 'COM PAGAMENTO'
    END as tem_pagamento
FROM reports r
JOIN clients c ON r.client_id = c.id
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
WHERE r.status = 'PAGO'
ORDER BY r.date DESC;

-- 3. VERIFICAR PAGAMENTOS PAGO
SELECT '=== PAGAMENTOS MARCADOS COMO PAGO ===' as info;

SELECT 
    pr.id as pagamento_id,
    pr.status as status_pagamento,
    pr.valor_total,
    r.id as relatorio_id,
    r.report_number,
    r.status as status_relatorio,
    r.total_value,
    c.name as cliente_nome
FROM pagamentos_receber pr
JOIN reports r ON pr.relatorio_id = r.id
JOIN clients c ON pr.cliente_id = c.id
WHERE pr.status = 'pago'
ORDER BY pr.updated_at DESC;

-- 4. TESTAR A VIEW DE KPIs ATUAL
SELECT '=== TESTE DA VIEW KPIs ===' as info;

SELECT 
    pagamentos_aguardando,
    pagamentos_pagos,
    pagamentos_vencidos,
    pagamentos_proximo_vencimento,
    valor_aguardando,
    valor_pago,
    valor_vencido,
    valor_proximo_vencimento,
    faturamento_hoje,
    faturamento_mes,
    total_pagamentos,
    valor_total_pagamentos
FROM view_kpis_financeiros_unificados;

-- 5. TESTAR AS SUBQUERIES INDIVIDUALMENTE
SELECT '=== TESTE DAS SUBQUERIES ===' as info;

-- Pagamentos pago na tabela pagamentos_receber
SELECT 
    'Pagamentos pago na tabela pagamentos_receber' as teste,
    COUNT(*) as quantidade,
    SUM(valor_total) as valor_total
FROM pagamentos_receber 
WHERE status = 'pago';

-- Relatórios PAGO sem pagamento
SELECT 
    'Relatórios PAGO sem pagamento' as teste,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports r 
WHERE r.status = 'PAGO' 
AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id);

-- 6. VERIFICAR INCONSISTÊNCIAS
SELECT '=== VERIFICAÇÃO DE INCONSISTÊNCIAS ===' as info;

-- Pagamentos pago com relatório não PAGO
SELECT 
    'Pagamentos pago com relatório não PAGO' as problema,
    COUNT(*) as quantidade
FROM pagamentos_receber pr
JOIN reports r ON pr.relatorio_id = r.id
WHERE pr.status = 'pago' AND r.status != 'PAGO';

-- Relatórios PAGO com pagamento não pago
SELECT 
    'Relatórios PAGO com pagamento não pago' as problema,
    COUNT(*) as quantidade
FROM reports r
JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
WHERE r.status = 'PAGO' AND pr.status != 'pago';

-- 7. SUGESTÕES DE CORREÇÃO
SELECT '=== SUGESTÕES DE CORREÇÃO ===' as info;

-- Mostrar alguns exemplos que podem ser testados
SELECT 
    'Exemplos para teste' as info,
    pr.id as pagamento_id,
    pr.status as status_pagamento,
    r.status as status_relatorio,
    pr.valor_total,
    c.name as cliente_nome,
    r.report_number
FROM pagamentos_receber pr
JOIN reports r ON pr.relatorio_id = r.id
JOIN clients c ON pr.cliente_id = c.id
WHERE pr.status = 'aguardando'
LIMIT 3;

SELECT '=== FIM DO DIAGNÓSTICO ===' as info;
