-- =============================================
-- CORRIGIR PROBLEMAS NA VIEW E DADOS ÓRFÃOS
-- =============================================
-- Este script corrige problemas identificados na view e dados órfãos

-- 1. VERIFICAR DADOS ÓRFÃOS ANTES DA CORREÇÃO
SELECT '=== VERIFICANDO DADOS ÓRFÃOS ANTES DA CORREÇÃO ===' as info;

SELECT 
    'Pagamentos sem relatório' as problema,
    COUNT(*) as quantidade
FROM pagamentos_receber pr
LEFT JOIN reports r ON pr.relatorio_id = r.id
WHERE r.id IS NULL

UNION ALL

SELECT 
    'Pagamentos sem cliente' as problema,
    COUNT(*) as quantidade
FROM pagamentos_receber pr
LEFT JOIN clients c ON pr.cliente_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 
    'Pagamentos sem empresa válida' as problema,
    COUNT(*) as quantidade
FROM pagamentos_receber pr
LEFT JOIN companies comp ON pr.empresa_id = comp.id AND pr.empresa_tipo = 'interna'
LEFT JOIN empresas_terceiras et ON pr.empresa_id = et.id AND pr.empresa_tipo = 'terceira'
WHERE pr.empresa_id IS NOT NULL 
AND comp.id IS NULL 
AND et.id IS NULL;

-- 2. CRIAR PAGAMENTOS PARA RELATÓRIOS ÓRFÃOS (SE NECESSÁRIO)
SELECT '=== VERIFICANDO RELATÓRIOS SEM PAGAMENTOS ===' as info;

SELECT 
    r.id,
    r.report_number,
    r.status,
    r.total_value,
    r.client_id,
    c.name as cliente_nome
FROM reports r
JOIN clients c ON r.client_id = c.id
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
WHERE pr.id IS NULL
AND r.status NOT IN ('CANCELADO', 'RASCUNHO')
ORDER BY r.created_at DESC
LIMIT 5;

-- 3. RECRIAR VIEW COM LÓGICA MAIS ROBUSTA
SELECT '=== RECRIANDO VIEW COM LÓGICA ROBUSTA ===' as info;

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
    
    -- Status unificado CORRIGIDO - PRIORIZA STATUS PAGO
    CASE 
        WHEN pr.status = 'pago' THEN 'pago'  -- PRIORIDADE MÁXIMA
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
LEFT JOIN reports r ON pr.relatorio_id = r.id  -- LEFT JOIN para incluir todos os pagamentos
LEFT JOIN clients c ON pr.cliente_id = c.id    -- LEFT JOIN para incluir todos os pagamentos
LEFT JOIN companies comp ON pr.empresa_id = comp.id AND pr.empresa_tipo = 'interna'
LEFT JOIN empresas_terceiras et ON pr.empresa_id = et.id AND pr.empresa_tipo = 'terceira'
LEFT JOIN notas_fiscais nf ON r.id = nf.relatorio_id;

-- 4. TESTAR A VIEW CORRIGIDA
SELECT '=== TESTANDO VIEW CORRIGIDA ===' as info;

SELECT 
    status_unificado,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado
GROUP BY status_unificado
ORDER BY status_unificado;

-- 5. VERIFICAR PAGAMENTOS "PAGO" ESPECÍFICOS
SELECT '=== VERIFICANDO PAGAMENTOS PAGO ESPECÍFICOS ===' as info;

SELECT 
    id,
    relatorio_id,
    valor_total,
    pagamento_status,
    status_unificado,
    cliente_nome,
    empresa_nome
FROM view_pagamentos_receber_integrado
WHERE pagamento_status = 'pago'
ORDER BY pagamento_updated_at DESC
LIMIT 5;

-- 6. VERIFICAR SE TODOS OS REGISTROS ESTÃO NA VIEW
SELECT '=== VERIFICANDO COBERTURA FINAL ===' as info;

SELECT 
    'Total na tabela pagamentos_receber' as fonte,
    COUNT(*) as quantidade
FROM pagamentos_receber

UNION ALL

SELECT 
    'Total na view_pagamentos_receber_integrado' as fonte,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado;

SELECT '=== CORREÇÃO CONCLUÍDA ===' as info;
