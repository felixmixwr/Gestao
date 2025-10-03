-- =============================================
-- TESTE: MARCAR RELATÓRIOS COMO PAGO
-- =============================================
-- Este script marca alguns relatórios como PAGO para testar os KPIs

-- 1. MOSTRAR RELATÓRIOS QUE PODEM SER MARCADOS COMO PAGO
SELECT '=== RELATÓRIOS QUE PODEM SER MARCADOS COMO PAGO ===' as info;

SELECT 
    r.id as relatorio_id,
    r.report_number,
    r.status,
    r.total_value,
    r.date,
    c.name as cliente_nome,
    CASE 
        WHEN pr.id IS NULL THEN 'SEM PAGAMENTO'
        ELSE 'COM PAGAMENTO: ' || pr.status
    END as situacao_pagamento
FROM reports r
JOIN clients c ON r.client_id = c.id
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
WHERE r.status IN ('AGUARDANDO_PAGAMENTO', 'NOTA_EMITIDA')
ORDER BY r.date DESC
LIMIT 5;

-- 2. MARCAR ALGUNS RELATÓRIOS COMO PAGO (APENAS PARA TESTE)
-- Descomente as linhas abaixo se quiser fazer o teste:

/*
UPDATE reports 
SET 
    status = 'PAGO',
    updated_at = NOW()
WHERE id IN (
    SELECT r.id 
    FROM reports r
    WHERE r.status = 'AGUARDANDO_PAGAMENTO'
    ORDER BY r.date DESC
    LIMIT 2
);
*/

-- 3. VERIFICAR RESULTADO (após descomentar o UPDATE acima)
/*
SELECT 
    'Relatórios PAGO após teste' as info,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports 
WHERE status = 'PAGO';
*/

-- 4. VERIFICAR KPIs APÓS TESTE
/*
SELECT 
    'KPIs após marcar relatórios como PAGO' as info,
    pagamentos_pagos,
    valor_pago
FROM view_kpis_financeiros_unificados;
*/

SELECT '=== SCRIPT DE TESTE CRIADO ===' as info;
SELECT 'Descomente as seções para executar o teste' as instrucao;
