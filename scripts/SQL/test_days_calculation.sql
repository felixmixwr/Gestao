-- Script de teste para verificar o cálculo de dias
-- Teste com diferentes datas para garantir que está correto

-- =============================================
-- 1. TESTAR FUNÇÃO DE CÁLCULO DE DIAS
-- =============================================

-- Criar função de teste
CREATE OR REPLACE FUNCTION testar_calculo_dias()
RETURNS TABLE(
    data_hoje DATE,
    data_teste DATE,
    dias_calculados INT,
    dias_esperados INT,
    resultado TEXT
) AS $$
BEGIN
    -- Teste 1: Hoje (deveria ser 0 dias)
    RETURN QUERY SELECT 
        CURRENT_DATE as data_hoje,
        CURRENT_DATE as data_teste,
        calcular_dias_vencimento(CURRENT_DATE) as dias_calculados,
        0 as dias_esperados,
        CASE 
            WHEN calcular_dias_vencimento(CURRENT_DATE) = 0 THEN '✅ CORRETO'
            ELSE '❌ ERRO'
        END as resultado;
    
    -- Teste 2: Amanhã (deveria ser 1 dia)
    RETURN QUERY SELECT 
        CURRENT_DATE as data_hoje,
        CURRENT_DATE + 1 as data_teste,
        calcular_dias_vencimento(CURRENT_DATE + 1) as dias_calculados,
        1 as dias_esperados,
        CASE 
            WHEN calcular_dias_vencimento(CURRENT_DATE + 1) = 1 THEN '✅ CORRETO'
            ELSE '❌ ERRO'
        END as resultado;
    
    -- Teste 3: Em 5 dias (deveria ser 5 dias)
    RETURN QUERY SELECT 
        CURRENT_DATE as data_hoje,
        CURRENT_DATE + 5 as data_teste,
        calcular_dias_vencimento(CURRENT_DATE + 5) as dias_calculados,
        5 as dias_esperados,
        CASE 
            WHEN calcular_dias_vencimento(CURRENT_DATE + 5) = 5 THEN '✅ CORRETO'
            ELSE '❌ ERRO'
        END as resultado;
    
    -- Teste 4: Em 30 dias (deveria ser 30 dias)
    RETURN QUERY SELECT 
        CURRENT_DATE as data_hoje,
        CURRENT_DATE + 30 as data_teste,
        calcular_dias_vencimento(CURRENT_DATE + 30) as dias_calculados,
        30 as dias_esperados,
        CASE 
            WHEN calcular_dias_vencimento(CURRENT_DATE + 30) = 30 THEN '✅ CORRETO'
            ELSE '❌ ERRO'
        END as resultado;
    
    -- Teste 5: Ontem (deveria ser 0 dias - não pode ser negativo)
    RETURN QUERY SELECT 
        CURRENT_DATE as data_hoje,
        CURRENT_DATE - 1 as data_teste,
        calcular_dias_vencimento(CURRENT_DATE - 1) as dias_calculados,
        0 as dias_esperados,
        CASE 
            WHEN calcular_dias_vencimento(CURRENT_DATE - 1) = 0 THEN '✅ CORRETO'
            ELSE '❌ ERRO'
        END as resultado;
    
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 2. EXECUTAR TESTES
-- =============================================

-- Executar todos os testes
SELECT * FROM testar_calculo_dias();

-- =============================================
-- 3. TESTE ESPECÍFICO DO PROBLEMA RELATADO
-- =============================================

-- Se hoje é dia 25 e colocamos dia 30, deveria ser 5 dias
-- Vamos simular isso
SELECT 
    'Teste específico:' as info,
    CURRENT_DATE as hoje,
    CURRENT_DATE + 5 as dia_30_simulado,
    calcular_dias_vencimento(CURRENT_DATE + 5) as dias_calculados,
    CASE 
        WHEN calcular_dias_vencimento(CURRENT_DATE + 5) = 5 THEN '✅ CORRETO - Deveria ser 5 dias'
        ELSE '❌ ERRO - Deveria ser 5 dias'
    END as resultado;

-- =============================================
-- 4. VERIFICAR CÁLCULO MANUAL
-- =============================================

-- Verificar cálculo manual para comparar
SELECT 
    'Cálculo manual:' as info,
    CURRENT_DATE as hoje,
    CURRENT_DATE + 5 as vencimento,
    (CURRENT_DATE + 5) - CURRENT_DATE as diferenca_dias,
    EXTRACT(DAY FROM ((CURRENT_DATE + 5) - CURRENT_DATE)) as extract_dias;

-- =============================================
-- 5. LIMPAR FUNÇÃO DE TESTE
-- =============================================

-- Remover função de teste após uso
DROP FUNCTION IF EXISTS testar_calculo_dias();




