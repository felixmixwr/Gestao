-- =============================================
-- CORREÇÃO FINAL DOS KPIs - BASEADO NO DIAGNÓSTICO
-- =============================================
-- Este script corrige os KPIs baseado no diagnóstico dos dados

-- 1. CORRIGIR VIEW DE KPIS UNIFICADOS (VERSÃO FINAL)
CREATE OR REPLACE VIEW view_kpis_financeiros_unificados AS
SELECT
    -- KPIs de Pagamentos (CORRIGIDO)
    (SELECT COUNT(*) FROM pagamentos_receber WHERE status = 'aguardando') as pagamentos_aguardando,
    
    -- Pagamentos pagos: contar tanto pagamentos pago quanto relatórios PAGO
    (
        (SELECT COUNT(*) FROM pagamentos_receber WHERE status = 'pago') +
        (SELECT COUNT(*) FROM reports r 
         WHERE r.status = 'PAGO' 
         AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id AND pr.status = 'pago'))
    ) as pagamentos_pagos,
    
    (SELECT COUNT(*) FROM pagamentos_receber WHERE status = 'vencido') as pagamentos_vencidos,
    (SELECT COUNT(*) FROM pagamentos_receber WHERE prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status = 'aguardando') as pagamentos_proximo_vencimento,
    
    -- Valores (CORRIGIDO)
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'aguardando') as valor_aguardando,
    
    -- Valores pagos: somar tanto pagamentos pago quanto relatórios PAGO
    (
        (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'pago') +
        (SELECT COALESCE(SUM(total_value), 0) FROM reports r 
         WHERE r.status = 'PAGO' 
         AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id AND pr.status = 'pago'))
    ) as valor_pago,
    
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'vencido') as valor_vencido,
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status = 'aguardando') as valor_proximo_vencimento,
    
    -- Faturamento (CORRIGIDO)
    (
        (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber 
         WHERE status = 'pago' AND DATE_TRUNC('day', updated_at) = CURRENT_DATE) +
        (SELECT COALESCE(SUM(total_value), 0) FROM reports r 
         WHERE r.status = 'PAGO' 
         AND DATE_TRUNC('day', r.updated_at) = CURRENT_DATE
         AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id AND pr.status = 'pago'))
    ) as faturamento_hoje,
    
    (
        (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber 
         WHERE status = 'pago' AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', CURRENT_DATE)) +
        (SELECT COALESCE(SUM(total_value), 0) FROM reports r 
         WHERE r.status = 'PAGO' 
         AND DATE_TRUNC('month', r.updated_at) = DATE_TRUNC('month', CURRENT_DATE)
         AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id AND pr.status = 'pago'))
    ) as faturamento_mes,
    
    -- Relatórios
    (SELECT COUNT(*) FROM reports WHERE status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO')) as relatorios_pendentes,
    (SELECT COUNT(*) FROM reports WHERE status = 'PAGO') as relatorios_pagos,
    
    -- Notas Fiscais
    (SELECT COUNT(*) FROM notas_fiscais WHERE status = 'Faturada') as notas_faturadas,
    (SELECT COUNT(*) FROM notas_fiscais WHERE status = 'Paga') as notas_pagas,
    
    -- Métricas calculadas (CORRIGIDO)
    (
        (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber) +
        (SELECT COALESCE(SUM(total_value), 0) FROM reports r 
         WHERE r.status = 'PAGO' 
         AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id AND pr.status = 'pago'))
    ) as valor_total_pagamentos,
    
    (
        (SELECT COUNT(*) FROM pagamentos_receber) +
        (SELECT COUNT(*) FROM reports r 
         WHERE r.status = 'PAGO' 
         AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id AND pr.status = 'pago'))
    ) as total_pagamentos,
    
    -- Timestamp da consulta
    NOW() as consultado_em;

-- 2. VERIFICAÇÃO DAS CORREÇÕES
SELECT '=== CORREÇÕES FINAIS APLICADAS ===' as info;

-- Testar view de KPIs
SELECT 
    'KPIs Financeiros Corrigidos (Final)' as teste,
    pagamentos_pagos,
    valor_pago,
    faturamento_hoje,
    faturamento_mes,
    total_pagamentos,
    valor_total_pagamentos
FROM view_kpis_financeiros_unificados;

-- 3. TESTE DETALHADO
SELECT '=== TESTE DETALHADO ===' as info;

-- Contar pagamentos pago na tabela
SELECT 
    'Pagamentos pago na tabela pagamentos_receber' as fonte,
    COUNT(*) as quantidade,
    SUM(valor_total) as valor_total
FROM pagamentos_receber 
WHERE status = 'pago';

-- Contar relatórios PAGO sem pagamento pago
SELECT 
    'Relatórios PAGO sem pagamento pago' as fonte,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports r 
WHERE r.status = 'PAGO' 
AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id AND pr.status = 'pago');

-- 4. COMENTÁRIOS EXPLICATIVOS
COMMENT ON VIEW view_kpis_financeiros_unificados IS 'View corrigida final - conta pagamentos pago + relatórios PAGO sem pagamento pago';

SELECT '=== PROBLEMA DOS KPIs CORRIGIDO (VERSÃO FINAL) ===' as info;
SELECT 'Agora os KPIs devem mostrar corretamente TODOS os pagamentos pagos' as resultado;
