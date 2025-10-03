-- =============================================
-- CORRIGIR VIEW INTEGRADA PARA USAR DADOS DE BOMBA DA TABELA REPORTS
-- =============================================

-- 1. Primeiro, vamos verificar se a coluna pump_prefix existe na tabela reports
SELECT '=== VERIFICANDO COLUNAS DA TABELA REPORTS ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se existem dados na coluna pump_prefix
SELECT '=== VERIFICANDO DADOS DE PUMP_PREFIX ===' as info;
SELECT 
    COUNT(*) as total_registros,
    COUNT(pump_prefix) as registros_com_pump_prefix,
    COUNT(*) - COUNT(pump_prefix) as registros_sem_pump_prefix
FROM reports;

-- 3. Ver alguns exemplos de pump_prefix
SELECT '=== EXEMPLOS DE PUMP_PREFIX ===' as info;
SELECT 
    id,
    report_number,
    pump_prefix,
    date,
    total_value
FROM reports 
WHERE pump_prefix IS NOT NULL
LIMIT 10;

-- 4. Recriar a view integrada corrigida
DROP VIEW IF EXISTS view_pagamentos_receber_integrado;

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
    
    -- Dados da bomba (CORRIGIDO: usando diretamente da tabela reports)
    r.pump_prefix AS bomba_prefix,
    NULL AS bomba_model,  -- Se não existir na tabela reports, deixar NULL
    NULL AS bomba_brand,  -- Se não existir na tabela reports, deixar NULL
    
    -- Dados da nota fiscal (se existir)
    nf.id AS nota_fiscal_id,
    nf.numero_nota,
    nf.data_emissao AS nf_data_emissao,
    nf.data_vencimento AS nf_data_vencimento,
    nf.valor AS nf_valor,
    nf.status AS nf_status,
    nf.anexo_url AS nf_anexo_url,
    
    -- Campos calculados
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
    
    -- Dias até vencimento
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
LEFT JOIN notas_fiscais nf ON r.id = nf.relatorio_id;

-- 5. Testar a view corrigida
SELECT '=== TESTANDO VIEW CORRIGIDA ===' as info;
SELECT 
    COUNT(*) as total_registros,
    COUNT(bomba_prefix) as registros_com_bomba_prefix,
    COUNT(*) - COUNT(bomba_prefix) as registros_sem_bomba_prefix
FROM view_pagamentos_receber_integrado;

-- 6. Ver alguns exemplos da view corrigida
SELECT '=== EXEMPLOS DA VIEW CORRIGIDA ===' as info;
SELECT 
    id,
    report_number,
    bomba_prefix,
    cliente_nome,
    empresa_nome,
    status_unificado
FROM view_pagamentos_receber_integrado
WHERE bomba_prefix IS NOT NULL
LIMIT 10;

-- 7. Verificar se agora temos dados de bomba
SELECT '=== BOMBAS ÚNICAS DISPONÍVEIS ===' as info;
SELECT DISTINCT bomba_prefix
FROM view_pagamentos_receber_integrado
WHERE bomba_prefix IS NOT NULL
ORDER BY bomba_prefix;
