-- =============================================
-- COMPLETAR ESTRUTURA FALTANTE
-- =============================================
-- Este script cria as views e funções que estão faltando

-- 1. CRIAR VIEW DE FATURAMENTO BRUTO INTEGRADO
CREATE OR REPLACE VIEW view_faturamento_bruto_integrado AS
SELECT
    -- Agregações por período
    DATE_TRUNC('day', pr.updated_at) as data_pagamento,
    DATE_TRUNC('month', pr.updated_at) as mes_pagamento,
    DATE_TRUNC('year', pr.updated_at) as ano_pagamento,
    
    -- Dados agregados
    COUNT(*) as total_pagamentos_pagos,
    SUM(pr.valor_total) as valor_total_pago,
    AVG(pr.valor_total) as valor_medio_pago,
    
    -- Dados por empresa
    pr.empresa_tipo,
    CASE 
        WHEN pr.empresa_tipo = 'interna' THEN co.name
        WHEN pr.empresa_tipo = 'terceira' THEN et.nome_fantasia
        ELSE 'Não informado'
    END AS empresa_nome,
    
    -- Dados por cliente
    COUNT(DISTINCT pr.cliente_id) as clientes_unicos,
    
    -- Métricas de performance
    COUNT(CASE WHEN r.realized_volume > 0 THEN 1 END) as pagamentos_com_volume,
    AVG(CASE WHEN r.realized_volume > 0 THEN r.realized_volume END) as volume_medio_bombeado

FROM pagamentos_receber pr
JOIN reports r ON pr.relatorio_id = r.id
LEFT JOIN companies co ON pr.empresa_id = co.id AND pr.empresa_tipo = 'interna'
LEFT JOIN empresas_terceiras et ON pr.empresa_id = et.id AND pr.empresa_tipo = 'terceira'
WHERE pr.status = 'pago'
GROUP BY 
    DATE_TRUNC('day', pr.updated_at),
    DATE_TRUNC('month', pr.updated_at),
    DATE_TRUNC('year', pr.updated_at),
    pr.empresa_tipo,
    co.name,
    et.nome_fantasia;

-- 2. CRIAR VIEW DE KPIS UNIFICADOS
CREATE OR REPLACE VIEW view_kpis_financeiros_unificados AS
SELECT
    -- KPIs de Pagamentos
    (SELECT COUNT(*) FROM pagamentos_receber WHERE status = 'aguardando') as pagamentos_aguardando,
    (SELECT COUNT(*) FROM pagamentos_receber WHERE status = 'pago') as pagamentos_pagos,
    (SELECT COUNT(*) FROM pagamentos_receber WHERE status = 'vencido') as pagamentos_vencidos,
    (SELECT COUNT(*) FROM pagamentos_receber WHERE prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status = 'aguardando') as pagamentos_proximo_vencimento,
    
    -- Valores
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'aguardando') as valor_aguardando,
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'pago') as valor_pago,
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'vencido') as valor_vencido,
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status = 'aguardando') as valor_proximo_vencimento,
    
    -- Faturamento
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'pago' AND DATE_TRUNC('day', updated_at) = CURRENT_DATE) as faturamento_hoje,
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'pago' AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', CURRENT_DATE)) as faturamento_mes,
    
    -- Relatórios
    (SELECT COUNT(*) FROM reports WHERE status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO')) as relatorios_pendentes,
    (SELECT COUNT(*) FROM reports WHERE status = 'PAGO') as relatorios_pagos,
    
    -- Notas Fiscais
    (SELECT COUNT(*) FROM notas_fiscais WHERE status = 'Faturada') as notas_faturadas,
    (SELECT COUNT(*) FROM notas_fiscais WHERE status = 'Paga') as notas_pagas,
    
    -- Métricas calculadas
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber) as valor_total_pagamentos,
    (SELECT COUNT(*) FROM pagamentos_receber) as total_pagamentos,
    
    -- Timestamp da consulta
    NOW() as consultado_em;

-- 3. VERIFICAÇÃO DAS VIEWS CRIADAS
SELECT '=== VIEWS CRIADAS COM SUCESSO ===' as info;

SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'view_pagamentos_receber_integrado',
    'view_faturamento_bruto_integrado',
    'view_kpis_financeiros_unificados'
)
ORDER BY table_name;

-- 4. TESTE DAS VIEWS
SELECT '=== TESTE DAS VIEWS ===' as info;

-- Testar view de KPIs
SELECT 
    'KPIs Financeiros' as teste,
    total_pagamentos,
    valor_total_pagamentos,
    faturamento_hoje,
    faturamento_mes
FROM view_kpis_financeiros_unificados;

-- Testar view de pagamentos integrados (apenas contagem)
SELECT 
    'Pagamentos Integrados' as teste,
    COUNT(*) as total_registros
FROM view_pagamentos_receber_integrado;

-- Testar view de faturamento (apenas contagem)
SELECT 
    'Faturamento Bruto' as teste,
    COUNT(*) as total_registros
FROM view_faturamento_bruto_integrado;

-- 5. COMENTÁRIOS EXPLICATIVOS
COMMENT ON VIEW view_faturamento_bruto_integrado IS 'View para cálculo de faturamento bruto baseado em pagamentos realizados';
COMMENT ON VIEW view_kpis_financeiros_unificados IS 'View com KPIs unificados de todos os módulos financeiros';

SELECT '=== ESTRUTURA COMPLETADA COM SUCESSO ===' as info;
SELECT 'Agora você pode acessar a página de Pagamentos a receber' as proximo_passo;
