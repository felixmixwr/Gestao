-- =============================================
-- Script para verificar se o pagamento foi realmente atualizado
-- =============================================

-- 1. Verificar o pagamento específico que foi "marcado como pago"
DO $$
DECLARE
    payment_record RECORD;
BEGIN
    RAISE NOTICE '🔍 Verificando pagamento ID: f259c024-a339-4b5d-8263-dd15df6f89da';
    
    SELECT * INTO payment_record 
    FROM pagamentos_receber 
    WHERE id = 'f259c024-a339-4b5d-8263-dd15df6f89da';
    
    IF FOUND THEN
        RAISE NOTICE '✅ Pagamento encontrado:';
        RAISE NOTICE '  - ID: %', payment_record.id;
        RAISE NOTICE '  - Status: %', payment_record.status;
        RAISE NOTICE '  - Valor: %', payment_record.valor_total;
        RAISE NOTICE '  - Forma de Pagamento: %', payment_record.forma_pagamento;
        RAISE NOTICE '  - Observações: %', payment_record.observacoes;
        RAISE NOTICE '  - Atualizado em: %', payment_record.updated_at;
        RAISE NOTICE '  - Criado em: %', payment_record.created_at;
        
        IF payment_record.status = 'pago' THEN
            RAISE NOTICE '✅ Status está correto: PAGO';
        ELSE
            RAISE NOTICE '❌ Status NÃO está como "pago": %', payment_record.status;
        END IF;
    ELSE
        RAISE NOTICE '❌ Pagamento NÃO encontrado com este ID';
    END IF;
END $$;

-- 2. Verificar todos os pagamentos com status "pago"
DO $$
DECLARE
    pagos_count INTEGER;
    rec RECORD;
BEGIN
    SELECT COUNT(*) INTO pagos_count FROM pagamentos_receber WHERE status = 'pago';
    
    RAISE NOTICE '📊 Total de pagamentos com status "pago": %', pagos_count;
    
    IF pagos_count > 0 THEN
        RAISE NOTICE '📋 Lista de pagamentos "pagos":';
        
        FOR rec IN 
            SELECT id, status, valor_total, updated_at, observacoes
            FROM pagamentos_receber 
            WHERE status = 'pago'
            ORDER BY updated_at DESC
        LOOP
            RAISE NOTICE '  - ID: %, Valor: %, Atualizado: %, Obs: %', 
                rec.id, rec.valor_total, rec.updated_at, rec.observacoes;
        END LOOP;
    END IF;
END $$;

-- 3. Verificar se há algum problema com a view ou cache
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando se existe view_pagamentos_receber_completo:';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'view_pagamentos_receber_completo'
    ) THEN
        RAISE NOTICE '✅ View view_pagamentos_receber_completo existe';
        
        -- Verificar se o pagamento aparece na view
        IF EXISTS (
            SELECT 1 FROM view_pagamentos_receber_completo 
            WHERE id = 'f259c024-a339-4b5d-8263-dd15df6f89da'
        ) THEN
            RAISE NOTICE '✅ Pagamento aparece na view';
        ELSE
            RAISE NOTICE '❌ Pagamento NÃO aparece na view';
        END IF;
    ELSE
        RAISE NOTICE '❌ View view_pagamentos_receber_completo NÃO existe';
    END IF;
END $$;

-- 4. Verificar timestamps para ver se foi realmente atualizado
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '🕐 Verificando timestamps recentes (últimas 24h):';
    
    FOR rec IN 
        SELECT id, status, updated_at, created_at
        FROM pagamentos_receber 
        WHERE updated_at >= NOW() - INTERVAL '24 hours'
        ORDER BY updated_at DESC
        LIMIT 5
    LOOP
        RAISE NOTICE '  - ID: %, Status: %, Atualizado: %, Criado: %', 
            rec.id, rec.status, rec.updated_at, rec.created_at;
    END LOOP;
END $$;

-- 5. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '🎉 Verificação concluída!';
    RAISE NOTICE '💡 Se o status não está como "pago", pode ser um problema de transação ou RLS';
END $$;



