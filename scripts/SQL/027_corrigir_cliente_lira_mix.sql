-- =============================================
-- CORRIGIR PROBLEMAS COM CLIENTE "LIRA MIX"
-- =============================================
-- Este script corrige problemas específicos com o cliente Lira Mix

-- 1. IDENTIFICAR O CLIENTE LIRA MIX
SELECT '=== IDENTIFICANDO CLIENTE LIRA MIX ===' as info;

SELECT 
    id,
    name,
    email,
    phone
FROM clients 
WHERE name ILIKE '%lira%mix%' OR name ILIKE '%lira mix%'
ORDER BY name;

-- 2. VERIFICAR RELATÓRIOS DESTE CLIENTE
SELECT '=== RELATÓRIOS DO CLIENTE ===' as info;

-- Substitua 'CLIENTE_ID_AQUI' pelo ID real do cliente encontrado na consulta anterior
SELECT 
    r.id,
    r.report_number,
    r.date,
    r.total_value,
    r.status,
    r.created_at
FROM reports r
WHERE r.client_id = (
    SELECT id FROM clients 
    WHERE name ILIKE '%lira%mix%' OR name ILIKE '%lira mix%'
    LIMIT 1
)
ORDER BY r.date DESC;

-- 3. VERIFICAR SE EXISTEM PAGAMENTOS A RECEBER PARA ESTES RELATÓRIOS
SELECT '=== PAGAMENTOS A RECEBER EXISTENTES ===' as info;

SELECT 
    pr.id,
    pr.relatorio_id,
    pr.valor_total,
    pr.forma_pagamento,
    pr.status,
    pr.prazo_data
FROM pagamentos_receber pr
WHERE pr.relatorio_id IN (
    SELECT r.id FROM reports r
    WHERE r.client_id = (
        SELECT id FROM clients 
        WHERE name ILIKE '%lira%mix%' OR name ILIKE '%lira mix%'
        LIMIT 1
    )
);

-- 4. CRIAR PAGAMENTOS A RECEBER PARA RELATÓRIOS SEM PAGAMENTO
SELECT '=== CRIANDO PAGAMENTOS A RECEBER FALTANTES ===' as info;

-- Inserir pagamentos a receber para relatórios que não possuem
INSERT INTO pagamentos_receber (
    relatorio_id,
    cliente_id,
    empresa_id,
    empresa_tipo,
    valor_total,
    forma_pagamento,
    prazo_data,
    prazo_dias,
    status,
    observacoes,
    created_at,
    updated_at
)
SELECT 
    r.id as relatorio_id,
    r.client_id as cliente_id,
    r.company_id as empresa_id,
    'interna' as empresa_tipo,
    r.total_value as valor_total,
    'sem_forma'::forma_pagamento as forma_pagamento,
    CURRENT_DATE + INTERVAL '30 days' as prazo_data,
    30 as prazo_dias,
    'aguardando'::status_pagamento as status,
    'Criado automaticamente para cliente Lira Mix' as observacoes,
    NOW() as created_at,
    NOW() as updated_at
FROM reports r
WHERE r.client_id = (
    SELECT id FROM clients 
    WHERE name ILIKE '%lira%mix%' OR name ILIKE '%lira mix%'
    LIMIT 1
)
AND NOT EXISTS (
    SELECT 1 FROM pagamentos_receber pr 
    WHERE pr.relatorio_id = r.id
)
AND r.status NOT IN ('PAGO', 'CANCELADO'); -- Excluir relatórios já pagos ou cancelados

-- 5. VERIFICAR RESULTADO
SELECT '=== VERIFICANDO RESULTADO ===' as info;

SELECT 
    pr.id,
    pr.relatorio_id,
    pr.valor_total,
    pr.forma_pagamento,
    pr.status,
    c.name as cliente_nome,
    r.report_number
FROM pagamentos_receber pr
JOIN clients c ON pr.cliente_id = c.id
JOIN reports r ON pr.relatorio_id = r.id
WHERE c.name ILIKE '%lira%mix%' OR c.name ILIKE '%lira mix%'
ORDER BY pr.created_at DESC;

-- 6. TESTAR A VIEW INTEGRADA
SELECT '=== TESTANDO VIEW INTEGRADA ===' as info;

SELECT 
    id,
    cliente_nome,
    empresa_nome,
    valor_total,
    status_unificado,
    report_number
FROM view_pagamentos_receber_integrado 
WHERE cliente_nome ILIKE '%lira%mix%' OR cliente_nome ILIKE '%lira mix%'
ORDER BY pagamento_created_at DESC;

-- 7. VERIFICAR KPIs
SELECT '=== VERIFICANDO KPIs ===' as info;

SELECT 
    'Total de pagamentos do cliente Lira Mix' as kpi,
    COUNT(*) as quantidade,
    SUM(valor_total) as valor_total
FROM view_pagamentos_receber_integrado 
WHERE cliente_nome ILIKE '%lira%mix%' OR cliente_nome ILIKE '%lira mix%';

SELECT '=== CORREÇÃO CONCLUÍDA ===' as info;
