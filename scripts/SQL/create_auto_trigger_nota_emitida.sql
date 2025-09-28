-- Script para criar trigger automático que move relatórios NOTA_EMITIDA para Pagamentos a receber
-- Este trigger será executado automaticamente quando um relatório mudar para status NOTA_EMITIDA

-- =============================================
-- 1. CRIAR FUNÇÃO PARA PROCESSAR NOTA_EMITIDA
-- =============================================

CREATE OR REPLACE FUNCTION process_nota_emitida_to_pagamentos_receber()
RETURNS TRIGGER AS $$
DECLARE
    cliente_uuid UUID;
    empresa_uuid UUID;
    empresa_tipo_val TEXT;
BEGIN
    -- Só processa se o status mudou para NOTA_EMITIDA
    IF NEW.status = 'NOTA_EMITIDA' AND (OLD.status IS NULL OR OLD.status != 'NOTA_EMITIDA') THEN
        
        -- Busca dados do cliente e empresa do relatório
        SELECT 
            r.client_id,
            r.company_id,
            CASE 
                WHEN c.id IS NOT NULL THEN 'interna'
                WHEN et.id IS NOT NULL THEN 'terceira'
                ELSE 'interna'
            END
        INTO cliente_uuid, empresa_uuid, empresa_tipo_val
        FROM public.reports r
        LEFT JOIN public.companies c ON r.company_id = c.id
        LEFT JOIN public.empresas_terceiras et ON r.company_id = et.id
        WHERE r.id = NEW.id;
        
        -- Verifica se já existe um pagamento para este relatório
        IF NOT EXISTS (
            SELECT 1 FROM public.pagamentos_receber 
            WHERE relatorio_id = NEW.id
        ) THEN
            -- Insere o pagamento
            INSERT INTO public.pagamentos_receber (
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
                NEW.total_value,
                'boleto'::public.forma_pagamento, -- Default para boleto
                CURRENT_DATE + INTERVAL '5 days', -- Default 5 dias
                5,
                'aguardando'::public.status_pagamento,
                'Criado automaticamente quando relatório mudou para NOTA_EMITIDA'
            );
        END IF;
        
        -- Atualiza o status do relatório para AGUARDANDO_PAGAMENTO
        NEW.status := 'AGUARDANDO_PAGAMENTO';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 2. CRIAR TRIGGER
-- =============================================

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_nota_emitida_to_pagamentos_receber ON public.reports;

-- Criar novo trigger
CREATE TRIGGER trigger_nota_emitida_to_pagamentos_receber
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION process_nota_emitida_to_pagamentos_receber();

-- =============================================
-- 3. TESTAR O TRIGGER (OPCIONAL)
-- =============================================

-- Teste: Atualizar um relatório para NOTA_EMITIDA
-- (Descomente para testar)
/*
DO $$
DECLARE
    test_report_id UUID;
    test_payment_id UUID;
BEGIN
    -- Buscar um relatório que não seja NOTA_EMITIDA
    SELECT id INTO test_report_id 
    FROM public.reports 
    WHERE status != 'NOTA_EMITIDA' 
    AND status != 'AGUARDANDO_PAGAMENTO'
    LIMIT 1;
    
    IF test_report_id IS NOT NULL THEN
        -- Atualizar para NOTA_EMITIDA
        UPDATE public.reports 
        SET status = 'NOTA_EMITIDA'
        WHERE id = test_report_id;
        
        -- Verificar se o pagamento foi criado
        SELECT id INTO test_payment_id
        FROM public.pagamentos_receber
        WHERE relatorio_id = test_report_id;
        
        IF test_payment_id IS NOT NULL THEN
            RAISE NOTICE '✅ Trigger funcionando! Pagamento criado: %', test_payment_id;
        ELSE
            RAISE NOTICE '❌ Trigger não funcionou corretamente';
        END IF;
        
        -- Verificar se o status foi atualizado
        IF (SELECT status FROM public.reports WHERE id = test_report_id) = 'AGUARDANDO_PAGAMENTO' THEN
            RAISE NOTICE '✅ Status atualizado para AGUARDANDO_PAGAMENTO';
        ELSE
            RAISE NOTICE '❌ Status não foi atualizado corretamente';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Nenhum relatório encontrado para teste';
    END IF;
END $$;
*/

-- =============================================
-- 4. VERIFICAR TRIGGER CRIADO
-- =============================================

-- Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_nota_emitida_to_pagamentos_receber';

-- Verificar se a função foi criada
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'process_nota_emitida_to_pagamentos_receber';

-- =============================================
-- 5. COMENTÁRIOS EXPLICATIVOS
-- =============================================

COMMENT ON FUNCTION process_nota_emitida_to_pagamentos_receber() IS 'Função que processa automaticamente relatórios que mudam para NOTA_EMITIDA, criando pagamentos a receber e atualizando status para AGUARDANDO_PAGAMENTO';

COMMENT ON TRIGGER trigger_nota_emitida_to_pagamentos_receber ON public.reports IS 'Trigger que executa automaticamente quando um relatório muda para NOTA_EMITIDA, criando um pagamento a receber correspondente';

-- =============================================
-- 6. RESUMO FINAL
-- =============================================

-- Mostrar resumo
SELECT 
  'Trigger automático criado com sucesso!' as status,
  'Agora todos os relatórios que mudarem para NOTA_EMITIDA serão automaticamente movidos para Pagamentos a receber' as funcionalidade,
  'O status do relatório será atualizado para AGUARDANDO_PAGAMENTO' as comportamento;




