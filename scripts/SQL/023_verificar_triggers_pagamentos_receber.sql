-- =============================================
-- VERIFICAR TRIGGERS E CONSTRAINTS NA TABELA PAGAMENTOS_RECEBER
-- =============================================
-- Este script verifica se há triggers que podem estar interferindo

-- 1. VERIFICAR TRIGGERS NA TABELA PAGAMENTOS_RECEBER
SELECT '=== TRIGGERS NA TABELA PAGAMENTOS_RECEBER ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'pagamentos_receber'
AND event_object_schema = 'public'
ORDER BY trigger_name;

-- 2. VERIFICAR CONSTRAINTS NA TABELA
SELECT '=== CONSTRAINTS NA TABELA PAGAMENTOS_RECEBER ===' as info;

SELECT 
    constraint_name,
    constraint_type,
    column_name,
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'pagamentos_receber'
AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 3. VERIFICAR TIPOS DE DADOS DOS ENUMS
SELECT '=== TIPOS DE DADOS DOS ENUMS ===' as info;

SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('forma_pagamento', 'status_pagamento')
ORDER BY t.typname, e.enumsortorder;

-- 4. VERIFICAR ESTRUTURA ATUAL DA TABELA
SELECT '=== ESTRUTURA DA TABELA PAGAMENTOS_RECEBER ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'pagamentos_receber'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. TESTAR UPDATE SIMPLES
SELECT '=== TESTANDO UPDATE SIMPLES ===' as info;

-- Buscar um registro para testar
SELECT 
    id,
    forma_pagamento,
    status,
    updated_at
FROM pagamentos_receber
LIMIT 1;

-- 6. VERIFICAR SE HÁ FUNÇÕES RELACIONADAS
SELECT '=== FUNÇÕES RELACIONADAS ===' as info;

SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_definition LIKE '%pagamentos_receber%' OR routine_name LIKE '%pagamento%')
ORDER BY routine_name;

SELECT '=== VERIFICAÇÃO CONCLUÍDA ===' as info;
