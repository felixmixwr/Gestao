-- =============================================
-- CORRIGIR LÓGICA DO STATUS_UNIFICADO
-- =============================================
-- Este script corrige a lógica do status_unificado para priorizar status "pago"

-- 1. VERIFICAR LÓGICA ATUAL DA VIEW
SELECT '=== VERIFICANDO LÓGICA ATUAL DA VIEW ===' as info;

SELECT 
    id,
    relatorio_id,
    valor_total,
    pagamento_status,
    prazo_data,
    status_unificado,
    dias_ate_vencimento,
    CASE 
        WHEN prazo_data IS NOT NULL THEN (prazo_data - CURRENT_DATE)
        ELSE NULL
    END as dias_calculados
FROM view_pagamentos_receber_integrado 
WHERE pagamento_status = 'pago'
ORDER BY prazo_data DESC
LIMIT 10;

-- 2. VERIFICAR PROBLEMAS ESPECÍFICOS
SELECT '=== VERIFICANDO PROBLEMAS ESPECÍFICOS ===' as info;

SELECT 
    'Pagamentos com status pago mas status_unificado diferente' as problema,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado 
WHERE pagamento_status = 'pago' 
AND status_unificado != 'pago';

-- 3. MOSTRAR EXEMPLOS PROBLEMÁTICOS
SELECT '=== EXEMPLOS PROBLEMÁTICOS ===' as info;

SELECT 
    id,
    relatorio_id,
    valor_total,
    pagamento_status,
    prazo_data,
    status_unificado,
    dias_ate_vencimento
FROM view_pagamentos_receber_integrado 
WHERE pagamento_status = 'pago' 
AND status_unificado != 'pago'
ORDER BY prazo_data DESC
LIMIT 5;

-- 4. RECRIAR VIEW COM LÓGICA CORRIGIDA
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
    
    -- Dados do cliente (GARANTIDOS)
    COALESCE(c.name, 'Cliente não informado') AS cliente_nome,
    c.email AS cliente_email,
    c.phone AS cliente_telefone,
    
    -- Dados da empresa (GARANTIDOS)
    COALESCE(
        CASE 
            WHEN pr.empresa_tipo = 'interna' THEN comp.name
            WHEN pr.empresa_tipo = 'terceira' THEN et.nome_fantasia
            ELSE 'Empresa não informada'
        END, 
        'Empresa não informada'
    ) AS empresa_nome,
    
    CASE 
        WHEN pr.empresa_tipo = 'interna' THEN NULL -- companies não possui CNPJ
        WHEN pr.empresa_tipo = 'terceira' THEN et.cnpj
        ELSE NULL
    END AS empresa_cnpj,
    
    -- Dados do relatório
    r.report_number,
    r.date as relatorio_data,
    r.total_value as relatorio_valor,
    r.status as relatorio_status,
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
    
    -- Status unificado CORRIGIDO - PRIORIZA STATUS PAGO
    CASE 
        WHEN pr.status = 'pago' THEN 'pago'  -- PRIORIDADE MÁXIMA: se está pago, sempre pago
        WHEN pr.status = 'vencido' THEN 'vencido'
        WHEN pr.prazo_data IS NOT NULL AND pr.prazo_data <= CURRENT_DATE THEN 'vencido'
        WHEN pr.prazo_data IS NOT NULL AND pr.prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'proximo_vencimento'
        ELSE 'aguardando'
    END as status_unificado,
    
    -- Dias até vencimento
    CASE 
        WHEN pr.prazo_data IS NOT NULL THEN (pr.prazo_data - CURRENT_DATE)
        ELSE NULL
    END as dias_ate_vencimento,
    
    -- Status do pagamento como booleano
    CASE WHEN pr.status = 'pago' THEN true ELSE false END as pagamento_pago

FROM pagamentos_receber pr
JOIN reports r ON pr.relatorio_id = r.id
JOIN clients c ON pr.cliente_id = c.id
LEFT JOIN companies comp ON pr.empresa_id = comp.id AND pr.empresa_tipo = 'interna'
LEFT JOIN empresas_terceiras et ON pr.empresa_id = et.id AND pr.empresa_tipo = 'terceira'
LEFT JOIN notas_fiscais nf ON r.id = nf.relatorio_id;

-- 5. TESTAR A VIEW CORRIGIDA
SELECT '=== TESTANDO VIEW CORRIGIDA ===' as info;

SELECT 
    id,
    relatorio_id,
    valor_total,
    pagamento_status,
    prazo_data,
    status_unificado,
    dias_ate_vencimento
FROM view_pagamentos_receber_integrado 
WHERE pagamento_status = 'pago'
ORDER BY prazo_data DESC
LIMIT 10;

-- 6. VERIFICAR SE O PROBLEMA FOI RESOLVIDO
SELECT '=== VERIFICANDO CORREÇÃO ===' as info;

SELECT 
    'Pagamentos com status pago e status_unificado correto' as teste,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado 
WHERE pagamento_status = 'pago' 
AND status_unificado = 'pago';

SELECT 
    'Pagamentos com status pago mas status_unificado incorreto' as teste,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado 
WHERE pagamento_status = 'pago' 
AND status_unificado != 'pago';

-- 7. MOSTRAR DISTRIBUIÇÃO DOS STATUS
SELECT '=== DISTRIBUIÇÃO DOS STATUS ===' as info;

SELECT 
    status_unificado,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado 
GROUP BY status_unificado
ORDER BY status_unificado;

SELECT '=== LÓGICA DO STATUS_UNIFICADO CORRIGIDA ===' as info;
