-- =============================================
-- SINCRONIZAÇÃO SIMPLES FINAL - NOTAS FISCAIS → PAGAMENTOS A RECEBER
-- =============================================
-- Este script implementa a sincronização de forma simples e limpa

-- 1. VERIFICAR ENUMS DISPONÍVEIS
SELECT '=== VERIFICANDO ENUMS ===' as info;

SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('status_pagamento', 'forma_pagamento')
ORDER BY t.typname, e.enumsortorder;

-- 2. CRIAR FUNÇÃO SIMPLES DE SINCRONIZAÇÃO
SELECT '=== CRIANDO FUNÇÃO SIMPLES ===' as info;

CREATE OR REPLACE FUNCTION sync_nota_fiscal_to_pagamento()
RETURNS TRIGGER AS $$
BEGIN
    -- Log simples
    RAISE NOTICE 'Sincronizando nota % para relatório %', NEW.numero_nota, NEW.relatorio_id;
    
    -- Atualizar pagamento se ainda estiver sem forma
    UPDATE pagamentos_receber 
    SET 
        forma_pagamento = 'boleto'::forma_pagamento,
        prazo_data = NEW.data_vencimento,
        prazo_dias = (NEW.data_vencimento - NEW.data_emissao),
        observacoes = COALESCE(observacoes, '') || ' | Nota ' || NEW.numero_nota || ' emitida em ' || NEW.data_emissao::text,
        updated_at = NOW()
    WHERE relatorio_id = NEW.relatorio_id
    AND forma_pagamento = 'sem_forma'::forma_pagamento;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CRIAR TRIGGER SIMPLES
SELECT '=== CRIANDO TRIGGER SIMPLES ===' as info;

CREATE TRIGGER trigger_nota_fiscal_sync
    AFTER INSERT OR UPDATE ON notas_fiscais
    FOR EACH ROW
    EXECUTE FUNCTION sync_nota_fiscal_to_pagamento();

-- 4. ATUALIZAR PAGAMENTOS EXISTENTES
SELECT '=== ATUALIZANDO PAGAMENTOS EXISTENTES ===' as info;

UPDATE pagamentos_receber 
SET 
    forma_pagamento = 'boleto'::forma_pagamento,
    prazo_data = nf.data_vencimento,
    prazo_dias = (nf.data_vencimento - nf.data_emissao),
    observacoes = COALESCE(pagamentos_receber.observacoes, '') || ' | Nota ' || nf.numero_nota || ' emitida em ' || nf.data_emissao::text,
    updated_at = NOW()
FROM notas_fiscais nf
WHERE pagamentos_receber.relatorio_id = nf.relatorio_id
AND pagamentos_receber.forma_pagamento = 'sem_forma'::forma_pagamento;

-- 5. VERIFICAR RESULTADO
SELECT '=== VERIFICANDO RESULTADO ===' as info;

SELECT 
    'Pagamentos com boleto' as status,
    COUNT(*) as quantidade
FROM pagamentos_receber 
WHERE forma_pagamento = 'boleto'::forma_pagamento

UNION ALL

SELECT 
    'Pagamentos sem forma' as status,
    COUNT(*) as quantidade
FROM pagamentos_receber 
WHERE forma_pagamento = 'sem_forma'::forma_pagamento;

-- 6. MOSTRAR EXEMPLOS
SELECT '=== EXEMPLOS DE SINCRONIZAÇÃO ===' as info;

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
LIMIT 5;

-- 7. VERIFICAR TRIGGER CRIADO
SELECT '=== VERIFICANDO TRIGGER CRIADO ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_nota_fiscal_sync';

SELECT '=== SINCRONIZAÇÃO SIMPLES CONFIGURADA ===' as info;
