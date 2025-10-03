-- =============================================
-- SINCRONIZAÇÃO AUTOMÁTICA NOTAS FISCAIS → PAGAMENTOS A RECEBER (CORRIGIDA)
-- =============================================
-- Este script cria a sincronização automática com valores corretos do enum

-- 1. VERIFICAR ENUMS ANTES DE CONTINUAR
SELECT '=== VERIFICANDO ENUMS ===' as info;

SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('status_pagamento', 'forma_pagamento')
ORDER BY t.typname, e.enumsortorder;

-- 2. CRIAR FUNÇÃO DE SINCRONIZAÇÃO CORRIGIDA
SELECT '=== CRIANDO FUNÇÃO DE SINCRONIZAÇÃO CORRIGIDA ===' as info;

CREATE OR REPLACE FUNCTION sincronizar_pagamento_com_nota_fiscal_v2()
RETURNS TRIGGER AS $$
BEGIN
    -- Log da operação
    RAISE NOTICE 'Sincronizando pagamento para relatório ID: %', NEW.relatorio_id;
    
    -- Atualizar pagamento a receber correspondente
    UPDATE pagamentos_receber 
    SET 
        forma_pagamento = 'boleto'::forma_pagamento,
        prazo_data = NEW.data_vencimento,
        prazo_dias = (NEW.data_vencimento - NEW.data_emissao),
        observacoes = COALESCE(observacoes, '') || 
                     CASE 
                         WHEN observacoes IS NOT NULL AND observacoes != '' 
                         THEN ' | ' 
                         ELSE '' 
                     END ||
                     'Nota fiscal ' || NEW.numero_nota || ' emitida em ' || 
                     NEW.data_emissao::text || ' - Vencimento: ' || NEW.data_vencimento::text,
        updated_at = NOW()
    WHERE relatorio_id = NEW.relatorio_id
    AND forma_pagamento = 'sem_forma'::forma_pagamento; -- Só atualiza se ainda estiver sem forma
    
    -- Log do resultado
    IF FOUND THEN
        RAISE NOTICE 'Pagamento atualizado com sucesso para relatório ID: %', NEW.relatorio_id;
    ELSE
        RAISE NOTICE 'Nenhum pagamento encontrado ou já possui forma de pagamento para relatório ID: %', NEW.relatorio_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. REMOVER TRIGGERS EXISTENTES PROBLEMÁTICOS
SELECT '=== REMOVENDO TRIGGERS PROBLEMÁTICOS ===' as info;

DROP TRIGGER IF EXISTS trigger_sincronizar_pagamento_nota_fiscal ON notas_fiscais;
DROP TRIGGER IF EXISTS trigger_atualizar_pagamento_nota_fiscal ON notas_fiscais;

-- 4. CRIAR NOVOS TRIGGERS CORRIGIDOS
SELECT '=== CRIANDO TRIGGERS CORRIGIDOS ===' as info;

-- Trigger para inserção
CREATE TRIGGER trigger_sincronizar_pagamento_nota_fiscal_v2
    AFTER INSERT ON notas_fiscais
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_pagamento_com_nota_fiscal_v2();

-- Trigger para atualização
CREATE TRIGGER trigger_atualizar_pagamento_nota_fiscal_v2
    AFTER UPDATE ON notas_fiscais
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_pagamento_com_nota_fiscal_v2();

-- 5. ATUALIZAR PAGAMENTOS EXISTENTES COM NOTAS FISCAIS
SELECT '=== ATUALIZANDO PAGAMENTOS EXISTENTES ===' as info;

UPDATE pagamentos_receber 
SET 
    forma_pagamento = 'boleto'::forma_pagamento,
    prazo_data = nf.data_vencimento,
    prazo_dias = (nf.data_vencimento - nf.data_emissao),
    observacoes = COALESCE(pagamentos_receber.observacoes, '') || 
                 CASE 
                     WHEN pagamentos_receber.observacoes IS NOT NULL AND pagamentos_receber.observacoes != '' 
                     THEN ' | ' 
                     ELSE '' 
                 END ||
                 'Nota fiscal ' || nf.numero_nota || ' emitida em ' || 
                 nf.data_emissao::text || ' - Vencimento: ' || nf.data_vencimento::text,
    updated_at = NOW()
FROM notas_fiscais nf
WHERE pagamentos_receber.relatorio_id = nf.relatorio_id
AND pagamentos_receber.forma_pagamento = 'sem_forma'::forma_pagamento;

-- 6. VERIFICAR RESULTADO
SELECT '=== VERIFICANDO RESULTADO ===' as info;

SELECT 
    pr.id,
    pr.relatorio_id,
    pr.forma_pagamento,
    pr.prazo_data,
    pr.prazo_dias,
    nf.numero_nota,
    nf.data_emissao,
    nf.data_vencimento
FROM pagamentos_receber pr
JOIN notas_fiscais nf ON pr.relatorio_id = nf.relatorio_id
WHERE pr.forma_pagamento = 'boleto'::forma_pagamento
ORDER BY pr.updated_at DESC
LIMIT 10;

-- 7. VERIFICAR TRIGGERS CRIADOS
SELECT '=== VERIFICANDO TRIGGERS CRIADOS ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name LIKE '%nota_fiscal%'
ORDER BY trigger_name;

-- 8. TESTAR SINCRONIZAÇÃO
SELECT '=== TESTANDO SINCRONIZAÇÃO ===' as info;

-- Verificar quantos pagamentos foram atualizados
SELECT 
    'Pagamentos atualizados para boleto' as tipo,
    COUNT(*) as quantidade
FROM pagamentos_receber 
WHERE forma_pagamento = 'boleto'::forma_pagamento;

SELECT 
    'Pagamentos ainda sem forma' as tipo,
    COUNT(*) as quantidade
FROM pagamentos_receber 
WHERE forma_pagamento = 'sem_forma'::forma_pagamento;

SELECT '=== SINCRONIZAÇÃO CORRIGIDA E CONFIGURADA ===' as info;
