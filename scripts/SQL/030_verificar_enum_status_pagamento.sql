-- =============================================
-- VERIFICAR ENUM STATUS_PAGAMENTO
-- =============================================
-- Este script verifica os valores válidos do enum status_pagamento

-- 1. VERIFICAR VALORES DO ENUM STATUS_PAGAMENTO
SELECT '=== VALORES DO ENUM STATUS_PAGAMENTO ===' as info;

SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'status_pagamento'
ORDER BY e.enumsortorder;

-- 2. VERIFICAR VALORES DO ENUM FORMA_PAGAMENTO
SELECT '=== VALORES DO ENUM FORMA_PAGAMENTO ===' as info;

SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'forma_pagamento'
ORDER BY e.enumsortorder;

-- 3. VERIFICAR DADOS ATUAIS NA TABELA PAGAMENTOS_RECEBER
SELECT '=== DADOS ATUAIS NA TABELA PAGAMENTOS_RECEBER ===' as info;

SELECT 
    status,
    forma_pagamento,
    COUNT(*) as quantidade
FROM pagamentos_receber
GROUP BY status, forma_pagamento
ORDER BY status, forma_pagamento;

-- 4. VERIFICAR SE HÁ FUNÇÃO CONFLITANTE
SELECT '=== VERIFICANDO FUNÇÃO CONFLITANTE ===' as info;

SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname LIKE '%sincronizar_status_pagamento_relatorio%';

SELECT '=== VERIFICAÇÃO CONCLUÍDA ===' as info;
