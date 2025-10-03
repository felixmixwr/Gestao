-- =============================================
-- MIGRAÇÃO DE DADOS EXISTENTES
-- =============================================
-- Este script migra dados existentes para a nova estrutura integrada

-- 1. EXECUTAR MIGRAÇÃO DE DADOS
SELECT '=== INICIANDO MIGRAÇÃO DE DADOS ===' as info;

-- Executar a função de migração
SELECT * FROM migrar_dados_existentes_para_integracao();

-- 2. VERIFICAR RESULTADOS DA MIGRAÇÃO
SELECT '=== VERIFICAÇÃO PÓS-MIGRAÇÃO ===' as info;

-- Contar relatórios por status
SELECT 
    'Relatórios por status' as categoria,
    status,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports
GROUP BY status
ORDER BY quantidade DESC;

-- Contar pagamentos por status
SELECT 
    'Pagamentos por status' as categoria,
    status,
    COUNT(*) as quantidade,
    SUM(valor_total) as valor_total
FROM pagamentos_receber
GROUP BY status
ORDER BY quantidade DESC;

-- Verificar sincronização
SELECT 
    'Sincronização Relatórios-Pagamentos' as categoria,
    r.status as relatorio_status,
    pr.status as pagamento_status,
    COUNT(*) as quantidade
FROM reports r
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
WHERE r.status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO', 'PAGO')
GROUP BY r.status, pr.status
ORDER BY r.status, pr.status;

-- 3. TESTAR VIEWS INTEGRADAS
SELECT '=== TESTE DAS VIEWS INTEGRADAS ===' as info;

-- Testar view de KPIs
SELECT 
    'KPIs Financeiros' as teste,
    total_pagamentos,
    valor_total_pagamentos,
    pagamentos_aguardando,
    pagamentos_pagos,
    faturamento_hoje,
    faturamento_mes
FROM view_kpis_financeiros_unificados;

-- Testar view de pagamentos integrados
SELECT 
    'Pagamentos Integrados' as teste,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN tem_nota_fiscal THEN 1 END) as com_nota_fiscal,
    COUNT(CASE WHEN relatorio_pago THEN 1 END) as relatorios_pagos
FROM view_pagamentos_receber_integrado;

-- 4. VERIFICAR TRIGGERS ATIVOS
SELECT '=== TRIGGERS ATIVOS ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('reports', 'pagamentos_receber', 'notas_fiscais')
AND trigger_name LIKE '%integrado%'
ORDER BY event_object_table, trigger_name;

-- 5. TESTE DE SINCRONIZAÇÃO
SELECT '=== TESTE DE SINCRONIZAÇÃO ===' as info;

-- Mostrar alguns exemplos de dados sincronizados
SELECT 
    'Exemplos de Sincronização' as categoria,
    r.report_number,
    r.status as relatorio_status,
    pr.status as pagamento_status,
    pr.valor_total,
    nf.numero_nota,
    nf.status as nf_status
FROM reports r
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
LEFT JOIN notas_fiscais nf ON r.id = nf.relatorio_id
WHERE r.status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO', 'PAGO')
ORDER BY r.created_at DESC
LIMIT 10;

-- 6. RESUMO FINAL
SELECT '=== RESUMO DA MIGRAÇÃO ===' as info;

SELECT 
    'Total de relatórios' as item,
    COUNT(*) as valor
FROM reports
UNION ALL
SELECT 
    'Total de pagamentos' as item,
    COUNT(*) as valor
FROM pagamentos_receber
UNION ALL
SELECT 
    'Total de notas fiscais' as item,
    COUNT(*) as valor
FROM notas_fiscais
UNION ALL
SELECT 
    'Relatórios com pagamentos' as item,
    COUNT(*) as valor
FROM reports r
JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
UNION ALL
SELECT 
    'Relatórios com notas fiscais' as item,
    COUNT(*) as valor
FROM reports r
JOIN notas_fiscais nf ON r.id = nf.relatorio_id;

SELECT '=== MIGRAÇÃO CONCLUÍDA ===' as info;
SELECT 'Sistema integrado está funcionando!' as status;
SELECT 'Agora você pode testar a página de Pagamentos a receber' as proximo_passo;
