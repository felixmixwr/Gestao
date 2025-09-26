-- =============================================
-- Script consolidado para configurar "sem_forma" de pagamento
-- =============================================

-- 1. Adicionar novo valor ao enum forma_pagamento
ALTER TYPE public.forma_pagamento ADD VALUE IF NOT EXISTS 'sem_forma';

-- 2. Verificar se foi adicionado
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'public.forma_pagamento'::regtype 
        AND enumlabel = 'sem_forma'
    ) THEN
        RAISE NOTICE '✅ Valor "sem_forma" adicionado com sucesso ao enum forma_pagamento';
    ELSE
        RAISE NOTICE '❌ Erro ao adicionar valor "sem_forma" ao enum forma_pagamento';
    END IF;
END $$;

-- 3. Atualizar trigger para usar 'sem_forma' como padrão
CREATE OR REPLACE FUNCTION process_reports_to_pagamentos_receber()
RETURNS TRIGGER AS $$
DECLARE
    cliente_uuid UUID;
    empresa_uuid UUID;
    empresa_tipo_val TEXT;
BEGIN
    -- Processa se o status mudou para NOTA_EMITIDA ou AGUARDANDO_PAGAMENTO
    IF (NEW.status = 'NOTA_EMITIDA' OR NEW.status = 'AGUARDANDO_PAGAMENTO') 
       AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
        
        -- Busca dados do cliente e empresa do relatório
        SELECT 
            r.client_id,
            r.company_id
        INTO cliente_uuid, empresa_uuid
        FROM reports r
        WHERE r.id = NEW.id;
        
        -- Definir tipo da empresa como 'interna' por padrão
        empresa_tipo_val := 'interna';
        
        -- Verifica se já existe um pagamento para este relatório
        IF NOT EXISTS (
            SELECT 1 FROM pagamentos_receber 
            WHERE relatorio_id = NEW.id
        ) THEN
            
            -- Insere novo pagamento a receber
            INSERT INTO pagamentos_receber (
                relatorio_id,
                cliente_id,
                empresa_id,
                empresa_tipo,
                valor_total,
                forma_pagamento,
                prazo_data,
                prazo_dias,
                status,
                observacoes
            ) VALUES (
                NEW.id,
                cliente_uuid,
                empresa_uuid,
                empresa_tipo_val,
                COALESCE(NEW.total_value, 0),
                'sem_forma', -- Sem forma de pagamento definida
                CURRENT_DATE + INTERVAL '30 days', -- Prazo padrão de 30 dias
                30,
                'aguardando',
                CASE 
                    WHEN NEW.status = 'NOTA_EMITIDA' THEN 'Gerado automaticamente - Nota Fiscal Emitida'
                    WHEN NEW.status = 'AGUARDANDO_PAGAMENTO' THEN 'Gerado automaticamente - Aguardando Pagamento'
                    ELSE 'Gerado automaticamente'
                END
            );
            
            RAISE NOTICE 'Pagamento a receber criado automaticamente para relatório % com status %', NEW.id, NEW.status;
        ELSE
            RAISE NOTICE 'Pagamento a receber já existe para relatório %', NEW.id;
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recriar trigger
DROP TRIGGER IF EXISTS trigger_reports_to_pagamentos_receber ON reports;
CREATE TRIGGER trigger_reports_to_pagamentos_receber
    AFTER UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION process_reports_to_pagamentos_receber();

-- 5. Verificar se o trigger foi criado
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_reports_to_pagamentos_receber'
    ) THEN
        RAISE NOTICE '✅ Trigger trigger_reports_to_pagamentos_receber criado com sucesso';
    ELSE
        RAISE NOTICE '❌ Erro ao criar trigger trigger_reports_to_pagamentos_receber';
    END IF;
END $$;

-- 6. Listar todos os valores do enum
DO $$
DECLARE
    enum_value RECORD;
BEGIN
    RAISE NOTICE '📋 Valores disponíveis no enum forma_pagamento:';
    
    FOR enum_value IN 
        SELECT enumlabel, enumsortorder
        FROM pg_enum 
        WHERE enumtypid = 'public.forma_pagamento'::regtype
        ORDER BY enumsortorder
    LOOP
        RAISE NOTICE '  - %', enum_value.enumlabel;
    END LOOP;
END $$;

-- 7. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '🎉 Configuração completa!';
    RAISE NOTICE '💡 Agora os pagamentos chegarão com "sem_forma" e poderão ser atualizados via interface';
END $$;

