-- =============================================
-- CORREÇÃO: FUNÇÃO FALTANTE PARA TRIGGERS
-- =============================================
-- Este script adiciona a função que está faltando para os triggers funcionarem

-- 1. CRIAR FUNÇÃO PARA SINCRONIZAR STATUS ENTRE PAGAMENTOS E RELATÓRIOS
CREATE OR REPLACE FUNCTION sincronizar_status_pagamento_relatorio()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o pagamento foi marcado como pago, atualizar o relatório
    IF NEW.status = 'pago' AND (OLD.status IS NULL OR OLD.status != 'pago') THEN
        UPDATE reports 
        SET 
            status = 'PAGO',
            updated_at = NOW()
        WHERE id = NEW.relatorio_id;
        
        RAISE NOTICE 'Relatório % marcado como PAGO devido ao pagamento %', NEW.relatorio_id, NEW.id;
    END IF;
    
    -- Se o relatório foi marcado como pago, atualizar o pagamento
    IF NEW.status = 'PAGO' AND (OLD.status IS NULL OR OLD.status != 'PAGO') THEN
        UPDATE pagamentos_receber 
        SET 
            status = 'pago',
            updated_at = NOW(),
            observacoes = COALESCE(observacoes, '') || ' | Sincronizado automaticamente do relatório'
        WHERE relatorio_id = NEW.id;
        
        RAISE NOTICE 'Pagamento % marcado como pago devido ao relatório %', NEW.id, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. CRIAR FUNÇÃO PARA ATUALIZAR STATUS BASEADO EM DATAS
CREATE OR REPLACE FUNCTION atualizar_status_automatico_pagamentos()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar status baseado na data de vencimento
    IF NEW.prazo_data IS NOT NULL THEN
        IF NEW.prazo_data < CURRENT_DATE AND NEW.status = 'aguardando' THEN
            NEW.status = 'vencido';
            NEW.observacoes = COALESCE(NEW.observacoes, '') || ' | Status atualizado automaticamente para vencido';
        ELSIF NEW.prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND NEW.status = 'aguardando' THEN
            NEW.status = 'proximo_vencimento';
            NEW.observacoes = COALESCE(NEW.observacoes, '') || ' | Status atualizado automaticamente para próximo vencimento';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. VERIFICAÇÃO DAS FUNÇÕES CRIADAS
SELECT '=== FUNÇÕES CRIADAS COM SUCESSO ===' as info;

SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'sincronizar_status_pagamento_relatorio',
    'atualizar_status_automatico_pagamentos',
    'criar_pagamento_automatico_integrado'
)
ORDER BY routine_name;

-- 4. COMENTÁRIOS EXPLICATIVOS
COMMENT ON FUNCTION sincronizar_status_pagamento_relatorio() IS 'Função para sincronizar status entre pagamentos e relatórios';
COMMENT ON FUNCTION atualizar_status_automatico_pagamentos() IS 'Função para atualizar status de pagamentos baseado em datas de vencimento';

SELECT '=== AGORA VOCÊ PODE EXECUTAR O SCRIPT DE TRIGGERS ===' as proximo_passo;
