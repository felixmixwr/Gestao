-- =============================================
-- VERIFICAR E CORRIGIR VIEW PAGAMENTOS RECEBER
-- =============================================
-- Este script verifica se a view está retornando cliente_nome e empresa_nome

-- 1. VERIFICAR ESTRUTURA ATUAL DA VIEW
SELECT '=== VERIFICANDO ESTRUTURA DA VIEW ===' as info;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'view_pagamentos_receber_integrado' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. TESTAR A VIEW ATUAL
SELECT '=== TESTANDO VIEW ATUAL ===' as info;

SELECT 
    id,
    cliente_nome,
    empresa_nome,
    valor_total,
    status_unificado
FROM view_pagamentos_receber_integrado 
LIMIT 5;

-- 3. VERIFICAR SE EXISTEM DADOS SEM NOME DE CLIENTE OU EMPRESA
SELECT '=== VERIFICANDO DADOS FALTANTES ===' as info;

SELECT 
    COUNT(*) as total_registros,
    COUNT(cliente_nome) as com_cliente_nome,
    COUNT(empresa_nome) as com_empresa_nome,
    COUNT(CASE WHEN cliente_nome IS NULL OR cliente_nome = '' THEN 1 END) as sem_cliente_nome,
    COUNT(CASE WHEN empresa_nome IS NULL OR empresa_nome = '' THEN 1 END) as sem_empresa_nome
FROM view_pagamentos_receber_integrado;

-- 4. MOSTRAR EXEMPLOS DE DADOS PROBLEMÁTICOS
SELECT '=== EXEMPLOS DE DADOS PROBLEMÁTICOS ===' as info;

SELECT 
    id,
    cliente_nome,
    empresa_nome,
    valor_total,
    status_unificado
FROM view_pagamentos_receber_integrado 
WHERE cliente_nome IS NULL OR cliente_nome = '' OR empresa_nome IS NULL OR empresa_nome = ''
LIMIT 10;

-- 5. RECRIAR A VIEW COM GARANTIA DE NOMES
SELECT '=== RECRIANDO VIEW COM GARANTIA DE NOMES ===' as info;

-- Remover view existente
DROP VIEW IF EXISTS view_pagamentos_receber_integrado;

-- Recriar view com garantia de nomes
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
    
    -- Dados da nota fiscal
    nf.id as nota_fiscal_id,
    nf.numero as numero_nota,
    nf.data_emissao as nf_data_emissao,
    nf.status as nf_status,
    nf.valor as nf_valor,
    CASE WHEN nf.id IS NOT NULL THEN true ELSE false END as tem_nota_fiscal,
    
    -- Status unificado
    CASE 
        WHEN pr.status = 'pago' THEN 'pago'
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

-- 6. TESTAR A VIEW RECRIADA
SELECT '=== TESTANDO VIEW RECRIADA ===' as info;

SELECT 
    id,
    cliente_nome,
    empresa_nome,
    valor_total,
    status_unificado
FROM view_pagamentos_receber_integrado 
LIMIT 5;

-- 7. VERIFICAR SE AGORA TODOS TÊM NOMES
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN cliente_nome IS NULL OR cliente_nome = '' THEN 1 END) as sem_cliente_nome,
    COUNT(CASE WHEN empresa_nome IS NULL OR empresa_nome = '' THEN 1 END) as sem_empresa_nome
FROM view_pagamentos_receber_integrado;

SELECT '=== VIEW CORRIGIDA COM SUCESSO ===' as info;
