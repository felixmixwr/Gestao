-- Script de teste simples para verificar o cálculo de dias
-- Teste rápido para confirmar que a correção funcionou

-- =============================================
-- 1. TESTAR FUNÇÃO DE CÁLCULO DE DIAS
-- =============================================

-- Teste básico: se hoje é dia 25 e colocamos dia 30, deveria ser 5 dias
SELECT 
    'Teste básico:' as info,
    CURRENT_DATE as hoje,
    CURRENT_DATE + 5 as dia_30_simulado,
    calcular_dias_vencimento(CURRENT_DATE + 5) as dias_calculados,
    CASE 
        WHEN calcular_dias_vencimento(CURRENT_DATE + 5) = 5 THEN '✅ CORRETO - Deveria ser 5 dias'
        ELSE '❌ ERRO - Deveria ser 5 dias'
    END as resultado;

-- =============================================
-- 2. TESTAR DIFERENTES CENÁRIOS
-- =============================================

-- Teste 1: Hoje (deveria ser 0 dias)
SELECT 
    'Hoje:' as cenario,
    CURRENT_DATE as data_teste,
    calcular_dias_vencimento(CURRENT_DATE) as dias_calculados,
    CASE 
        WHEN calcular_dias_vencimento(CURRENT_DATE) = 0 THEN '✅ CORRETO'
        ELSE '❌ ERRO'
    END as resultado;

-- Teste 2: Amanhã (deveria ser 1 dia)
SELECT 
    'Amanhã:' as cenario,
    CURRENT_DATE + 1 as data_teste,
    calcular_dias_vencimento(CURRENT_DATE + 1) as dias_calculados,
    CASE 
        WHEN calcular_dias_vencimento(CURRENT_DATE + 1) = 1 THEN '✅ CORRETO'
        ELSE '❌ ERRO'
    END as resultado;

-- Teste 3: Em 5 dias (deveria ser 5 dias)
SELECT 
    'Em 5 dias:' as cenario,
    CURRENT_DATE + 5 as data_teste,
    calcular_dias_vencimento(CURRENT_DATE + 5) as dias_calculados,
    CASE 
        WHEN calcular_dias_vencimento(CURRENT_DATE + 5) = 5 THEN '✅ CORRETO'
        ELSE '❌ ERRO'
    END as resultado;

-- Teste 4: Ontem (deveria ser 0 dias - não pode ser negativo)
SELECT 
    'Ontem:' as cenario,
    CURRENT_DATE - 1 as data_teste,
    calcular_dias_vencimento(CURRENT_DATE - 1) as dias_calculados,
    CASE 
        WHEN calcular_dias_vencimento(CURRENT_DATE - 1) = 0 THEN '✅ CORRETO'
        ELSE '❌ ERRO'
    END as resultado;

-- =============================================
-- 3. VERIFICAR CÁLCULO MANUAL
-- =============================================

-- Verificar cálculo manual para comparar
SELECT 
    'Cálculo manual:' as info,
    CURRENT_DATE as hoje,
    CURRENT_DATE + 5 as vencimento,
    (CURRENT_DATE + 5) - CURRENT_DATE as diferenca_dias;

-- =============================================
-- 4. RESUMO DOS TESTES
-- =============================================

-- Mostrar resumo dos testes
SELECT 
    'Resumo dos testes:' as info,
    'Se todos os testes mostram ✅ CORRETO, a função está funcionando!' as status;




