-- =============================================
-- DIAGNOSTICAR PROBLEMAS NA VIEW E DADOS ÓRFÃOS
-- =============================================
-- Este script investiga problemas específicos na view e dados órfãos

-- 1. VERIFICAR SE HÁ PAGAMENTOS "PAGO" NO BACKEND
SELECT '=== VERIFICANDO PAGAMENTOS PAGO NO BACKEND ===' as info;

SELECT 
    status,
    COUNT(*) as quantidade
FROM pagamentos_receber
GROUP BY status
ORDER BY status;

-- 2. VERIFICAR SE A VIEW ESTÁ INCLUINDO TODOS OS REGISTROS
SELECT '=== VERIFICANDO COBERTURA DA VIEW ===' as info;

SELECT 
    'Total na tabela pagamentos_receber' as fonte,
    COUNT(*) as quantidade
FROM pagamentos_receber

UNION ALL

SELECT 
    'Total na view_pagamentos_receber_integrado' as fonte,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado;

-- 3. IDENTIFICAR REGISTROS QUE NÃO ESTÃO NA VIEW (DADOS ÓRFÃOS)
SELECT '=== REGISTROS QUE NÃO ESTÃO NA VIEW ===' as info;

SELECT 
    pr.id,
    pr.status,
    pr.relatorio_id,
    pr.valor_total,
    CASE WHEN r.id IS NULL THEN 'RELATÓRIO NÃO EXISTE' ELSE 'RELATÓRIO OK' END as relatorio_status,
    CASE WHEN c.id IS NULL THEN 'CLIENTE NÃO EXISTE' ELSE 'CLIENTE OK' END as cliente_status,
    CASE WHEN comp.id IS NULL AND et.id IS NULL THEN 'EMPRESA NÃO EXISTE' ELSE 'EMPRESA OK' END as empresa_status
FROM pagamentos_receber pr
LEFT JOIN reports r ON pr.relatorio_id = r.id
LEFT JOIN clients c ON pr.cliente_id = c.id
LEFT JOIN companies comp ON pr.empresa_id = comp.id AND pr.empresa_tipo = 'interna'
LEFT JOIN empresas_terceiras et ON pr.empresa_id = et.id AND pr.empresa_tipo = 'terceira'
LEFT JOIN view_pagamentos_receber_integrado vpi ON pr.id = vpi.id
WHERE vpi.id IS NULL
ORDER BY pr.created_at DESC
LIMIT 10;

-- 4. VERIFICAR ESPECIFICAMENTE PAGAMENTOS "PAGO" QUE NÃO APARECEM NA VIEW
SELECT '=== PAGAMENTOS PAGO QUE NÃO APARECEM NA VIEW ===' as info;

SELECT 
    pr.id,
    pr.status,
    pr.relatorio_id,
    pr.valor_total,
    pr.created_at,
    r.id as relatorio_existe,
    c.id as cliente_existe,
    comp.id as empresa_interna_existe,
    et.id as empresa_terceira_existe
FROM pagamentos_receber pr
LEFT JOIN reports r ON pr.relatorio_id = r.id
LEFT JOIN clients c ON pr.cliente_id = c.id
LEFT JOIN companies comp ON pr.empresa_id = comp.id AND pr.empresa_tipo = 'interna'
LEFT JOIN empresas_terceiras et ON pr.empresa_id = et.id AND pr.empresa_tipo = 'terceira'
LEFT JOIN view_pagamentos_receber_integrado vpi ON pr.id = vpi.id
WHERE pr.status = 'pago'
AND vpi.id IS NULL
ORDER BY pr.created_at DESC;

-- 5. TESTAR JOIN DA VIEW MANUALMENTE
SELECT '=== TESTANDO JOIN DA VIEW MANUALMENTE ===' as info;

SELECT 
    pr.id,
    pr.status as pagamento_status,
    pr.relatorio_id,
    c.name as cliente_nome,
    r.report_number,
    r.status as relatorio_status,
    CASE 
        WHEN pr.status = 'pago' THEN 'pago'
        WHEN pr.status = 'vencido' THEN 'vencido'
        WHEN pr.prazo_data IS NOT NULL AND pr.prazo_data <= CURRENT_DATE THEN 'vencido'
        WHEN pr.prazo_data IS NOT NULL AND pr.prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'proximo_vencimento'
        ELSE 'aguardando'
    END as status_unificado_calculado
FROM pagamentos_receber pr
JOIN reports r ON pr.relatorio_id = r.id
JOIN clients c ON pr.cliente_id = c.id
WHERE pr.status = 'pago'
ORDER BY pr.created_at DESC
LIMIT 5;

-- 6. VERIFICAR SE HÁ PROBLEMAS COM EMPRESAS
SELECT '=== VERIFICANDO PROBLEMAS COM EMPRESAS ===' as info;

SELECT 
    pr.id,
    pr.empresa_id,
    pr.empresa_tipo,
    CASE 
        WHEN pr.empresa_tipo = 'interna' THEN comp.name
        WHEN pr.empresa_tipo = 'terceira' THEN et.nome_fantasia
        ELSE 'TIPO INVÁLIDO'
    END as empresa_nome_calculado,
    comp.id as empresa_interna_id,
    et.id as empresa_terceira_id
FROM pagamentos_receber pr
LEFT JOIN companies comp ON pr.empresa_id = comp.id AND pr.empresa_tipo = 'interna'
LEFT JOIN empresas_terceiras et ON pr.empresa_id = et.id AND pr.empresa_tipo = 'terceira'
WHERE pr.status = 'pago'
ORDER BY pr.created_at DESC
LIMIT 5;

-- 7. VERIFICAR ESTRUTURA DA VIEW
SELECT '=== VERIFICANDO ESTRUTURA DA VIEW ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'view_pagamentos_receber_integrado' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '=== DIAGNÓSTICO CONCLUÍDO ===' as info;
