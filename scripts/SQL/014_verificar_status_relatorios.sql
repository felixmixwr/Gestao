-- =============================================
-- VERIFICAR STATUS DOS RELATÓRIOS
-- =============================================
-- Este script verifica quais status existem na tabela reports

-- 1. CONTAR POR STATUS NA TABELA REPORTS
SELECT 
    status,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports
GROUP BY status
ORDER BY status;

-- 2. MOSTRAR ALGUNS EXEMPLOS DE CADA STATUS
SELECT '=== EXEMPLOS POR STATUS ===' as info;

-- Aguardando Pagamento
SELECT 
    'AGUARDANDO_PAGAMENTO' as status_tipo,
    r.report_number,
    r.status,
    r.total_value,
    r.date,
    c.name as cliente_nome
FROM reports r
JOIN clients c ON r.client_id = c.id
WHERE r.status = 'AGUARDANDO_PAGAMENTO'
ORDER BY r.date DESC
LIMIT 3;

-- Nota Emitida
SELECT 
    'NOTA_EMITIDA' as status_tipo,
    r.report_number,
    r.status,
    r.total_value,
    r.date,
    c.name as cliente_nome
FROM reports r
JOIN clients c ON r.client_id = c.id
WHERE r.status = 'NOTA_EMITIDA'
ORDER BY r.date DESC
LIMIT 3;

-- Pago (se existir)
SELECT 
    'PAGO' as status_tipo,
    r.report_number,
    r.status,
    r.total_value,
    r.date,
    c.name as cliente_nome
FROM reports r
JOIN clients c ON r.client_id = c.id
WHERE r.status = 'PAGO'
ORDER BY r.date DESC
LIMIT 3;

-- 3. VERIFICAR SE HÁ RELATÓRIOS QUE DEVERIAM ESTAR PAGO
SELECT '=== VERIFICAÇÃO DE INCONSISTÊNCIAS ===' as info;

-- Relatórios com pagamentos pago mas status não PAGO
SELECT 
    'Relatórios com pagamento pago mas status não PAGO' as problema,
    COUNT(*) as quantidade
FROM reports r
JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
WHERE pr.status = 'pago' AND r.status != 'PAGO';

-- Mostrar exemplos
SELECT 
    r.report_number,
    r.status as status_relatorio,
    pr.status as status_pagamento,
    r.total_value,
    c.name as cliente_nome
FROM reports r
JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
JOIN clients c ON r.client_id = c.id
WHERE pr.status = 'pago' AND r.status != 'PAGO'
LIMIT 5;
