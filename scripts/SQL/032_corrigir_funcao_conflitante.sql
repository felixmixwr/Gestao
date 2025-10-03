-- =============================================
-- CORRIGIR FUNÇÃO CONFLITANTE E LIMPAR TRIGGERS
-- =============================================
-- Este script corrige a função conflitante que está causando o erro

-- 1. VERIFICAR FUNÇÃO CONFLITANTE COMPLETA
SELECT '=== VERIFICANDO FUNÇÃO CONFLITANTE COMPLETA ===' as info;

SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'sincronizar_status_pagamento_relatorio';

-- 2. VERIFICAR TRIGGERS QUE USAM A FUNÇÃO CONFLITANTE
SELECT '=== VERIFICANDO TRIGGERS CONFLITANTES ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%sincronizar_status_pagamento_relatorio%';

-- 3. REMOVER TRIGGERS PROBLEMÁTICOS
SELECT '=== REMOVENDO TRIGGERS PROBLEMÁTICOS ===' as info;

-- Remover todos os triggers que usam a função conflitante
DROP TRIGGER IF EXISTS trigger_sincronizar_status_pagamento_relatorio ON reports;
DROP TRIGGER IF EXISTS trigger_sincronizar_status_pagamento_relatorio ON pagamentos_receber;
DROP TRIGGER IF EXISTS trigger_atualizar_status_automatico_pagamentos ON pagamentos_receber;

-- 4. REMOVER FUNÇÃO CONFLITANTE COM CASCADE
SELECT '=== REMOVENDO FUNÇÃO CONFLITANTE COM CASCADE ===' as info;

DROP FUNCTION IF EXISTS sincronizar_status_pagamento_relatorio() CASCADE;

-- 5. VERIFICAR OUTRAS FUNÇÕES PROBLEMÁTICAS
SELECT '=== VERIFICANDO OUTRAS FUNÇÕES PROBLEMÁTICAS ===' as info;

SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname LIKE '%sincronizar%' 
OR proname LIKE '%status%pagamento%'
ORDER BY proname;

-- 6. VERIFICAR TRIGGERS RESTANTES
SELECT '=== VERIFICANDO TRIGGERS RESTANTES ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%pagamento%'
OR trigger_name LIKE '%status%'
ORDER BY trigger_name;

-- 7. LIMPAR FUNÇÕES PROBLEMÁTICAS ADICIONAIS
SELECT '=== LIMPANDO FUNÇÕES PROBLEMÁTICAS ADICIONAIS ===' as info;

-- Remover outras funções que podem estar causando conflitos (com CASCADE)
DROP FUNCTION IF EXISTS criar_pagamento_automatico_integrado() CASCADE;
DROP FUNCTION IF EXISTS atualizar_status_automatico_pagamentos() CASCADE;
DROP FUNCTION IF EXISTS sincronizar_nota_fiscal_pagamento() CASCADE;
DROP FUNCTION IF EXISTS sincronizar_status_nota_fiscal() CASCADE;

-- 8. VERIFICAR LIMPEZA
SELECT '=== VERIFICANDO LIMPEZA ===' as info;

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

SELECT '=== LIMPEZA CONCLUÍDA ===' as info;
