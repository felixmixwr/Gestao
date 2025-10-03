-- =============================================
-- TESTAR SE O STATUS PAGO FOI CORRIGIDO
-- =============================================
-- Este script testa se os pagamentos "pago" agora aparecem corretamente

-- 1. VERIFICAR DISTRIBUIÇÃO DOS STATUS UNIFICADOS
SELECT '=== DISTRIBUIÇÃO DOS STATUS UNIFICADOS ===' as info;

SELECT 
    status_unificado,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado
GROUP BY status_unificado
ORDER BY status_unificado;

-- 2. VERIFICAR PAGAMENTOS COM STATUS "PAGO"
SELECT '=== PAGAMENTOS COM STATUS PAGO ===' as info;

SELECT 
    id,
    relatorio_id,
    valor_total,
    pagamento_status,
    status_unificado,
    cliente_nome,
    empresa_nome,
    prazo_data
FROM view_pagamentos_receber_integrado
WHERE pagamento_status = 'pago'
ORDER BY pagamento_updated_at DESC
LIMIT 10;

-- 3. VERIFICAR SE HÁ INCONSISTÊNCIAS
SELECT '=== VERIFICANDO INCONSISTÊNCIAS ===' as info;

SELECT 
    'Pagamentos pago com status_unificado incorreto' as problema,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado
WHERE pagamento_status = 'pago' 
AND status_unificado != 'pago'

UNION ALL

SELECT 
    'Pagamentos aguardando com status_unificado pago' as problema,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado
WHERE pagamento_status = 'aguardando' 
AND status_unificado = 'pago';

-- 4. TESTAR LÓGICA DE DATAS
SELECT '=== TESTANDO LÓGICA DE DATAS ===' as info;

SELECT 
    id,
    pagamento_status,
    status_unificado,
    prazo_data,
    CASE 
        WHEN prazo_data IS NOT NULL THEN (prazo_data - CURRENT_DATE)
        ELSE NULL
    END as dias_ate_vencimento,
    CASE 
        WHEN prazo_data IS NOT NULL AND prazo_data <= CURRENT_DATE THEN 'Deveria ser vencido'
        WHEN prazo_data IS NOT NULL AND prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'Deveria ser próximo vencimento'
        ELSE 'Deveria ser aguardando'
    END as logica_esperada
FROM view_pagamentos_receber_integrado
WHERE pagamento_status != 'pago'
ORDER BY prazo_data DESC
LIMIT 10;

-- 5. VERIFICAR DADOS ÓRFÃOS RESOLVIDOS
SELECT '=== VERIFICANDO DADOS ÓRFÃOS RESOLVIDOS ===' as info;

SELECT 
    'Registros com fallbacks' as tipo,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado
WHERE cliente_nome = 'Cliente não informado'
   OR empresa_nome = 'Empresa não informada'
   OR empresa_nome = 'Sem empresa'
   OR empresa_nome = 'Empresa não encontrada'
   OR report_number = 'RELATÓRIO NÃO ENCONTRADO'
   OR relatorio_status = 'STATUS NÃO ENCONTRADO';

-- 6. RESUMO FINAL
SELECT '=== RESUMO FINAL ===' as info;

SELECT 
    'Total de registros na view' as metric,
    COUNT(*) as valor
FROM view_pagamentos_receber_integrado

UNION ALL

SELECT 
    'Registros com status pago' as metric,
    COUNT(*) as valor
FROM view_pagamentos_receber_integrado
WHERE pagamento_status = 'pago'

UNION ALL

SELECT 
    'Registros com status_unificado pago' as metric,
    COUNT(*) as valor
FROM view_pagamentos_receber_integrado
WHERE status_unificado = 'pago'

UNION ALL

SELECT 
    'Registros aguardando' as metric,
    COUNT(*) as valor
FROM view_pagamentos_receber_integrado
WHERE status_unificado = 'aguardando'

UNION ALL

SELECT 
    'Registros vencidos' as metric,
    COUNT(*) as valor
FROM view_pagamentos_receber_integrado
WHERE status_unificado = 'vencido';

SELECT '=== TESTE CONCLUÍDO ===' as info;
