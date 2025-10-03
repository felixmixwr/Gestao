-- =============================================
-- SINCRONIZAÇÃO FINAL LIMPA - NOTAS FISCAIS → PAGAMENTOS A RECEBER
-- =============================================
-- Este script implementa a sincronização final sem conflitos

-- 1. VERIFICAR ENUMS DISPONÍVEIS
SELECT '=== VERIFICANDO ENUMS DISPONÍVEIS ===' as info;

SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('status_pagamento', 'forma_pagamento')
ORDER BY t.typname, e.enumsortorder;

-- 2. CRIAR FUNÇÃO DE SINCRONIZAÇÃO FINAL
SELECT '=== CRIANDO FUNÇÃO DE SINCRONIZAÇÃO FINAL ===' as info;

CREATE OR REPLACE FUNCTION sincronizar_nota_fiscal_com_pagamento()
RETURNS TRIGGER AS $$
BEGIN
    -- Log da operação
    RAISE NOTICE 'Sincronizando nota fiscal % com pagamento para relatório ID: %', NEW.numero_nota, NEW.relatorio_id;
    
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
    AND forma_pagamento = 'sem_forma'::forma_pagamento;
    
    -- Log do resultado
    IF FOUND THEN
        RAISE NOTICE 'Pagamento atualizado com sucesso para relatório ID: %', NEW.relatorio_id;
    ELSE
        RAISE NOTICE 'Nenhum pagamento encontrado ou já possui forma de pagamento para relatório ID: %', NEW.relatorio_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CRIAR TRIGGERS FINAIS
SELECT '=== CRIANDO TRIGGERS FINAIS ===' as info;

-- Trigger para inserção de nota fiscal
CREATE TRIGGER trigger_inserir_nota_fiscal_sync
    AFTER INSERT ON notas_fiscais
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_nota_fiscal_com_pagamento();

-- Trigger para atualização de nota fiscal
CREATE TRIGGER trigger_atualizar_nota_fiscal_sync
    AFTER UPDATE ON notas_fiscais
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_nota_fiscal_com_pagamento();

-- 4. ATUALIZAR PAGAMENTOS EXISTENTES COM NOTAS FISCAIS
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

-- 5. VERIFICAR RESULTADO DA SINCRONIZAÇÃO
SELECT '=== VERIFICANDO RESULTADO ===' as info;

SELECT 
    'Pagamentos atualizados para boleto' as status,
    COUNT(*) as quantidade
FROM pagamentos_receber 
WHERE forma_pagamento = 'boleto'::forma_pagamento

UNION ALL

SELECT 
    'Pagamentos ainda sem forma' as status,
    COUNT(*) as quantidade
FROM pagamentos_receber 
WHERE forma_pagamento = 'sem_forma'::forma_pagamento;

-- 6. MOSTRAR EXEMPLOS DE SINCRONIZAÇÃO
SELECT '=== EXEMPLOS DE SINCRONIZAÇÃO ===' as info;

SELECT 
    pr.id as pagamento_id,
    pr.relatorio_id,
    pr.forma_pagamento,
    pr.prazo_data,
    pr.prazo_dias,
    nf.numero_nota,
    nf.data_emissao,
    nf.data_vencimento,
    r.report_number
FROM pagamentos_receber pr
JOIN notas_fiscais nf ON pr.relatorio_id = nf.relatorio_id
JOIN reports r ON pr.relatorio_id = r.id
WHERE pr.forma_pagamento = 'boleto'::forma_pagamento
ORDER BY pr.updated_at DESC
LIMIT 5;

-- 7. VERIFICAR TRIGGERS CRIADOS
SELECT '=== VERIFICANDO TRIGGERS FINAIS ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%nota_fiscal%'
ORDER BY trigger_name;

-- 8. TESTE FINAL
SELECT '=== TESTE FINAL ===' as info;

-- Verificar se há relatórios sem pagamentos que deveriam ter
SELECT 
    'Relatórios com notas fiscais sem pagamentos' as tipo,
    COUNT(*) as quantidade
FROM notas_fiscais nf
LEFT JOIN pagamentos_receber pr ON nf.relatorio_id = pr.relatorio_id
WHERE pr.id IS NULL;

SELECT '=== SINCRONIZAÇÃO FINAL CONFIGURADA COM SUCESSO ===' as info;
