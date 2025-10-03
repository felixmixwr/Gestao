-- =============================================
-- CRIAR VIEW PARA FATURAMENTO BRUTO
-- =============================================
-- Esta view consolida todo o faturamento bruto dos relatórios PAGO

-- 1. CRIAR VIEW PARA FATURAMENTO BRUTO
CREATE OR REPLACE VIEW view_faturamento_bruto AS
SELECT 
    -- Dados do relatório
    r.id as relatorio_id,
    r.report_number,
    r.date as data_relatorio,
    r.total_value as valor_relatorio,
    r.status as status_relatorio,
    r.realized_volume,
    
    -- Dados do cliente
    c.id as cliente_id,
    c.name as cliente_nome,
    c.email as cliente_email,
    c.phone as cliente_telefone,
    
    -- Dados da empresa do cliente
    comp.id as empresa_id,
    comp.name as empresa_nome,
    
    -- Dados da bomba
    p.id as bomba_id,
    p.prefix as bomba_prefix,
    p.model as bomba_model,
    p.brand as bomba_brand,
    
    -- Dados do motorista e assistentes
    r.driver_name,
    r.assistant1_name,
    r.assistant2_name,
    
    -- Dados do trabalho
    r.client_rep_name,
    r.whatsapp_digits,
    r.work_address,
    
    -- Dados de pagamento (se existir)
    pr.id as pagamento_id,
    pr.forma_pagamento,
    pr.prazo_data,
    pr.prazo_dias,
    pr.status as status_pagamento,
    pr.created_at as pagamento_created_at,
    
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
    
    CASE 
        WHEN r.status = 'PAGO' THEN true
        ELSE false
    END as foi_faturado,
    
    -- Timestamps
    r.created_at as relatorio_created_at,
    r.updated_at as relatorio_updated_at

FROM reports r
LEFT JOIN clients c ON r.client_id = c.id
LEFT JOIN companies comp ON c.company_id = comp.id
LEFT JOIN pumps p ON r.pump_id = p.id
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
LEFT JOIN notas_fiscais nf ON r.id = nf.relatorio_id
WHERE r.status = 'PAGO'  -- Apenas relatórios pagos
ORDER BY r.date DESC, r.created_at DESC;

-- 2. CRIAR VIEW PARA ESTATÍSTICAS DE FATURAMENTO
CREATE OR REPLACE VIEW view_estatisticas_faturamento AS
SELECT 
    -- Totais gerais
    COUNT(*) as total_relatorios_pagos,
    SUM(valor_relatorio) as total_faturado,
    AVG(valor_relatorio) as valor_medio_por_relatorio,
    
    -- Totais por período (mês atual)
    COUNT(CASE WHEN DATE_TRUNC('month', data_relatorio) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as relatorios_mes_atual,
    SUM(CASE WHEN DATE_TRUNC('month', data_relatorio) = DATE_TRUNC('month', CURRENT_DATE) THEN valor_relatorio ELSE 0 END) as faturado_mes_atual,
    
    -- Totais por período (dia atual)
    COUNT(CASE WHEN DATE(data_relatorio) = CURRENT_DATE THEN 1 END) as relatorios_hoje,
    SUM(CASE WHEN DATE(data_relatorio) = CURRENT_DATE THEN valor_relatorio ELSE 0 END) as faturado_hoje,
    
    -- Totais por empresa
    COUNT(DISTINCT empresa_id) as empresas_ativas,
    
    -- Totais por bomba
    COUNT(DISTINCT bomba_id) as bombas_ativas,
    
    -- Volume total bombeado (soma de todos os m³ realizados)
    COALESCE(SUM(realized_volume), 0) as volume_total_bombeado

FROM view_faturamento_bruto;

-- 3. CRIAR VIEW PARA FATURAMENTO POR PERÍODO
CREATE OR REPLACE VIEW view_faturamento_por_periodo AS
SELECT 
    DATE_TRUNC('month', data_relatorio) as periodo,
    COUNT(*) as quantidade_relatorios,
    SUM(valor_relatorio) as total_faturado,
    AVG(valor_relatorio) as valor_medio,
    COALESCE(SUM(realized_volume), 0) as volume_total
FROM view_faturamento_bruto
GROUP BY DATE_TRUNC('month', data_relatorio)
ORDER BY periodo DESC;

-- 4. CRIAR VIEW PARA FATURAMENTO POR EMPRESA
CREATE OR REPLACE VIEW view_faturamento_por_empresa AS
SELECT 
    empresa_id,
    empresa_nome,
    COUNT(*) as quantidade_relatorios,
    SUM(valor_relatorio) as total_faturado,
    AVG(valor_relatorio) as valor_medio,
    COALESCE(SUM(realized_volume), 0) as volume_total,
    MIN(data_relatorio) as primeiro_relatorio,
    MAX(data_relatorio) as ultimo_relatorio
FROM view_faturamento_bruto
GROUP BY empresa_id, empresa_nome
ORDER BY total_faturado DESC;

-- 5. CRIAR VIEW PARA FATURAMENTO POR BOMBA
CREATE OR REPLACE VIEW view_faturamento_por_bomba AS
SELECT 
    bomba_id,
    bomba_prefix,
    bomba_model,
    bomba_brand,
    COUNT(*) as quantidade_relatorios,
    SUM(valor_relatorio) as total_faturado,
    AVG(valor_relatorio) as valor_medio,
    COALESCE(SUM(realized_volume), 0) as volume_total,
    MIN(data_relatorio) as primeiro_relatorio,
    MAX(data_relatorio) as ultimo_relatorio
FROM view_faturamento_bruto
GROUP BY bomba_id, bomba_prefix, bomba_model, bomba_brand
ORDER BY total_faturado DESC;

-- 6. TESTAR AS VIEWS CRIADAS
SELECT '=== TESTANDO VIEWS DE FATURAMENTO ===' as info;

-- Testar view principal
SELECT 
    'Total de registros na view_faturamento_bruto' as metric,
    COUNT(*) as valor
FROM view_faturamento_bruto;

-- Testar estatísticas
SELECT 
    'Total faturado' as metric,
    total_faturado as valor
FROM view_estatisticas_faturamento;

SELECT 
    'Total relatórios pagos' as metric,
    total_relatorios_pagos as valor
FROM view_estatisticas_faturamento;

SELECT 
    'Faturado hoje' as metric,
    faturado_hoje as valor
FROM view_estatisticas_faturamento;

SELECT 
    'Faturado mês atual' as metric,
    faturado_mes_atual as valor
FROM view_estatisticas_faturamento;

-- Testar faturamento por período
SELECT 
    'Períodos com faturamento' as metric,
    COUNT(*) as valor
FROM view_faturamento_por_periodo;

-- Testar faturamento por empresa
SELECT 
    'Empresas com faturamento' as metric,
    COUNT(*) as valor
FROM view_faturamento_por_empresa;

-- Testar faturamento por bomba
SELECT 
    'Bombas com faturamento' as metric,
    COUNT(*) as valor
FROM view_faturamento_por_bomba;

-- 7. MOSTRAR AMOSTRA DOS DADOS
SELECT '=== AMOSTRA DOS DADOS DE FATURAMENTO ===' as info;

SELECT 
    report_number,
    data_relatorio,
    cliente_nome,
    empresa_nome,
    bomba_prefix,
    valor_relatorio,
    status_relatorio,
    foi_faturado
FROM view_faturamento_bruto
LIMIT 10;

SELECT '=== VIEWS DE FATURAMENTO CRIADAS COM SUCESSO ===' as info;
