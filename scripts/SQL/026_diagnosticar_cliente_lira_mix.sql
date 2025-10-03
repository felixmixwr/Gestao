-- =============================================
-- DIAGNOSTICAR CLIENTE "LIRA MIX" EM PAGAMENTOS A RECEBER
-- =============================================
-- Este script investiga por que o cliente Lira Mix não aparece corretamente

-- 1. BUSCAR CLIENTE "LIRA MIX" NA TABELA CLIENTS
SELECT '=== BUSCANDO CLIENTE LIRA MIX ===' as info;

SELECT 
    id,
    name,
    email,
    phone,
    created_at
FROM clients 
WHERE name ILIKE '%lira%mix%' OR name ILIKE '%lira mix%'
ORDER BY name;

-- 2. VERIFICAR RELATÓRIOS DO CLIENTE LIRA MIX
SELECT '=== RELATÓRIOS DO CLIENTE LIRA MIX ===' as info;

SELECT 
    r.id,
    r.report_number,
    r.date,
    r.total_value,
    r.status,
    c.name as cliente_nome,
    r.created_at
FROM reports r
JOIN clients c ON r.client_id = c.id
WHERE c.name ILIKE '%lira%mix%' OR c.name ILIKE '%lira mix%'
ORDER BY r.date DESC;

-- 3. VERIFICAR PAGAMENTOS A RECEBER DO CLIENTE LIRA MIX
SELECT '=== PAGAMENTOS A RECEBER DO CLIENTE LIRA MIX ===' as info;

SELECT 
    pr.id,
    pr.relatorio_id,
    pr.valor_total,
    pr.forma_pagamento,
    pr.status,
    pr.prazo_data,
    c.name as cliente_nome,
    r.report_number,
    r.status as status_relatorio
FROM pagamentos_receber pr
JOIN clients c ON pr.cliente_id = c.id
JOIN reports r ON pr.relatorio_id = r.id
WHERE c.name ILIKE '%lira%mix%' OR c.name ILIKE '%lira mix%'
ORDER BY pr.created_at DESC;

-- 4. VERIFICAR NA VIEW INTEGRADA
SELECT '=== DADOS NA VIEW INTEGRADA ===' as info;

SELECT 
    id,
    cliente_nome,
    empresa_nome,
    valor_total,
    status_unificado,
    report_number,
    relatorio_status,
    pagamento_status
FROM view_pagamentos_receber_integrado 
WHERE cliente_nome ILIKE '%lira%mix%' OR cliente_nome ILIKE '%lira mix%'
ORDER BY pagamento_created_at DESC;

-- 5. VERIFICAR SE HÁ PROBLEMAS DE CASE SENSITIVE
SELECT '=== BUSCA CASE INSENSITIVE ===' as info;

SELECT 
    id,
    name,
    email
FROM clients 
WHERE LOWER(name) LIKE '%lira%' OR LOWER(name) LIKE '%mix%'
ORDER BY name;

-- 6. VERIFICAR TODOS OS CLIENTES COM "MIX" NO NOME
SELECT '=== TODOS OS CLIENTES COM MIX ===' as info;

SELECT 
    id,
    name,
    email,
    phone
FROM clients 
WHERE name ILIKE '%mix%'
ORDER BY name;

-- 7. VERIFICAR SE HÁ DADOS ÓRFÃOS
SELECT '=== VERIFICANDO DADOS ÓRFÃOS ===' as info;

-- Relatórios sem pagamento correspondente
SELECT 
    r.id,
    r.report_number,
    r.date,
    r.total_value,
    r.status,
    c.name as cliente_nome
FROM reports r
JOIN clients c ON r.client_id = c.id
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
WHERE pr.id IS NULL
AND (c.name ILIKE '%lira%mix%' OR c.name ILIKE '%lira mix%')
ORDER BY r.date DESC;

-- 8. VERIFICAR ESTRUTURA DE JOIN
SELECT '=== TESTANDO JOIN DIRETO ===' as info;

SELECT 
    c.id as cliente_id,
    c.name as cliente_nome,
    COUNT(r.id) as total_relatorios,
    COUNT(pr.id) as total_pagamentos
FROM clients c
LEFT JOIN reports r ON c.id = r.client_id
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
WHERE c.name ILIKE '%lira%mix%' OR c.name ILIKE '%lira mix%'
GROUP BY c.id, c.name;

SELECT '=== DIAGNÓSTICO CONCLUÍDO ===' as info;
