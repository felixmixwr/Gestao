-- =============================================
-- VERIFICAR DADOS ESPECÍFICOS DO PROBLEMA
-- =============================================
-- Este script verifica dados específicos para entender por que o badge ainda mostra "Vencido"

-- 1. VERIFICAR O REGISTRO ESPECÍFICO DA IMAGEM
SELECT '=== VERIFICANDO REGISTRO ESPECÍFICO ===' as info;

SELECT 
    id,
    relatorio_id,
    cliente_nome,
    empresa_nome,
    valor_total,
    pagamento_status,
    status_unificado,
    prazo_data,
    dias_ate_vencimento,
    relatorio_status,
    report_number
FROM view_pagamentos_receber_integrado 
WHERE cliente_nome = 'Falcão bombas'
  AND empresa_nome = 'FELIX MIX'
  AND valor_total = 1600.00
ORDER BY pagamento_created_at DESC;

-- 2. VERIFICAR TODOS OS REGISTROS COM STATUS PAGO
SELECT '=== TODOS OS REGISTROS COM STATUS PAGO ===' as info;

SELECT 
    id,
    cliente_nome,
    empresa_nome,
    valor_total,
    pagamento_status,
    status_unificado,
    prazo_data,
    dias_ate_vencimento,
    relatorio_status
FROM view_pagamentos_receber_integrado 
WHERE pagamento_status = 'pago'
ORDER BY pagamento_updated_at DESC;

-- 3. VERIFICAR SE HÁ INCONSISTÊNCIAS ESPECÍFICAS
SELECT '=== VERIFICANDO INCONSISTÊNCIAS ESPECÍFICAS ===' as info;

SELECT 
    'Pagamentos com status pago mas status_unificado diferente' as problema,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado
WHERE pagamento_status = 'pago' 
AND status_unificado != 'pago'

UNION ALL

SELECT 
    'Pagamentos com relatorio_status PAGO mas pagamento_status diferente' as problema,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado
WHERE relatorio_status = 'PAGO' 
AND pagamento_status != 'pago';

-- 4. VERIFICAR DADOS NA TABELA ORIGINAL
SELECT '=== VERIFICANDO DADOS NA TABELA ORIGINAL ===' as info;

SELECT 
    pr.id,
    pr.status as pagamento_status_tabela,
    pr.prazo_data,
    r.status as relatorio_status_tabela,
    c.name as cliente_nome_tabela
FROM pagamentos_receber pr
JOIN reports r ON pr.relatorio_id = r.id
JOIN clients c ON pr.cliente_id = c.id
WHERE c.name = 'Falcão bombas'
  AND pr.valor_total = 1600.00
ORDER BY pr.created_at DESC;

-- 5. TESTAR LÓGICA MANUALMENTE
SELECT '=== TESTANDO LÓGICA MANUALMENTE ===' as info;

SELECT 
    pr.id,
    pr.status as pagamento_status,
    pr.prazo_data,
    CASE 
        WHEN pr.status = 'pago' THEN 'pago'
        WHEN pr.status = 'vencido' THEN 'vencido'
        WHEN pr.prazo_data IS NOT NULL AND pr.prazo_data <= CURRENT_DATE THEN 'vencido'
        WHEN pr.prazo_data IS NOT NULL AND pr.prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'proximo_vencimento'
        ELSE 'aguardando'
    END as status_unificado_manual,
    vpi.status_unificado as status_unificado_view
FROM pagamentos_receber pr
LEFT JOIN view_pagamentos_receber_integrado vpi ON pr.id = vpi.id
WHERE pr.id IN (
    SELECT pr2.id 
    FROM pagamentos_receber pr2
    JOIN clients c ON pr2.cliente_id = c.id
    WHERE c.name = 'Falcão bombas'
      AND pr2.valor_total = 1600.00
)
ORDER BY pr.created_at DESC;

-- 6. VERIFICAR SE HÁ CACHE OU PROBLEMA DE ATUALIZAÇÃO
SELECT '=== VERIFICANDO TIMESTAMPS ===' as info;

SELECT 
    id,
    pagamento_status,
    status_unificado,
    pagamento_created_at,
    pagamento_updated_at,
    CASE 
        WHEN pagamento_updated_at > pagamento_created_at THEN 'ATUALIZADO'
        ELSE 'CRIADO'
    END as status_atualizacao
FROM view_pagamentos_receber_integrado 
WHERE cliente_nome = 'Falcão bombas'
ORDER BY pagamento_updated_at DESC;

SELECT '=== VERIFICAÇÃO ESPECÍFICA CONCLUÍDA ===' as info;
