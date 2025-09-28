-- scripts/SQL/test_direct_update.sql
-- =============================================
-- Script para testar atualização direta no banco
-- =============================================

-- 1. Verificar pagamento específico antes da atualização
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '🔍 Verificando pagamento específico ANTES da atualização...';
    
    SELECT * INTO rec 
    FROM pagamentos_receber 
    WHERE id = 'f259c024-a339-4b5d-8263-dd15df6f89da';
    
    IF rec IS NOT NULL THEN
        RAISE NOTICE '📋 Pagamento encontrado:';
        RAISE NOTICE '  - ID: %', rec.id;
        RAISE NOTICE '  - Status: %', rec.status;
        RAISE NOTICE '  - Valor: %', rec.valor_total;
        RAISE NOTICE '  - Forma: %', rec.forma_pagamento;
        RAISE NOTICE '  - Updated: %', rec.updated_at;
    ELSE
        RAISE NOTICE '❌ Pagamento não encontrado';
    END IF;
END $$;

-- 2. Atualizar diretamente para "pago"
DO $$
DECLARE
    update_count INTEGER;
BEGIN
    RAISE NOTICE '🔄 Atualizando status para "pago"...';
    
    UPDATE pagamentos_receber 
    SET status = 'pago',
        observacoes = 'Teste direto - ' || CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 'f259c024-a339-4b5d-8263-dd15df6f89da';
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    IF update_count > 0 THEN
        RAISE NOTICE '✅ % linha(s) atualizada(s)', update_count;
    ELSE
        RAISE NOTICE '❌ Nenhuma linha foi atualizada';
    END IF;
END $$;

-- 3. Verificar pagamento específico após a atualização
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '🔍 Verificando pagamento específico APÓS a atualização...';
    
    SELECT * INTO rec 
    FROM pagamentos_receber 
    WHERE id = 'f259c024-a339-4b5d-8263-dd15df6f89da';
    
    IF rec IS NOT NULL THEN
        RAISE NOTICE '📋 Pagamento após atualização:';
        RAISE NOTICE '  - ID: %', rec.id;
        RAISE NOTICE '  - Status: %', rec.status;
        RAISE NOTICE '  - Valor: %', rec.valor_total;
        RAISE NOTICE '  - Forma: %', rec.forma_pagamento;
        RAISE NOTICE '  - Observações: %', rec.observacoes;
        RAISE NOTICE '  - Updated: %', rec.updated_at;
        
        IF rec.status = 'pago' THEN
            RAISE NOTICE '✅ Status atualizado com sucesso para "pago"';
        ELSE
            RAISE NOTICE '❌ Status ainda não é "pago": %', rec.status;
        END IF;
    ELSE
        RAISE NOTICE '❌ Pagamento não encontrado após atualização';
    END IF;
END $$;

-- 4. Verificar se a view também foi atualizada
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '🔍 Verificando view_pagamentos_receber_completo...';
    
    SELECT * INTO rec 
    FROM view_pagamentos_receber_completo 
    WHERE id = 'f259c024-a339-4b5d-8263-dd15df6f89da';
    
    IF rec IS NOT NULL THEN
        RAISE NOTICE '📋 View após atualização:';
        RAISE NOTICE '  - ID: %', rec.id;
        RAISE NOTICE '  - Status: %', rec.status;
        RAISE NOTICE '  - Valor: %', rec.valor_total;
        RAISE NOTICE '  - Forma: %', rec.forma_pagamento;
        RAISE NOTICE '  - Updated: %', rec.updated_at;
        
        IF rec.status = 'pago' THEN
            RAISE NOTICE '✅ View também foi atualizada para "pago"';
        ELSE
            RAISE NOTICE '❌ View ainda não reflete "pago": %', rec.status;
        END IF;
    ELSE
        RAISE NOTICE '❌ Pagamento não encontrado na view';
    END IF;
END $$;

-- 5. Contar pagamentos por status
DO $$
DECLARE
    status_count RECORD;
BEGIN
    RAISE NOTICE '📊 Contagem final por status:';
    
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
    RAISE NOTICE '🎉 Teste de atualização direta concluído!';
END $$;



