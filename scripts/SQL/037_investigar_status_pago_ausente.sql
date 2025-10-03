-- =============================================
-- INVESTIGAR POR QUE NÃO HÁ STATUS "PAGO"
-- =============================================
-- Este script investiga por que não há registros com status "pago"

-- 1. VERIFICAR STATUS REAIS NA TABELA PAGAMENTOS_RECEBER
SELECT '=== STATUS REAIS NA TABELA PAGAMENTOS_RECEBER ===' as info;

SELECT 
    status,
    COUNT(*) as quantidade
FROM pagamentos_receber
GROUP BY status
ORDER BY status;

-- 2. VERIFICAR STATUS REAIS NA TABELA REPORTS
SELECT '=== STATUS REAIS NA TABELA REPORTS ===' as info;

SELECT 
    status,
    COUNT(*) as quantidade
FROM reports
GROUP BY status
ORDER BY status;

-- 3. VERIFICAR SE HÁ PAGAMENTOS COM STATUS "PAGO" MAS QUE NÃO APARECEM NA VIEW
SELECT '=== VERIFICANDO PAGAMENTOS COM STATUS PAGO ===' as info;

SELECT 
    id,
    relatorio_id,
    status as pagamento_status,
    valor_total,
    prazo_data,
    created_at
FROM pagamentos_receber
WHERE status = 'pago'
ORDER BY created_at DESC
LIMIT 10;

-- 4. VERIFICAR SE HÁ RELATÓRIOS COM STATUS "PAGO"
SELECT '=== VERIFICANDO RELATÓRIOS COM STATUS PAGO ===' as info;

SELECT 
    id,
    report_number,
    status as relatorio_status,
    total_value,
    date,
    created_at
FROM reports
WHERE status = 'PAGO'
ORDER BY created_at DESC
LIMIT 10;

-- 5. VERIFICAR SE A VIEW ESTÁ FUNCIONANDO CORRETAMENTE
SELECT '=== TESTANDO VIEW COM DADOS REAIS ===' as info;

SELECT 
    pr.id,
    pr.status as pagamento_status_real,
    pr.relatorio_id,
    r.status as relatorio_status_real,
    vpi.status_unificado as status_unificado_view
FROM pagamentos_receber pr
JOIN reports r ON pr.relatorio_id = r.id
LEFT JOIN view_pagamentos_receber_integrado vpi ON pr.id = vpi.id
WHERE pr.status = 'pago' OR r.status = 'PAGO'
ORDER BY pr.created_at DESC
LIMIT 10;

-- 6. VERIFICAR SE HÁ PROBLEMA NA VIEW
SELECT '=== VERIFICANDO PROBLEMAS NA VIEW ===' as info;

SELECT 
    COUNT(*) as total_pagamentos_receber,
    COUNT(CASE WHEN status = 'pago' THEN 1 END) as pagamentos_pago,
    COUNT(CASE WHEN status = 'aguardando' THEN 1 END) as pagamentos_aguardando,
    COUNT(CASE WHEN status = 'vencido' THEN 1 END) as pagamentos_vencido
FROM pagamentos_receber;

-- 7. VERIFICAR SE A VIEW ESTÁ INCLUINDO TODOS OS REGISTROS
SELECT '=== VERIFICANDO COBERTURA DA VIEW ===' as info;

SELECT 
    'Total na tabela pagamentos_receber' as fonte,
    COUNT(*) as quantidade
FROM pagamentos_receber

UNION ALL

SELECT 
    'Total na view_pagamentos_receber_integrado' as fonte,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado;

-- 8. VERIFICAR REGISTROS QUE NÃO ESTÃO NA VIEW
SELECT '=== REGISTROS QUE NÃO ESTÃO NA VIEW ===' as info;

SELECT 
    pr.id,
    pr.status,
    pr.relatorio_id,
    r.id as relatorio_existe,
    c.id as cliente_existe
FROM pagamentos_receber pr
LEFT JOIN reports r ON pr.relatorio_id = r.id
LEFT JOIN clients c ON pr.cliente_id = c.id
LEFT JOIN view_pagamentos_receber_integrado vpi ON pr.id = vpi.id
WHERE vpi.id IS NULL
ORDER BY pr.created_at DESC
LIMIT 10;

SELECT '=== INVESTIGAÇÃO CONCLUÍDA ===' as info;
