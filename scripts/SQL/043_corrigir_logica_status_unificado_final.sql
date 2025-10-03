-- =============================================
-- CORRIGIR LÓGICA DO STATUS_UNIFICADO FINAL
-- =============================================
-- Este script corrige definitivamente a lógica do status_unificado

-- 1. VERIFICAR DADOS ATUAIS ANTES DA CORREÇÃO
SELECT '=== DADOS ATUAIS ANTES DA CORREÇÃO ===' as info;

SELECT 
    'Total de registros' as tipo,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado

UNION ALL

SELECT 
    'Registros com status_unificado = vencido' as tipo,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado
WHERE status_unificado = 'vencido'

UNION ALL

SELECT 
    'Registros com pagamento_status = proximo_vencimento' as tipo,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado
WHERE pagamento_status = 'proximo_vencimento';

-- 2. RECRIAR VIEW COM LÓGICA CORRIGIDA DEFINITIVAMENTE
SELECT '=== RECRIANDO VIEW COM LÓGICA CORRIGIDA ===' as info;

DROP VIEW IF EXISTS view_pagamentos_receber_integrado;

CREATE VIEW view_pagamentos_receber_integrado AS
SELECT 
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
    
    -- Dados do cliente (GARANTIDOS - com fallback)
    COALESCE(c.name, 'Cliente não informado') AS cliente_nome,
    c.email AS cliente_email,
    c.phone AS cliente_telefone,
    
    -- Dados da empresa (GARANTIDOS - com fallback)
    COALESCE(
        CASE 
            WHEN pr.empresa_tipo = 'interna' THEN comp.name
            WHEN pr.empresa_tipo = 'terceira' THEN et.nome_fantasia
            WHEN pr.empresa_id IS NULL THEN 'Sem empresa'
            ELSE 'Empresa não encontrada'
        END, 
        'Empresa não informada'
    ) AS empresa_nome,
    
    CASE 
        WHEN pr.empresa_tipo = 'interna' THEN NULL -- companies não possui CNPJ
        WHEN pr.empresa_tipo = 'terceira' THEN et.cnpj
        ELSE NULL
    END AS empresa_cnpj,
    
    -- Dados do relatório (com fallbacks)
    COALESCE(r.report_number, 'RELATÓRIO NÃO ENCONTRADO') as report_number,
    COALESCE(r.date, pr.created_at::date) as relatorio_data,
    COALESCE(r.total_value, pr.valor_total) as relatorio_valor,
    COALESCE(r.status, 'STATUS NÃO ENCONTRADO') as relatorio_status,
    r.client_rep_name,
    r.whatsapp_digits,
    r.work_address,
    r.driver_name,
    r.assistant1_name,
    r.assistant2_name,
    r.realized_volume,
    
    -- Dados da nota fiscal (USANDO ESTRUTURA REAL)
    nf.id as nota_fiscal_id,
    nf.numero_nota,
    nf.data_emissao as nf_data_emissao,
    nf.data_vencimento as nf_data_vencimento,
    nf.valor as nf_valor,
    nf.status as nf_status,
    nf.anexo_url as nf_anexo_url,
    CASE WHEN nf.id IS NOT NULL THEN true ELSE false END as tem_nota_fiscal,
    
    -- Status unificado CORRIGIDO DEFINITIVAMENTE
    -- PRIORIDADE: 1) Status do pagamento, 2) Status do relatório, 3) Data de vencimento
    CASE 
        -- PRIORIDADE 1: Se o pagamento está marcado como pago, sempre pago
        WHEN pr.status = 'pago' THEN 'pago'
        
        -- PRIORIDADE 2: Se o relatório está marcado como PAGO, então pago
        WHEN r.status = 'PAGO' THEN 'pago'
        
        -- PRIORIDADE 3: Se o pagamento está marcado como vencido, então vencido
        WHEN pr.status = 'vencido' THEN 'vencido'
        
        -- PRIORIDADE 4: Verificar data de vencimento apenas se não for pago
        WHEN pr.prazo_data IS NOT NULL AND pr.prazo_data <= CURRENT_DATE THEN 'vencido'
        
        -- PRIORIDADE 5: Próximo vencimento
        WHEN pr.prazo_data IS NOT NULL AND pr.prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'proximo_vencimento'
        
        -- PADRÃO: Aguardando
        ELSE 'aguardando'
    END as status_unificado,
    
    -- Dias até vencimento
    CASE 
        WHEN pr.prazo_data IS NOT NULL THEN (pr.prazo_data - CURRENT_DATE)
        ELSE NULL
    END as dias_ate_vencimento,
    
    -- Status do pagamento como booleano
    CASE WHEN pr.status = 'pago' OR r.status = 'PAGO' THEN true ELSE false END as pagamento_pago

FROM pagamentos_receber pr
LEFT JOIN reports r ON pr.relatorio_id = r.id
LEFT JOIN clients c ON pr.cliente_id = c.id
LEFT JOIN companies comp ON pr.empresa_id = comp.id AND pr.empresa_tipo = 'interna'
LEFT JOIN empresas_terceiras et ON pr.empresa_id = et.id AND pr.empresa_tipo = 'terceira'
LEFT JOIN notas_fiscais nf ON r.id = nf.relatorio_id;

-- 3. TESTAR A VIEW CORRIGIDA
SELECT '=== TESTANDO VIEW CORRIGIDA ===' as info;

SELECT 
    status_unificado,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado
GROUP BY status_unificado
ORDER BY status_unificado;

-- 4. VERIFICAR REGISTRO ESPECÍFICO DO FALCÃO BOMBAS
SELECT '=== VERIFICANDO REGISTRO FALCÃO BOMBAS ===' as info;

SELECT 
    id,
    cliente_nome,
    empresa_nome,
    valor_total,
    pagamento_status,
    status_unificado,
    relatorio_status,
    prazo_data,
    dias_ate_vencimento
FROM view_pagamentos_receber_integrado 
WHERE cliente_nome LIKE '%Falcão%' OR cliente_nome LIKE '%Falcão bombas%'
ORDER BY valor_total DESC;

-- 5. VERIFICAR INCONSISTÊNCIAS RESOLVIDAS
SELECT '=== VERIFICANDO INCONSISTÊNCIAS RESOLVIDAS ===' as info;

SELECT 
    'Registros com relatorio_status PAGO e status_unificado pago' as teste,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado
WHERE relatorio_status = 'PAGO' 
AND status_unificado = 'pago'

UNION ALL

SELECT 
    'Registros com relatorio_status PAGO mas status_unificado diferente' as teste,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado
WHERE relatorio_status = 'PAGO' 
AND status_unificado != 'pago';

-- 6. RESUMO FINAL
SELECT '=== RESUMO FINAL ===' as info;

SELECT 
    'Total de registros' as metric,
    COUNT(*) as valor
FROM view_pagamentos_receber_integrado

UNION ALL

SELECT 
    'Registros com status_unificado pago' as metric,
    COUNT(*) as valor
FROM view_pagamentos_receber_integrado
WHERE status_unificado = 'pago'

UNION ALL

SELECT 
    'Registros com relatorio_status PAGO' as metric,
    COUNT(*) as valor
FROM view_pagamentos_receber_integrado
WHERE relatorio_status = 'PAGO';

SELECT '=== LÓGICA CORRIGIDA DEFINITIVAMENTE ===' as info;
