-- =============================================
-- LIMPEZA FINAL DOS OBJETOS RESTANTES
-- =============================================
-- Este script remove os objetos restantes identificados

-- 1. IDENTIFICAR FUNÇÃO RESTANTE
SELECT '=== IDENTIFICANDO FUNÇÃO RESTANTE ===' as info;

SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname LIKE '%sincronizar%';

-- 2. IDENTIFICAR TRIGGERS RESTANTES
SELECT '=== IDENTIFICANDO TRIGGERS RESTANTES ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%pagamento%'
ORDER BY trigger_name;

-- 3. REMOVER TRIGGERS RESTANTES
SELECT '=== REMOVENDO TRIGGERS RESTANTES ===' as info;

-- Lista todos os triggers com pagamento para remoção
DROP TRIGGER IF EXISTS trigger_sincronizar_pagamento_nota_fiscal ON notas_fiscais;
DROP TRIGGER IF EXISTS trigger_atualizar_pagamento_nota_fiscal ON notas_fiscais;
DROP TRIGGER IF EXISTS trigger_sincronizar_pagamento_nota_fiscal_v2 ON notas_fiscais;
DROP TRIGGER IF EXISTS trigger_atualizar_pagamento_nota_fiscal_v2 ON notas_fiscais;
DROP TRIGGER IF EXISTS trigger_inserir_nota_fiscal_sync ON notas_fiscais;
DROP TRIGGER IF EXISTS trigger_atualizar_nota_fiscal_sync ON notas_fiscais;

-- 4. REMOVER FUNÇÃO RESTANTE
SELECT '=== REMOVENDO FUNÇÃO RESTANTE ===' as info;

-- Remover a função restante (se houver)
DROP FUNCTION IF EXISTS sincronizar_pagamento_com_nota_fiscal() CASCADE;
DROP FUNCTION IF EXISTS sincronizar_pagamento_com_nota_fiscal_v2() CASCADE;
DROP FUNCTION IF EXISTS sincronizar_nota_fiscal_com_pagamento() CASCADE;

-- 5. VERIFICAR LIMPEZA COMPLETA
SELECT '=== VERIFICANDO LIMPEZA COMPLETA ===' as info;

SELECT 
    'Funções restantes com sincronizar' as tipo,
    COUNT(*) as quantidade
FROM pg_proc 
WHERE proname LIKE '%sincronizar%'

UNION ALL

SELECT 
    'Triggers restantes com pagamento' as tipo,
    COUNT(*) as quantidade
FROM information_schema.triggers 
WHERE trigger_name LIKE '%pagamento%';

-- 6. VERIFICAR TRIGGERS RESTANTES (DETALHADO)
SELECT '=== TRIGGERS RESTANTES DETALHADOS ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%pagamento%'
ORDER BY trigger_name;

SELECT '=== LIMPEZA FINAL CONCLUÍDA ===' as info;
