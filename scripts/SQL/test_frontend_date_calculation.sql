-- Script para testar o cálculo de datas no frontend
-- Simular o mesmo cálculo que o JavaScript faz

-- =============================================
-- 1. TESTAR CÁLCULO SIMULANDO O FRONTEND
-- =============================================

-- Função para simular o cálculo do frontend
CREATE OR REPLACE FUNCTION simular_calculo_frontend(p_data_vencimento DATE)
RETURNS INT AS $$
DECLARE
    hoje_str TEXT;
    vencimento_str TEXT;
    hoje_date TIMESTAMP;
    vencimento_date TIMESTAMP;
    diff_time BIGINT;
    diff_days INT;
BEGIN
    -- Simular: new Date().toISOString().split('T')[0]
    hoje_str := CURRENT_DATE::TEXT;
    
    -- Simular: formData.prazo_data (já está no formato YYYY-MM-DD)
    vencimento_str := p_data_vencimento::TEXT;
    
    -- Simular: new Date(hoje + 'T00:00:00')
    hoje_date := (hoje_str || 'T00:00:00')::TIMESTAMP;
    
    -- Simular: new Date(dataVencimento + 'T00:00:00')
    vencimento_date := (vencimento_str || 'T00:00:00')::TIMESTAMP;
    
    -- Simular: diffTime = vencimentoDate.getTime() - hojeDate.getTime()
    diff_time := EXTRACT(EPOCH FROM (vencimento_date - hoje_date)) * 1000;
    
    -- Simular: Math.round(diffTime / (1000 * 60 * 60 * 24))
    diff_days := ROUND(diff_time / (1000 * 60 * 60 * 24));
    
    RETURN diff_days;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 2. TESTAR DIFERENTES CENÁRIOS
-- =============================================

-- Teste 1: Hoje (deveria ser 0 dias)
SELECT 
    'Hoje (Frontend):' as cenario,
    CURRENT_DATE as data_teste,
    simular_calculo_frontend(CURRENT_DATE) as dias_calculados,
    CASE 
        WHEN simular_calculo_frontend(CURRENT_DATE) = 0 THEN '✅ CORRETO'
        ELSE '❌ ERRO'
    END as resultado;

-- Teste 2: Amanhã (deveria ser 1 dia)
SELECT 
    'Amanhã (Frontend):' as cenario,
    CURRENT_DATE + 1 as data_teste,
    simular_calculo_frontend(CURRENT_DATE + 1) as dias_calculados,
    CASE 
        WHEN simular_calculo_frontend(CURRENT_DATE + 1) = 1 THEN '✅ CORRETO'
        ELSE '❌ ERRO'
    END as resultado;

-- Teste 3: Em 5 dias (deveria ser 5 dias)
SELECT 
    'Em 5 dias (Frontend):' as cenario,
    CURRENT_DATE + 5 as data_teste,
    simular_calculo_frontend(CURRENT_DATE + 5) as dias_calculados,
    CASE 
        WHEN simular_calculo_frontend(CURRENT_DATE + 5) = 5 THEN '✅ CORRETO'
        ELSE '❌ ERRO'
    END as resultado;

-- Teste 4: Ontem (deveria ser -1 dia)
SELECT 
    'Ontem (Frontend):' as cenario,
    CURRENT_DATE - 1 as data_teste,
    simular_calculo_frontend(CURRENT_DATE - 1) as dias_calculados,
    CASE 
        WHEN simular_calculo_frontend(CURRENT_DATE - 1) = -1 THEN '✅ CORRETO'
        ELSE '❌ ERRO'
    END as resultado;

-- =============================================
-- 3. COMPARAR COM FUNÇÃO SQL ORIGINAL
-- =============================================

-- Comparar cálculo frontend vs SQL
SELECT 
    'Comparação:' as info,
    CURRENT_DATE as hoje,
    CURRENT_DATE + 5 as vencimento,
    simular_calculo_frontend(CURRENT_DATE + 5) as frontend_dias,
    calcular_dias_vencimento(CURRENT_DATE + 5) as sql_dias,
    CASE 
        WHEN simular_calculo_frontend(CURRENT_DATE + 5) = calcular_dias_vencimento(CURRENT_DATE + 5) THEN '✅ IGUAIS'
        ELSE '❌ DIFERENTES'
    END as resultado;

-- =============================================
-- 4. TESTE ESPECÍFICO DO PROBLEMA
-- =============================================

-- Se hoje é 25/09 e vencimento é 25/09, deveria ser 0 dias
SELECT 
    'Problema específico:' as info,
    CURRENT_DATE as hoje,
    CURRENT_DATE as vencimento_hoje,
    simular_calculo_frontend(CURRENT_DATE) as dias_calculados,
    CASE 
        WHEN simular_calculo_frontend(CURRENT_DATE) = 0 THEN '✅ CORRETO - Deveria ser 0 dias (vence hoje)'
        ELSE '❌ ERRO - Deveria ser 0 dias (vence hoje)'
    END as resultado;

-- =============================================
-- 5. LIMPAR FUNÇÃO DE TESTE
-- =============================================

-- Remover função de teste após uso
DROP FUNCTION IF EXISTS simular_calculo_frontend(DATE);




