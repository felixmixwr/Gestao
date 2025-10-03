-- =============================================
-- SINCRONIZAÇÃO AUTOMÁTICA NOTAS FISCAIS → PAGAMENTOS A RECEBER
-- =============================================
-- Este script cria a sincronização automática entre notas fiscais e pagamentos

-- 1. VERIFICAR ESTRUTURA ATUAL
SELECT '=== VERIFICANDO ESTRUTURA ATUAL ===' as info;

-- Verificar campos da tabela notas_fiscais
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar campos da tabela pagamentos_receber
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'pagamentos_receber' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. CRIAR FUNÇÃO DE SINCRONIZAÇÃO
SELECT '=== CRIANDO FUNÇÃO DE SINCRONIZAÇÃO ===' as info;

CREATE OR REPLACE FUNCTION sincronizar_pagamento_com_nota_fiscal()
RETURNS TRIGGER AS $$
BEGIN
    -- Log da operação
    RAISE NOTICE 'Sincronizando pagamento para relatório ID: %', NEW.relatorio_id;
    
    -- Atualizar pagamento a receber correspondente
    UPDATE pagamentos_receber 
    SET 
        forma_pagamento = 'boleto',
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
    AND forma_pagamento = 'sem_forma'; -- Só atualiza se ainda estiver sem forma
    
    -- Log do resultado
    IF FOUND THEN
        RAISE NOTICE 'Pagamento atualizado com sucesso para relatório ID: %', NEW.relatorio_id;
    ELSE
        RAISE NOTICE 'Nenhum pagamento encontrado ou já possui forma de pagamento para relatório ID: %', NEW.relatorio_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CRIAR TRIGGER PARA INSERÇÃO DE NOTAS FISCAIS
SELECT '=== CRIANDO TRIGGER DE INSERÇÃO ===' as info;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_sincronizar_pagamento_nota_fiscal ON notas_fiscais;

-- Criar trigger
CREATE TRIGGER trigger_sincronizar_pagamento_nota_fiscal
    AFTER INSERT ON notas_fiscais
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_pagamento_com_nota_fiscal();

-- 4. CRIAR TRIGGER PARA ATUALIZAÇÃO DE NOTAS FISCAIS
SELECT '=== CRIANDO TRIGGER DE ATUALIZAÇÃO ===' as info;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_atualizar_pagamento_nota_fiscal ON notas_fiscais;

-- Criar trigger
CREATE TRIGGER trigger_atualizar_pagamento_nota_fiscal
    AFTER UPDATE ON notas_fiscais
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_pagamento_com_nota_fiscal();

-- 5. TESTAR A SINCRONIZAÇÃO COM DADOS EXISTENTES
SELECT '=== TESTANDO SINCRONIZAÇÃO COM DADOS EXISTENTES ===' as info;

-- Verificar notas fiscais existentes
SELECT 
    nf.id,
    nf.relatorio_id,
    nf.numero_nota,
    nf.data_emissao,
    nf.data_vencimento,
    pr.id as pagamento_id,
    pr.forma_pagamento,
    pr.prazo_data
FROM notas_fiscais nf
LEFT JOIN pagamentos_receber pr ON nf.relatorio_id = pr.relatorio_id
ORDER BY nf.data_emissao DESC
LIMIT 10;

-- 6. ATUALIZAR PAGAMENTOS EXISTENTES QUE TÊM NOTAS FISCAIS
SELECT '=== ATUALIZANDO PAGAMENTOS EXISTENTES ===' as info;

UPDATE pagamentos_receber 
SET 
    forma_pagamento = 'boleto',
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
AND pagamentos_receber.forma_pagamento = 'sem_forma';

-- 7. VERIFICAR RESULTADO DA ATUALIZAÇÃO
SELECT '=== VERIFICANDO RESULTADO ===' as info;

SELECT 
    pr.id,
    pr.relatorio_id,
    pr.forma_pagamento,
    pr.prazo_data,
    pr.observacoes,
    nf.numero_nota,
    nf.data_emissao,
    nf.data_vencimento
FROM pagamentos_receber pr
JOIN notas_fiscais nf ON pr.relatorio_id = nf.relatorio_id
WHERE pr.forma_pagamento = 'boleto'
ORDER BY pr.updated_at DESC
LIMIT 10;

-- 8. CRIAR FUNÇÃO PARA TESTE MANUAL
SELECT '=== CRIANDO FUNÇÃO DE TESTE MANUAL ===' as info;

CREATE OR REPLACE FUNCTION testar_sincronizacao_nota_fiscal(relatorio_id_param UUID)
RETURNS TABLE(
    relatorio_id UUID,
    nota_numero VARCHAR,
    data_emissao DATE,
    data_vencimento DATE,
    pagamento_id UUID,
    forma_pagamento forma_pagamento,
    prazo_data DATE,
    sincronizado BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        nf.relatorio_id,
        nf.numero_nota,
        nf.data_emissao,
        nf.data_vencimento,
        pr.id,
        pr.forma_pagamento,
        pr.prazo_data,
        (pr.forma_pagamento = 'boleto' AND pr.prazo_data = nf.data_vencimento) as sincronizado
    FROM notas_fiscais nf
    LEFT JOIN pagamentos_receber pr ON nf.relatorio_id = pr.relatorio_id
    WHERE nf.relatorio_id = relatorio_id_param;
END;
$$ LANGUAGE plpgsql;

-- 9. TESTAR COM UM RELATÓRIO ESPECÍFICO
SELECT '=== TESTANDO SINCRONIZAÇÃO MANUAL ===' as info;

-- Exemplo de uso da função de teste
-- SELECT * FROM testar_sincronizacao_nota_fiscal('UUID_DO_RELATORIO_AQUI');

-- 10. VERIFICAR TRIGGERS CRIADOS
SELECT '=== VERIFICANDO TRIGGERS CRIADOS ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%nota_fiscal%'
ORDER BY trigger_name;

SELECT '=== SINCRONIZAÇÃO AUTOMÁTICA CONFIGURADA ===' as info;
