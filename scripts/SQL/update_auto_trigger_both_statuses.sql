-- =============================================
-- Script para criar trigger automático que move relatórios 
-- NOTA_EMITIDA e AGUARDANDO_PAGAMENTO para Pagamentos a receber
-- =============================================

-- 1. CRIAR FUNÇÃO ATUALIZADA PARA AMBOS OS STATUS
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

-- 2. REMOVER TRIGGER ANTIGO SE EXISTIR
DROP TRIGGER IF EXISTS trigger_nota_emitida_to_pagamentos_receber ON reports;
DROP TRIGGER IF EXISTS trigger_reports_to_pagamentos_receber ON reports;

-- 3. CRIAR NOVO TRIGGER
CREATE TRIGGER trigger_reports_to_pagamentos_receber
    AFTER UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION process_reports_to_pagamentos_receber();

-- 4. VERIFICAR SE O TRIGGER FOI CRIADO
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

-- 5. PROCESSAR RELATÓRIOS EXISTENTES COM ESTES STATUS
DO $$
DECLARE
    report_record RECORD;
    processed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔄 Processando relatórios existentes com status NOTA_EMITIDA ou AGUARDANDO_PAGAMENTO...';
    
    -- Processar relatórios NOTA_EMITIDA
    FOR report_record IN 
        SELECT r.id, r.client_id, r.company_id, r.total_value
        FROM reports r
        WHERE r.status = 'NOTA_EMITIDA'
        AND NOT EXISTS (SELECT 1 FROM pagamentos_receber WHERE relatorio_id = r.id)
    LOOP
        INSERT INTO pagamentos_receber (
            relatorio_id, cliente_id, empresa_id, empresa_tipo, valor_total,
            forma_pagamento, prazo_data, prazo_dias, status, observacoes
        ) VALUES (
            report_record.id, report_record.client_id, report_record.company_id,
            'interna', COALESCE(report_record.total_value, 0),
            'sem_forma', CURRENT_DATE + INTERVAL '30 days', 30, 'aguardando',
            'Migrado automaticamente - Nota Fiscal Emitida'
        );
        processed_count := processed_count + 1;
    END LOOP;
    
    -- Processar relatórios AGUARDANDO_PAGAMENTO
    FOR report_record IN 
        SELECT r.id, r.client_id, r.company_id, r.total_value
        FROM reports r
        WHERE r.status = 'AGUARDANDO_PAGAMENTO'
        AND NOT EXISTS (SELECT 1 FROM pagamentos_receber WHERE relatorio_id = r.id)
    LOOP
        INSERT INTO pagamentos_receber (
            relatorio_id, cliente_id, empresa_id, empresa_tipo, valor_total,
            forma_pagamento, prazo_data, prazo_dias, status, observacoes
        ) VALUES (
            report_record.id, report_record.client_id, report_record.company_id,
            'interna', COALESCE(report_record.total_value, 0),
            'sem_forma', CURRENT_DATE + INTERVAL '30 days', 30, 'aguardando',
            'Migrado automaticamente - Aguardando Pagamento'
        );
        processed_count := processed_count + 1;
    END LOOP;
    
    RAISE NOTICE '✅ % relatórios processados e migrados para pagamentos a receber', processed_count;
END $$;

-- 6. VERIFICAR RESULTADOS
DO $$
DECLARE
    nota_emitida_count INTEGER;
    aguardando_count INTEGER;
    total_pagamentos INTEGER;
BEGIN
    SELECT COUNT(*) INTO nota_emitida_count FROM reports WHERE status = 'NOTA_EMITIDA';
    SELECT COUNT(*) INTO aguardando_count FROM reports WHERE status = 'AGUARDANDO_PAGAMENTO';
    SELECT COUNT(*) INTO total_pagamentos FROM pagamentos_receber;
    
    RAISE NOTICE '📊 Relatórios NOTA_EMITIDA: %', nota_emitida_count;
    RAISE NOTICE '📊 Relatórios AGUARDANDO_PAGAMENTO: %', aguardando_count;
    RAISE NOTICE '📊 Total de pagamentos a receber: %', total_pagamentos;
END $$;

-- 7. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '🎉 Script executado com sucesso!';
    RAISE NOTICE '💡 Agora, quando um relatório for marcado como NOTA_EMITIDA ou AGUARDANDO_PAGAMENTO, será automaticamente criado um pagamento a receber';
END $$;
