-- =============================================
-- CORRIGIR VIEW SEM DEPENDÊNCIA DE NOTAS FISCAIS
-- =============================================
-- Este script corrige a view removendo a dependência de notas fiscais

-- 1. VERIFICAR QUAIS TABELAS EXISTEM
SELECT '=== VERIFICANDO TABELAS DISPONÍVEIS ===' as info;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%nota%' OR table_name LIKE '%note%' OR table_name LIKE '%invoice%')
ORDER BY table_name;

-- 2. VERIFICAR SE EXISTE ALGUMA TABELA DE NOTAS
SELECT '=== VERIFICAÇÃO DE TABELAS DE NOTAS ===' as info;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes' AND table_schema = 'public')
        THEN 'Tabela "notes" existe'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notas_fiscais' AND table_schema = 'public')
        THEN 'Tabela "notas_fiscais" existe'
        ELSE 'Nenhuma tabela de notas fiscais encontrada'
    END as status_tabela_notas;

-- 3. REMOVER VIEW EXISTENTE E RECRIAR SEM DEPENDÊNCIA DE NOTAS
SELECT '=== RECRIANDO VIEW SEM DEPENDÊNCIA DE NOTAS ===' as info;

DROP VIEW IF EXISTS view_pagamentos_receber_integrado;

-- Recriar view sem dependência de notas fiscais
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
    
    -- Dados da nota fiscal (SEM DEPENDÊNCIA - valores padrão)
    NULL as nota_fiscal_id,
    NULL as numero_nota,
    NULL as nf_data_emissao,
    NULL as nf_data_vencimento,
    NULL as nf_valor,
    NULL as nf_empresa_nome,
    false as tem_nota_fiscal,  -- Sempre false por enquanto
    
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
LEFT JOIN empresas_terceiras et ON pr.empresa_id = et.id AND pr.empresa_tipo = 'terceira';

-- 4. TESTAR A VIEW RECRIADA
SELECT '=== TESTANDO VIEW RECRIADA ===' as info;

SELECT 
    id,
    cliente_nome,
    empresa_nome,
    valor_total,
    status_unificado,
    tem_nota_fiscal
FROM view_pagamentos_receber_integrado 
LIMIT 5;

-- 5. VERIFICAR SE TODOS TÊM NOMES
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN cliente_nome IS NULL OR cliente_nome = '' THEN 1 END) as sem_cliente_nome,
    COUNT(CASE WHEN empresa_nome IS NULL OR empresa_nome = '' THEN 1 END) as sem_empresa_nome,
    COUNT(CASE WHEN tem_nota_fiscal = true THEN 1 END) as com_nota_fiscal
FROM view_pagamentos_receber_integrado;

-- 6. MOSTRAR EXEMPLOS
SELECT '=== EXEMPLOS DE DADOS ===' as info;

SELECT 
    id,
    cliente_nome,
    empresa_nome,
    valor_total,
    status_unificado,
    report_number
FROM view_pagamentos_receber_integrado 
ORDER BY created_at DESC
LIMIT 5;

SELECT '=== VIEW CRIADA COM SUCESSO (SEM DEPENDÊNCIA DE NOTAS) ===' as info;
