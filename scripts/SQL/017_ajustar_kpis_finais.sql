-- =============================================
-- AJUSTE FINAL DOS KPIs - CONFORME SOLICITAÇÃO
-- =============================================
-- Este script ajusta os KPIs conforme as especificações do usuário

-- 1. CORRIGIR VIEW DE KPIS UNIFICADOS (VERSÃO FINAL AJUSTADA)
CREATE OR REPLACE VIEW view_kpis_financeiros_unificados AS
SELECT
    -- KPIs de Pagamentos (AJUSTADOS)
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
    
    -- Valores (AJUSTADOS)
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
    
    -- Faturamento (MANTIDO)
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
    
    -- Relatórios (AJUSTADOS)
    -- "Aguardando" = TODOS com status "AGUARDANDO_PAGAMENTO"
    (SELECT COUNT(*) FROM reports WHERE status = 'AGUARDANDO_PAGAMENTO') as relatorios_aguardando_pagamento,
    
    -- "Relatórios Pendentes" = quantidade de relatórios que NÃO estão como PAGO ou AGUARDANDO_PAGAMENTO
    (SELECT COUNT(*) FROM reports WHERE status NOT IN ('PAGO', 'AGUARDANDO_PAGAMENTO')) as relatorios_pendentes,
    
    -- Relatórios PAGO (mantido)
    (SELECT COUNT(*) FROM reports WHERE status = 'PAGO') as relatorios_pagos,
    
    -- Notas Fiscais (MANTIDO)
    (SELECT COUNT(*) FROM notas_fiscais WHERE status = 'Faturada') as notas_faturadas,
    (SELECT COUNT(*) FROM notas_fiscais WHERE status = 'Paga') as notas_pagas,
    
    -- Métricas calculadas (AJUSTADAS)
    -- "Total de bombeamentos feitos" = quantidade de TODOS os relatórios
    (SELECT COUNT(*) FROM reports) as total_bombeamentos_feitos,
    
    -- Valor total de TODOS os relatórios
    (SELECT COALESCE(SUM(total_value), 0) FROM reports) as valor_total_bombeamentos,
    
    -- Métricas antigas (mantidas para compatibilidade)
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
SELECT '=== KPIs AJUSTADOS CONFORME SOLICITAÇÃO ===' as info;

-- Testar view de KPIs
SELECT 
    'KPIs Ajustados' as teste,
    total_bombeamentos_feitos,
    valor_total_bombeamentos,
    relatorios_aguardando_pagamento,
    relatorios_pendentes,
    relatorios_pagos,
    pagamentos_pagos,
    valor_pago
FROM view_kpis_financeiros_unificados;

-- 3. TESTE DETALHADO DOS NOVOS KPIs
SELECT '=== TESTE DETALHADO DOS NOVOS KPIs ===' as info;

-- Total de bombeamentos feitos
SELECT 
    'Total de bombeamentos feitos' as kpi,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports;

-- Aguardando pagamento
SELECT 
    'Relatórios aguardando pagamento' as kpi,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports 
WHERE status = 'AGUARDANDO_PAGAMENTO';

-- Relatórios pendentes (não PAGO e não AGUARDANDO_PAGAMENTO)
SELECT 
    'Relatórios pendentes' as kpi,
    COUNT(*) as quantidade,
    SUM(total_value) as valor_total
FROM reports 
WHERE status NOT IN ('PAGO', 'AGUARDANDO_PAGAMENTO');

-- Mostrar quais status existem
SELECT 
    'Status existentes na tabela reports' as info,
    status,
    COUNT(*) as quantidade
FROM reports
GROUP BY status
ORDER BY status;

-- 4. COMENTÁRIOS EXPLICATIVOS
COMMENT ON VIEW view_kpis_financeiros_unificados IS 'View ajustada com KPIs conforme especificação: Total bombeamentos, Aguardando pagamento, Relatórios pendentes';

SELECT '=== KPIs AJUSTADOS COM SUCESSO ===' as info;
SELECT 'Agora os KPIs estão conforme sua especificação' as resultado;
