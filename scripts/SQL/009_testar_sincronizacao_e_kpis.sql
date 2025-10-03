-- =============================================
-- TESTE DE SINCRONIZAÇÃO E KPIs
-- =============================================
-- Este script testa se a sincronização e os KPIs estão funcionando corretamente

-- 1. VERIFICAR ESTRUTURA ATUAL
SELECT '=== VERIFICAÇÃO DA ESTRUTURA ATUAL ===' as info;

-- Verificar se as views existem
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'view_pagamentos_receber_integrado',
    'view_kpis_financeiros_unificados'
)
ORDER BY table_name;

-- 2. VERIFICAR TRIGGERS ATIVOS
SELECT '=== TRIGGERS ATIVOS ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('reports', 'pagamentos_receber')
ORDER BY event_object_table, trigger_name;

-- 3. TESTAR VIEW DE KPIs
SELECT '=== TESTE DOS KPIs ===' as info;

SELECT 
    'KPIs Financeiros' as teste,
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

-- 4. TESTAR VIEW INTEGRADA
SELECT '=== TESTE DA VIEW INTEGRADA ===' as info;

SELECT 
    'Pagamentos Integrados' as teste,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status_unificado = 'aguardando' THEN 1 END) as aguardando,
    COUNT(CASE WHEN status_unificado = 'pago' THEN 1 END) as pagos,
    COUNT(CASE WHEN status_unificado = 'vencido' THEN 1 END) as vencidos,
    COUNT(CASE WHEN status_unificado = 'proximo_vencimento' THEN 1 END) as proximo_vencimento
FROM view_pagamentos_receber_integrado;

-- 5. VERIFICAR DADOS DETALHADOS
SELECT '=== DADOS DETALHADOS ===' as info;

-- Pagamentos por status na tabela pagamentos_receber
SELECT 
    'Tabela pagamentos_receber' as fonte,
    status,
    COUNT(*) as quantidade,
    SUM(valor_total) as valor_total
FROM pagamentos_receber
GROUP BY status
ORDER BY status;

-- Relatórios por status
SELECT 
    'Tabela reports' as fonte,
    status,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports
GROUP BY status
ORDER BY status;

-- 6. VERIFICAR INCONSISTÊNCIAS
SELECT '=== VERIFICAÇÃO DE INCONSISTÊNCIAS ===' as info;

-- Relatórios PAGO sem pagamento correspondente
SELECT 
    'Relatórios PAGO sem pagamento' as problema,
    COUNT(*) as quantidade
FROM reports r
WHERE r.status = 'PAGO'
AND NOT EXISTS (
    SELECT 1 FROM pagamentos_receber pr 
    WHERE pr.relatorio_id = r.id
);

-- Pagamentos pago com relatório não PAGO
SELECT 
    'Pagamentos pago com relatório não PAGO' as problema,
    COUNT(*) as quantidade
FROM pagamentos_receber pr
JOIN reports r ON pr.relatorio_id = r.id
WHERE pr.status = 'pago' AND r.status != 'PAGO';

-- 7. SUGESTÕES DE CORREÇÃO
SELECT '=== SUGESTÕES DE CORREÇÃO ===' as info;

-- Mostrar alguns exemplos de pagamentos que podem ser testados
SELECT 
    'Pagamentos para teste' as info,
    pr.id as pagamento_id,
    pr.status as status_pagamento,
    r.status as status_relatorio,
    pr.valor_total,
    c.name as cliente_nome
FROM pagamentos_receber pr
JOIN reports r ON pr.relatorio_id = r.id
JOIN clients c ON pr.cliente_id = c.id
WHERE pr.status = 'aguardando'
LIMIT 3;

-- 8. INSTRUÇÕES FINAIS
SELECT '=== INSTRUÇÕES FINAIS ===' as info;
SELECT '1. Execute os scripts de correção se necessário' as passo1;
SELECT '2. Teste marcar um pagamento como pago na interface' as passo2;
SELECT '3. Verifique se o relatório foi sincronizado' as passo3;
SELECT '4. Verifique se os KPIs foram atualizados' as passo4;
SELECT '5. Se ainda houver problemas, execute o script de migração de dados' as passo5;
