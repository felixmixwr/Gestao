-- =============================================
-- DIAGNÓSTICO SIMPLES - RELATÓRIOS PAGO
-- =============================================
-- Este script mostra rapidamente quantos relatórios PAGO existem

-- 1. CONTAR RELATÓRIOS PAGO
SELECT 
    'Relatórios PAGO' as tipo,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports 
WHERE status = 'PAGO';

-- 2. CONTAR PAGAMENTOS PAGO
SELECT 
    'Pagamentos pago' as tipo,
    COUNT(*) as quantidade,
    SUM(valor_total) as valor_total
FROM pagamentos_receber 
WHERE status = 'pago';

-- 3. MOSTRAR ALGUNS RELATÓRIOS PAGO
SELECT 
    'Exemplos de relatórios PAGO' as info,
    r.report_number,
    r.status,
    r.total_value,
    r.date,
    c.name as cliente_nome
FROM reports r
JOIN clients c ON r.client_id = c.id
WHERE r.status = 'PAGO'
ORDER BY r.date DESC
LIMIT 5;

-- 4. VERIFICAR SE EXISTEM RELATÓRIOS PAGO SEM PAGAMENTO
SELECT 
    'Relatórios PAGO sem pagamento na tabela pagamentos_receber' as info,
    COUNT(*) as quantidade
FROM reports r 
WHERE r.status = 'PAGO' 
AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id);
