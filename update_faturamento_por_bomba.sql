-- Script para melhorar a separação de faturamento por bomba
-- Execute este script no Supabase SQL Editor

-- 1. Atualizar a view de faturamento bruto para incluir melhor agrupamento por bomba
CREATE OR REPLACE VIEW view_faturamento_bruto_por_bomba AS
SELECT 
    -- Dados da bomba
    p.id as bomba_id,
    p.prefix as bomba_prefix,
    p.model as bomba_model,
    p.brand as bomba_brand,
    p.company_id as bomba_company_id,
    
    -- Estatísticas por bomba
    COUNT(r.id) as total_relatorios_pagos,
    SUM(r.total_value) as total_faturado,
    AVG(r.total_value) as valor_medio_por_relatorio,
    COALESCE(SUM(r.realized_volume), 0) as volume_total_bombeado,
    
    -- Estatísticas por período
    COUNT(CASE WHEN DATE(r.date) = CURRENT_DATE THEN 1 END) as relatorios_hoje,
    SUM(CASE WHEN DATE(r.date) = CURRENT_DATE THEN r.total_value ELSE 0 END) as faturado_hoje,
    
    COUNT(CASE WHEN DATE_TRUNC('month', r.date) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as relatorios_mes_atual,
    SUM(CASE WHEN DATE_TRUNC('month', r.date) = DATE_TRUNC('month', CURRENT_DATE) THEN r.total_value ELSE 0 END) as faturado_mes_atual,
    
    COUNT(CASE WHEN DATE_TRUNC('week', r.date) = DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as relatorios_semana_atual,
    SUM(CASE WHEN DATE_TRUNC('week', r.date) = DATE_TRUNC('week', CURRENT_DATE) THEN r.total_value ELSE 0 END) as faturado_semana_atual,
    
    -- Datas de referência
    MIN(r.date) as primeiro_relatorio,
    MAX(r.date) as ultimo_relatorio,
    
    -- Dados da empresa proprietária da bomba
    comp.name as empresa_proprietaria,
    
    -- Clientes únicos atendidos
    COUNT(DISTINCT r.client_id) as clientes_unicos

FROM reports r
INNER JOIN pumps p ON r.pump_id = p.id
LEFT JOIN companies comp ON p.company_id = comp.id
WHERE r.status = 'PAGO'  -- Apenas relatórios pagos
  AND r.total_value IS NOT NULL
  AND r.total_value > 0
GROUP BY 
    p.id, p.prefix, p.model, p.brand, p.company_id, comp.name
ORDER BY total_faturado DESC;

-- 2. Criar view para faturamento detalhado por bomba (relatórios individuais)
CREATE OR REPLACE VIEW view_faturamento_detalhado_por_bomba AS
SELECT 
    -- Dados do relatório
    r.id as relatorio_id,
    r.report_number,
    r.date as data_relatorio,
    r.total_value as valor_relatorio,
    r.status as status_relatorio,
    r.realized_volume,
    
    -- Dados da bomba
    p.id as bomba_id,
    p.prefix as bomba_prefix,
    p.model as bomba_model,
    p.brand as bomba_brand,
    
    -- Dados do cliente
    c.id as cliente_id,
    c.name as cliente_nome,
    c.email as cliente_email,
    c.phone as cliente_telefone,
    
    -- Dados da empresa do cliente
    comp.id as empresa_id,
    comp.name as empresa_nome,
    
    -- Dados de pagamento (se existir)
    pr.id as pagamento_id,
    pr.forma_pagamento,
    pr.prazo_data,
    pr.prazo_dias,
    pr.status as status_pagamento,
    
    -- Dados da nota fiscal (se existir)
    nf.id as nota_fiscal_id,
    nf.numero_nota,
    nf.data_emissao as nf_data_emissao,
    nf.data_vencimento as nf_data_vencimento,
    nf.valor as nf_valor,
    nf.status as nf_status,
    
    -- Campos calculados
    CASE 
        WHEN r.status = 'PAGO' THEN r.total_value
        ELSE 0
    END as valor_faturado,
    
    -- Timestamps
    r.created_at as relatorio_created_at,
    r.updated_at as relatorio_updated_at

FROM reports r
LEFT JOIN pumps p ON r.pump_id = p.id
LEFT JOIN clients c ON r.client_id = c.id
LEFT JOIN companies comp ON c.company_id = comp.id
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
LEFT JOIN notas_fiscais nf ON r.id = nf.relatorio_id
WHERE r.status = 'PAGO'  -- Apenas relatórios pagos
  AND r.total_value IS NOT NULL
  AND r.total_value > 0
ORDER BY r.date DESC, p.prefix, r.created_at DESC;

-- 3. Criar view para resumo executivo por bomba
CREATE OR REPLACE VIEW view_resumo_executivo_bombas AS
SELECT 
    bomba_prefix,
    bomba_model,
    bomba_brand,
    empresa_proprietaria,
    total_relatorios_pagos,
    total_faturado,
    valor_medio_por_relatorio,
    volume_total_bombeado,
    relatorios_hoje,
    faturado_hoje,
    relatorios_mes_atual,
    faturado_mes_atual,
    relatorios_semana_atual,
    faturado_semana_atual,
    clientes_unicos,
    primeiro_relatorio,
    ultimo_relatorio,
    
    -- Campos calculados adicionais
    CASE 
        WHEN total_relatorios_pagos > 0 THEN 
            ROUND((faturado_hoje::numeric / total_faturado::numeric) * 100, 2)
        ELSE 0 
    END as percentual_faturado_hoje,
    
    CASE 
        WHEN total_relatorios_pagos > 0 THEN 
            ROUND((faturado_mes_atual::numeric / total_faturado::numeric) * 100, 2)
        ELSE 0 
    END as percentual_faturado_mes,
    
    -- Classificação de performance
    CASE 
        WHEN total_faturado >= 100000 THEN 'Alta Performance'
        WHEN total_faturado >= 50000 THEN 'Performance Média'
        WHEN total_faturado >= 10000 THEN 'Performance Baixa'
        ELSE 'Performance Muito Baixa'
    END as classificacao_performance,
    
    -- Status de atividade
    CASE 
        WHEN faturado_hoje > 0 THEN 'Ativa Hoje'
        WHEN faturado_semana_atual > 0 THEN 'Ativa Esta Semana'
        WHEN faturado_mes_atual > 0 THEN 'Ativa Este Mês'
        ELSE 'Inativa Recente'
    END as status_atividade

FROM view_faturamento_bruto_por_bomba
ORDER BY total_faturado DESC;

-- 4. Testar as novas views
SELECT '=== TESTANDO NOVAS VIEWS DE FATURAMENTO POR BOMBA ===' as info;

-- Testar view resumo por bomba
SELECT 
    'Total de bombas com faturamento' as metric,
    COUNT(*) as valor
FROM view_faturamento_bruto_por_bomba;

-- Testar resumo executivo
SELECT 
    bomba_prefix,
    total_faturado,
    total_relatorios_pagos,
    faturado_hoje,
    classificacao_performance,
    status_atividade
FROM view_resumo_executivo_bombas
LIMIT 10;

-- Testar detalhado por bomba
SELECT 
    'Total de relatórios detalhados' as metric,
    COUNT(*) as valor
FROM view_faturamento_detalhado_por_bomba;

-- 5. Mostrar estatísticas gerais
SELECT '=== ESTATÍSTICAS GERAIS POR BOMBA ===' as info;

SELECT 
    bomba_prefix,
    empresa_proprietaria,
    total_faturado,
    total_relatorios_pagos,
    volume_total_bombeado,
    faturado_hoje,
    clientes_unicos,
    classificacao_performance
FROM view_resumo_executivo_bombas
ORDER BY total_faturado DESC;

SELECT '=== VIEWS DE FATURAMENTO POR BOMBA CRIADAS COM SUCESSO ===' as info;

