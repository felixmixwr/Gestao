-- =============================================
-- SCRIPT DE DIAGNÓSTICO - DADOS EXISTENTES
-- =============================================
-- Este script mapeia todos os dados existentes ANTES de qualquer alteração
-- NÃO MODIFICA NENHUM DADO - APENAS CONSULTA

-- 1. CONTAGEM GERAL DE DADOS
SELECT '=== CONTAGEM GERAL DE DADOS ===' as info;

SELECT 
    'reports' as tabela,
    COUNT(*) as total_registros
FROM reports
UNION ALL
SELECT 
    'clients' as tabela,
    COUNT(*) as total_registros
FROM clients
UNION ALL
SELECT 
    'companies' as tabela,
    COUNT(*) as total_registros
FROM companies
UNION ALL
SELECT 
    'empresas_terceiras' as tabela,
    COUNT(*) as total_registros
FROM empresas_terceiras
UNION ALL
SELECT 
    'pumps' as tabela,
    COUNT(*) as total_registros
FROM pumps
UNION ALL
SELECT 
    'notas_fiscais' as tabela,
    COUNT(*) as total_registros
FROM notas_fiscais
UNION ALL
SELECT 
    'pagamentos_receber' as tabela,
    COUNT(*) as total_registros
FROM pagamentos_receber;

-- 2. STATUS DOS RELATÓRIOS
SELECT '=== STATUS DOS RELATÓRIOS ===' as info;

SELECT 
    status,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports
GROUP BY status
ORDER BY quantidade DESC;

-- 3. RELATÓRIOS QUE DEVEM TER PAGAMENTOS
SELECT '=== RELATÓRIOS QUE DEVEM TER PAGAMENTOS ===' as info;

SELECT 
    r.id,
    r.report_number,
    r.status,
    r.total_value,
    CASE 
        WHEN pr.id IS NOT NULL THEN 'TEM PAGAMENTO'
        ELSE 'SEM PAGAMENTO'
    END as tem_pagamento
FROM reports r
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
WHERE r.status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO', 'PAGO')
ORDER BY r.status, r.created_at DESC;

-- 4. PAGAMENTOS ÓRFÃOS (sem relatório correspondente)
SELECT '=== PAGAMENTOS ÓRFÃOS ===' as info;

SELECT 
    pr.id,
    pr.relatorio_id,
    pr.status,
    pr.valor_total,
    CASE 
        WHEN r.id IS NOT NULL THEN 'RELATÓRIO EXISTE'
        ELSE 'RELATÓRIO NÃO EXISTE'
    END as relatorio_status
FROM pagamentos_receber pr
LEFT JOIN reports r ON pr.relatorio_id = r.id
WHERE r.id IS NULL;

-- 5. NOTAS FISCAIS E SEUS RELATÓRIOS
SELECT '=== NOTAS FISCAIS E RELATÓRIOS ===' as info;

SELECT 
    nf.id,
    nf.numero_nota,
    nf.status as nf_status,
    nf.valor as nf_valor,
    r.status as relatorio_status,
    r.total_value as relatorio_valor,
    CASE 
        WHEN pr.id IS NOT NULL THEN 'TEM PAGAMENTO'
        ELSE 'SEM PAGAMENTO'
    END as tem_pagamento
FROM notas_fiscais nf
JOIN reports r ON nf.relatorio_id = r.id
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
ORDER BY nf.created_at DESC;

-- 6. TRIGGERS EXISTENTES
SELECT '=== TRIGGERS EXISTENTES ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('reports', 'pagamentos_receber', 'notas_fiscais')
ORDER BY event_object_table, trigger_name;

-- 7. VIEWS EXISTENTES
SELECT '=== VIEWS EXISTENTES ===' as info;

SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE '%pagamento%'
ORDER BY table_name;

-- 8. RESUMO PARA DECISÃO
SELECT '=== RESUMO PARA DECISÃO ===' as info;

SELECT 
    'Relatórios com NOTA_EMITIDA' as categoria,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports
WHERE status = 'NOTA_EMITIDA'
UNION ALL
SELECT 
    'Relatórios com AGUARDANDO_PAGAMENTO' as categoria,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports
WHERE status = 'AGUARDANDO_PAGAMENTO'
UNION ALL
SELECT 
    'Relatórios com PAGO' as categoria,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports
WHERE status = 'PAGO'
UNION ALL
SELECT 
    'Pagamentos criados' as categoria,
    COUNT(*) as quantidade,
    SUM(valor_total) as valor_total
FROM pagamentos_receber
UNION ALL
SELECT 
    'Notas fiscais criadas' as categoria,
    COUNT(*) as quantidade,
    SUM(valor) as valor_total
FROM notas_fiscais;

-- 9. INCONSISTÊNCIAS IDENTIFICADAS
SELECT '=== INCONSISTÊNCIAS IDENTIFICADAS ===' as info;

-- Relatórios que deveriam ter pagamentos mas não têm
SELECT 
    'Relatórios sem pagamento' as inconsistencia,
    COUNT(*) as quantidade
FROM reports r
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
WHERE r.status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO')
AND pr.id IS NULL
UNION ALL
-- Pagamentos órfãos
SELECT 
    'Pagamentos órfãos' as inconsistencia,
    COUNT(*) as quantidade
FROM pagamentos_receber pr
LEFT JOIN reports r ON pr.relatorio_id = r.id
WHERE r.id IS NULL
UNION ALL
-- Notas fiscais sem pagamento
SELECT 
    'Notas fiscais sem pagamento' as inconsistencia,
    COUNT(*) as quantidade
FROM notas_fiscais nf
JOIN reports r ON nf.relatorio_id = r.id
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
WHERE r.status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO')
AND pr.id IS NULL;
