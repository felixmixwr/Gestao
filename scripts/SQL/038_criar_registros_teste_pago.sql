-- =============================================
-- CRIAR REGISTROS DE TESTE COM STATUS "PAGO"
-- =============================================
-- Este script cria alguns registros de teste para verificar se a lógica funciona

-- 1. VERIFICAR DADOS ATUAIS ANTES DE CRIAR TESTES
SELECT '=== DADOS ATUAIS ANTES DOS TESTES ===' as info;

SELECT 
    status,
    COUNT(*) as quantidade
FROM pagamentos_receber
GROUP BY status
ORDER BY status;

-- 2. CRIAR ALGUNS REGISTROS DE TESTE COM STATUS "PAGO"
SELECT '=== CRIANDO REGISTROS DE TESTE ===' as info;

-- Atualizar alguns pagamentos existentes para status "pago"
UPDATE pagamentos_receber 
SET 
    status = 'pago'::status_pagamento,
    observacoes = COALESCE(observacoes, '') || ' | Teste: marcado como pago para verificar lógica',
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM pagamentos_receber 
    WHERE status = 'aguardando' 
    ORDER BY created_at DESC 
    LIMIT 3
);

-- 3. VERIFICAR SE OS REGISTROS FORAM ATUALIZADOS
SELECT '=== VERIFICANDO ATUALIZAÇÃO ===' as info;

SELECT 
    id,
    status,
    relatorio_id,
    valor_total,
    observacoes
FROM pagamentos_receber
WHERE status = 'pago'
ORDER BY updated_at DESC
LIMIT 5;

-- 4. TESTAR A VIEW APÓS ATUALIZAÇÃO
SELECT '=== TESTANDO VIEW APÓS ATUALIZAÇÃO ===' as info;

SELECT 
    status_unificado,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado
GROUP BY status_unificado
ORDER BY status_unificado;

-- 5. VERIFICAR SE OS REGISTROS "PAGO" APARECEM CORRETAMENTE
SELECT '=== VERIFICANDO REGISTROS PAGO NA VIEW ===' as info;

SELECT 
    id,
    relatorio_id,
    valor_total,
    pagamento_status,
    status_unificado,
    prazo_data
FROM view_pagamentos_receber_integrado
WHERE pagamento_status = 'pago'
ORDER BY pagamento_updated_at DESC
LIMIT 5;

-- 6. VERIFICAR DISTRIBUIÇÃO FINAL
SELECT '=== DISTRIBUIÇÃO FINAL ===' as info;

SELECT 
    'Pagamentos na tabela' as fonte,
    status as status_valor,
    COUNT(*) as quantidade
FROM pagamentos_receber
GROUP BY status

UNION ALL

SELECT 
    'Status unificado na view' as fonte,
    status_unificado as status_valor,
    COUNT(*) as quantidade
FROM view_pagamentos_receber_integrado
GROUP BY status_unificado
ORDER BY fonte, status_valor;

SELECT '=== TESTES CONCLUÍDOS ===' as info;
