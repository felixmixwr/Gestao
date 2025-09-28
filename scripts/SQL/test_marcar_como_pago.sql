-- =============================================
-- Script de teste para verificar "Marcar como pago"
-- =============================================

-- 1. Verificar estrutura da tabela pagamentos_receber
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando estrutura da tabela pagamentos_receber...';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pagamentos_receber'
    ) THEN
        RAISE NOTICE '✅ Tabela pagamentos_receber existe';
    ELSE
        RAISE NOTICE '❌ Tabela pagamentos_receber NÃO existe';
    END IF;
END $$;

-- 2. Verificar se existe pelo menos um pagamento para testar
DO $$
DECLARE
    pagamento_count INTEGER;
    rec RECORD;
BEGIN
    SELECT COUNT(*) INTO pagamento_count FROM pagamentos_receber;
    
    IF pagamento_count > 0 THEN
        RAISE NOTICE '✅ Existem % pagamentos na tabela', pagamento_count;
        
        -- Mostrar alguns exemplos
        RAISE NOTICE '📋 Exemplos de pagamentos:';
        
        FOR rec IN 
            SELECT id, status, valor_total, forma_pagamento
            FROM pagamentos_receber 
            ORDER BY created_at DESC 
            LIMIT 3
        LOOP
            RAISE NOTICE '  - ID: %, Status: %, Valor: %, Forma: %', 
                rec.id, rec.status, rec.valor_total, rec.forma_pagamento;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ Nenhum pagamento encontrado na tabela';
    END IF;
END $$;

-- 3. Verificar se podemos atualizar um pagamento para "pago"
DO $$
DECLARE
    test_id UUID;
    update_result RECORD;
BEGIN
    -- Buscar um pagamento que não esteja "pago"
    SELECT id INTO test_id 
    FROM pagamentos_receber 
    WHERE status != 'pago' 
    LIMIT 1;
    
    IF test_id IS NOT NULL THEN
        RAISE NOTICE '🧪 Testando atualização para "pago" no ID: %', test_id;
        
        -- Tentar atualizar
        UPDATE pagamentos_receber 
        SET status = 'pago', 
            observacoes = 'Teste automático - ' || CURRENT_TIMESTAMP
        WHERE id = test_id;
        
        -- Verificar se foi atualizado
        SELECT * INTO update_result FROM pagamentos_receber WHERE id = test_id;
        
        IF update_result.status = 'pago' THEN
            RAISE NOTICE '✅ Teste bem-sucedido! Status atualizado para: %', update_result.status;
            RAISE NOTICE '✅ Observação: %', update_result.observacoes;
        ELSE
            RAISE NOTICE '❌ Falha no teste. Status atual: %', update_result.status;
        END IF;
        
        -- Reverter para o estado original (opcional)
        -- UPDATE pagamentos_receber SET status = 'aguardando' WHERE id = test_id;
        
    ELSE
        RAISE NOTICE '❌ Nenhum pagamento encontrado para teste (todos já estão "pago")';
    END IF;
END $$;

-- 4. Verificar valores válidos do enum status_pagamento
DO $$
DECLARE
    enum_value RECORD;
BEGIN
    RAISE NOTICE '📋 Valores válidos do enum status_pagamento:';
    
    FOR enum_value IN 
        SELECT enumlabel, enumsortorder
        FROM pg_enum 
        WHERE enumtypid = 'public.status_pagamento'::regtype
        ORDER BY enumsortorder
    LOOP
        RAISE NOTICE '  - %', enum_value.enumlabel;
    END LOOP;
END $$;

-- 5. Contar pagamentos por status
DO $$
DECLARE
    status_count RECORD;
BEGIN
    RAISE NOTICE '📊 Contagem de pagamentos por status:';
    
    FOR status_count IN 
        SELECT status, COUNT(*) as total
        FROM pagamentos_receber
        GROUP BY status
        ORDER BY total DESC
    LOOP
        RAISE NOTICE '  - %: % pagamentos', status_count.status, status_count.total;
    END LOOP;
END $$;

-- 6. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '🎉 Teste concluído!';
END $$;
