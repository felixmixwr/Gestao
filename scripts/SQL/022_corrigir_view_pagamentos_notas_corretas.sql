-- =============================================
-- CORRIGIR VIEW PAGAMENTOS COM ESTRUTURA CORRETA DE NOTAS
-- =============================================
-- Este script corrige a view usando a tabela 'notes' ao invés de 'notas_fiscais'

-- 1. REMOVER VIEW EXISTENTE
DROP VIEW IF EXISTS view_pagamentos_receber_integrado;

-- 2. RECRIAR VIEW COM ESTRUTURA CORRETA
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
    
    -- Dados da nota fiscal (CORRIGIDO - usando tabela 'notes')
    nf.id as nota_fiscal_id,
    nf.nf_number as numero_nota,  -- CORRIGIDO: nf_number ao invés de numero
    nf.nf_date as nf_data_emissao,  -- CORRIGIDO: nf_date ao invés de data_emissao
    nf.nf_due_date as nf_data_vencimento,  -- ADICIONADO: data de vencimento
    nf.nf_value as nf_valor,  -- CORRIGIDO: nf_value ao invés de valor
    nf.company_name as nf_empresa_nome,  -- ADICIONADO: nome da empresa da NF
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
LEFT JOIN notes nf ON r.id = nf.report_id;  -- CORRIGIDO: notes ao invés de notas_fiscais

-- 3. TESTAR A VIEW CORRIGIDA
SELECT '=== TESTANDO VIEW CORRIGIDA ===' as info;

SELECT 
    id,
    cliente_nome,
    empresa_nome,
    valor_total,
    status_unificado,
    numero_nota,
    tem_nota_fiscal
FROM view_pagamentos_receber_integrado 
LIMIT 5;

-- 4. VERIFICAR SE TODOS TÊM NOMES
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN cliente_nome IS NULL OR cliente_nome = '' THEN 1 END) as sem_cliente_nome,
    COUNT(CASE WHEN empresa_nome IS NULL OR empresa_nome = '' THEN 1 END) as sem_empresa_nome,
    COUNT(CASE WHEN tem_nota_fiscal = true THEN 1 END) as com_nota_fiscal
FROM view_pagamentos_receber_integrado;

-- 5. MOSTRAR EXEMPLOS COM NOTA FISCAL
SELECT '=== EXEMPLOS COM NOTA FISCAL ===' as info;

SELECT 
    id,
    cliente_nome,
    empresa_nome,
    valor_total,
    numero_nota,
    nf_data_emissao,
    nf_valor
FROM view_pagamentos_receber_integrado 
WHERE tem_nota_fiscal = true
LIMIT 5;

SELECT '=== VIEW CORRIGIDA COM SUCESSO ===' as info;
