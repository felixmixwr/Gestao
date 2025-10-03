-- =============================================
-- CORREÇÃO SIMPLES DOS KPIs - SEM UNION ALL
-- =============================================
-- Este script corrige os KPIs de forma mais simples, sem usar UNION ALL

-- 1. CORRIGIR VIEW DE KPIS UNIFICADOS (VERSÃO SIMPLES)
CREATE OR REPLACE VIEW view_kpis_financeiros_unificados AS
SELECT
    -- KPIs de Pagamentos (CORRIGIDO)
    (SELECT COUNT(*) FROM pagamentos_receber WHERE status = 'aguardando') as pagamentos_aguardando,
    (
        -- Contar pagamentos pagos: da tabela pagamentos_receber + relatórios PAGO sem pagamento
        (SELECT COUNT(*) FROM pagamentos_receber WHERE status = 'pago') +
        (SELECT COUNT(*) FROM reports r 
         WHERE r.status = 'PAGO' 
         AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id))
    ) as pagamentos_pagos,
    (SELECT COUNT(*) FROM pagamentos_receber WHERE status = 'vencido') as pagamentos_vencidos,
    (SELECT COUNT(*) FROM pagamentos_receber WHERE prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status = 'aguardando') as pagamentos_proximo_vencimento,
    
    -- Valores (CORRIGIDO)
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'aguardando') as valor_aguardando,
    (
        -- Somar valores pagos: da tabela pagamentos_receber + relatórios PAGO sem pagamento
        (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'pago') +
        (SELECT COALESCE(SUM(total_value), 0) FROM reports r 
         WHERE r.status = 'PAGO' 
         AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id))
    ) as valor_pago,
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'vencido') as valor_vencido,
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status = 'aguardando') as valor_proximo_vencimento,
    
    -- Faturamento (CORRIGIDO)
    (
        -- Faturamento hoje: pagamentos pagos hoje + relatórios PAGO hoje sem pagamento
        (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber 
         WHERE status = 'pago' AND DATE_TRUNC('day', updated_at) = CURRENT_DATE) +
        (SELECT COALESCE(SUM(total_value), 0) FROM reports r 
         WHERE r.status = 'PAGO' 
         AND DATE_TRUNC('day', r.updated_at) = CURRENT_DATE
         AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id))
    ) as faturamento_hoje,
    (
        -- Faturamento mês: pagamentos pagos no mês + relatórios PAGO no mês sem pagamento
        (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber 
         WHERE status = 'pago' AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', CURRENT_DATE)) +
        (SELECT COALESCE(SUM(total_value), 0) FROM reports r 
         WHERE r.status = 'PAGO' 
         AND DATE_TRUNC('month', r.updated_at) = DATE_TRUNC('month', CURRENT_DATE)
         AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id))
    ) as faturamento_mes,
    
    -- Relatórios
    (SELECT COUNT(*) FROM reports WHERE status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO')) as relatorios_pendentes,
    (SELECT COUNT(*) FROM reports WHERE status = 'PAGO') as relatorios_pagos,
    
    -- Notas Fiscais
    (SELECT COUNT(*) FROM notas_fiscais WHERE status = 'Faturada') as notas_faturadas,
    (SELECT COUNT(*) FROM notas_fiscais WHERE status = 'Paga') as notas_pagas,
    
    -- Métricas calculadas (CORRIGIDO)
    (
        -- Valor total: pagamentos + relatórios PAGO sem pagamento
        (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber) +
        (SELECT COALESCE(SUM(total_value), 0) FROM reports r 
         WHERE r.status = 'PAGO' 
         AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id))
    ) as valor_total_pagamentos,
    (
        -- Total pagamentos: pagamentos + relatórios PAGO sem pagamento
        (SELECT COUNT(*) FROM pagamentos_receber) +
        (SELECT COUNT(*) FROM reports r 
         WHERE r.status = 'PAGO' 
         AND NOT EXISTS (SELECT 1 FROM pagamentos_receber pr WHERE pr.relatorio_id = r.id))
    ) as total_pagamentos,
    
    -- Timestamp da consulta
    NOW() as consultado_em;

-- 2. MANTER VIEW INTEGRADA SIMPLES (SEM UNION ALL PROBLEMÁTICO)
CREATE OR REPLACE VIEW view_pagamentos_receber_integrado AS
SELECT
    -- Dados do pagamento
    pr.id,
    pr.relatorio_id,
    pr.cliente_id,
    pr.empresa_id,
    pr.empresa_tipo,
    pr.valor_total,
    pr.forma_pagamento,
    pr.prazo_data,
    pr.prazo_dias,
    pr.status as pagamento_status,
    pr.observacoes,
    pr.created_at as pagamento_created_at,
    pr.updated_at as pagamento_updated_at,
    
    -- Dados do cliente
    c.name AS cliente_nome,
    c.email AS cliente_email,
    c.phone AS cliente_telefone,
    
    -- Dados do relatório
    r.report_number,
    r.date AS relatorio_data,
    r.total_value AS relatorio_valor,
    r.status AS relatorio_status,
    r.client_rep_name,
    r.whatsapp_digits,
    r.work_address,
    r.driver_name,
    r.assistant1_name,
    r.assistant2_name,
    r.realized_volume,
    
    -- Dados da empresa
    CASE 
        WHEN pr.empresa_tipo = 'interna' THEN co.name
        WHEN pr.empresa_tipo = 'terceira' THEN et.nome_fantasia
        ELSE NULL
    END AS empresa_nome,
    CASE 
        WHEN pr.empresa_tipo = 'interna' THEN NULL
        WHEN pr.empresa_tipo = 'terceira' THEN et.cnpj
        ELSE NULL
    END AS empresa_cnpj,
    
    -- Dados da bomba
    p.prefix AS bomba_prefix,
    p.model AS bomba_model,
    p.brand AS bomba_brand,
    
    -- Dados da nota fiscal (se existir)
    nf.id AS nota_fiscal_id,
    nf.numero_nota,
    nf.data_emissao AS nf_data_emissao,
    nf.data_vencimento AS nf_data_vencimento,
    nf.valor AS nf_valor,
    nf.status AS nf_status,
    nf.anexo_url AS nf_anexo_url,
    
    -- Campos calculados (CORRIGIDO)
    CASE 
        WHEN r.status = 'PAGO' THEN 'pago'
        WHEN r.status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO') AND pr.status = 'aguardando' THEN 'aguardando'
        WHEN r.status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO') AND pr.status = 'pago' THEN 'pago'
        WHEN pr.prazo_data < CURRENT_DATE AND pr.status = 'aguardando' THEN 'vencido'
        WHEN pr.prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND pr.status = 'aguardando' THEN 'proximo_vencimento'
        ELSE pr.status
    END AS status_unificado,
    
    -- Indicadores
    CASE WHEN nf.id IS NOT NULL THEN true ELSE false END AS tem_nota_fiscal,
    CASE WHEN r.status = 'PAGO' THEN true ELSE false END AS relatorio_pago,
    CASE WHEN pr.status = 'pago' THEN true ELSE false END AS pagamento_pago,
    
    -- Dias até vencimento (CORRIGIDO)
    CASE 
        WHEN pr.prazo_data IS NOT NULL THEN 
            (pr.prazo_data - CURRENT_DATE)
        ELSE NULL
    END AS dias_ate_vencimento

FROM pagamentos_receber pr
JOIN clients c ON pr.cliente_id = c.id
JOIN reports r ON pr.relatorio_id = r.id
LEFT JOIN companies co ON pr.empresa_id = co.id AND pr.empresa_tipo = 'interna'
LEFT JOIN empresas_terceiras et ON pr.empresa_id = et.id AND pr.empresa_tipo = 'terceira'
LEFT JOIN pumps p ON r.pump_id = p.id
LEFT JOIN notas_fiscais nf ON r.id = nf.relatorio_id;

-- 3. VERIFICAÇÃO DAS CORREÇÕES
SELECT '=== CORREÇÕES APLICADAS COM SUCESSO ===' as info;

-- Testar view de KPIs
SELECT 
    'KPIs Financeiros Corrigidos' as teste,
    pagamentos_pagos,
    valor_pago,
    faturamento_hoje,
    faturamento_mes,
    total_pagamentos,
    valor_total_pagamentos
FROM view_kpis_financeiros_unificados;

-- Testar view integrada (contagem)
SELECT 
    'Pagamentos Integrados Corrigidos' as teste,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status_unificado = 'pago' THEN 1 END) as pagamentos_pagos
FROM view_pagamentos_receber_integrado;

-- 4. COMENTÁRIOS EXPLICATIVOS
COMMENT ON VIEW view_kpis_financeiros_unificados IS 'View corrigida com KPIs unificados incluindo relatórios PAGO sem pagamento registrado';
COMMENT ON VIEW view_pagamentos_receber_integrado IS 'View simples sem UNION ALL problemático';

SELECT '=== PROBLEMA DOS KPIs CORRIGIDO (VERSÃO SIMPLES) ===' as info;
SELECT 'Agora os KPIs devem mostrar corretamente os pagamentos pagos' as resultado;
