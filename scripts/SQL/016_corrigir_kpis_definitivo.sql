-- =============================================
-- CORREÇÃO DEFINITIVA DOS KPIs - RELATÓRIOS PAGO
-- =============================================
-- Este script corrige os KPIs para contar corretamente os relatórios PAGO

-- 1. CORRIGIR VIEW DE KPIS UNIFICADOS (VERSÃO DEFINITIVA)
CREATE OR REPLACE VIEW view_kpis_financeiros_unificados AS
SELECT
    -- KPIs de Pagamentos (CORRIGIDO)
    (SELECT COUNT(*) FROM pagamentos_receber WHERE status = 'aguardando') as pagamentos_aguardando,
    
    -- Pagamentos pagos: contar TODOS os relatórios PAGO + pagamentos pago
    (
        -- Contar relatórios PAGO (independente de ter pagamento na tabela pagamentos_receber)
        (SELECT COUNT(*) FROM reports WHERE status = 'PAGO') +
        -- Contar pagamentos pago que não são de relatórios PAGO (para evitar duplicação)
        (SELECT COUNT(*) FROM pagamentos_receber pr 
         JOIN reports r ON pr.relatorio_id = r.id 
         WHERE pr.status = 'pago' AND r.status != 'PAGO')
    ) as pagamentos_pagos,
    
    (SELECT COUNT(*) FROM pagamentos_receber WHERE status = 'vencido') as pagamentos_vencidos,
    (SELECT COUNT(*) FROM pagamentos_receber WHERE prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status = 'aguardando') as pagamentos_proximo_vencimento,
    
    -- Valores (CORRIGIDO)
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'aguardando') as valor_aguardando,
    
    -- Valores pagos: somar TODOS os valores de relatórios PAGO + pagamentos pago
    (
        -- Somar valores de relatórios PAGO
        (SELECT COALESCE(SUM(total_value), 0) FROM reports WHERE status = 'PAGO') +
        -- Somar valores de pagamentos pago que não são de relatórios PAGO (para evitar duplicação)
        (SELECT COALESCE(SUM(pr.valor_total), 0) FROM pagamentos_receber pr 
         JOIN reports r ON pr.relatorio_id = r.id 
         WHERE pr.status = 'pago' AND r.status != 'PAGO')
    ) as valor_pago,
    
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'vencido') as valor_vencido,
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status = 'aguardando') as valor_proximo_vencimento,
    
    -- Faturamento (CORRIGIDO)
    (
        -- Faturamento hoje: relatórios PAGO hoje + pagamentos pago hoje (não PAGO)
        (SELECT COALESCE(SUM(total_value), 0) FROM reports 
         WHERE status = 'PAGO' AND DATE_TRUNC('day', updated_at) = CURRENT_DATE) +
        (SELECT COALESCE(SUM(pr.valor_total), 0) FROM pagamentos_receber pr 
         JOIN reports r ON pr.relatorio_id = r.id
         WHERE pr.status = 'pago' AND r.status != 'PAGO' 
         AND DATE_TRUNC('day', pr.updated_at) = CURRENT_DATE)
    ) as faturamento_hoje,
    
    (
        -- Faturamento mês: relatórios PAGO no mês + pagamentos pago no mês (não PAGO)
        (SELECT COALESCE(SUM(total_value), 0) FROM reports 
         WHERE status = 'PAGO' AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', CURRENT_DATE)) +
        (SELECT COALESCE(SUM(pr.valor_total), 0) FROM pagamentos_receber pr 
         JOIN reports r ON pr.relatorio_id = r.id
         WHERE pr.status = 'pago' AND r.status != 'PAGO' 
         AND DATE_TRUNC('month', pr.updated_at) = DATE_TRUNC('month', CURRENT_DATE))
    ) as faturamento_mes,
    
    -- Relatórios
    (SELECT COUNT(*) FROM reports WHERE status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO')) as relatorios_pendentes,
    (SELECT COUNT(*) FROM reports WHERE status = 'PAGO') as relatorios_pagos,
    
    -- Notas Fiscais
    (SELECT COUNT(*) FROM notas_fiscais WHERE status = 'Faturada') as notas_faturadas,
    (SELECT COUNT(*) FROM notas_fiscais WHERE status = 'Paga') as notas_pagas,
    
    -- Métricas calculadas (CORRIGIDO)
    (
        -- Valor total: relatórios PAGO + pagamentos (todos)
        (SELECT COALESCE(SUM(total_value), 0) FROM reports WHERE status = 'PAGO') +
        (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber)
    ) as valor_total_pagamentos,
    
    (
        -- Total pagamentos: relatórios PAGO + pagamentos (todos)
        (SELECT COUNT(*) FROM reports WHERE status = 'PAGO') +
        (SELECT COUNT(*) FROM pagamentos_receber)
    ) as total_pagamentos,
    
    -- Timestamp da consulta
    NOW() as consultado_em;

-- 2. VERIFICAÇÃO DAS CORREÇÕES
SELECT '=== CORREÇÕES DEFINITIVAS APLICADAS ===' as info;

-- Testar view de KPIs
SELECT 
    'KPIs Financeiros Corrigidos (Definitivo)' as teste,
    pagamentos_pagos,
    valor_pago,
    faturamento_hoje,
    faturamento_mes,
    total_pagamentos,
    valor_total_pagamentos
FROM view_kpis_financeiros_unificados;

-- 3. TESTE DETALHADO
SELECT '=== TESTE DETALHADO ===' as info;

-- Contar relatórios PAGO
SELECT 
    'Relatórios PAGO' as fonte,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports 
WHERE status = 'PAGO';

-- Contar pagamentos pago (que não são de relatórios PAGO)
SELECT 
    'Pagamentos pago (não PAGO)' as fonte,
    COUNT(*) as quantidade,
    SUM(pr.valor_total) as valor_total
FROM pagamentos_receber pr 
JOIN reports r ON pr.relatorio_id = r.id 
WHERE pr.status = 'pago' AND r.status != 'PAGO';

-- 4. COMENTÁRIOS EXPLICATIVOS
COMMENT ON VIEW view_kpis_financeiros_unificados IS 'View corrigida definitiva - conta TODOS os relatórios PAGO + pagamentos pago';

SELECT '=== PROBLEMA DOS KPIs RESOLVIDO DEFINITIVAMENTE ===' as info;
SELECT 'Agora os KPIs contam corretamente TODOS os relatórios PAGO' as resultado;
