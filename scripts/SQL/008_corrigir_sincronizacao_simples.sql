-- =============================================
-- CORREÇÃO DA SINCRONIZAÇÃO - VERSÃO SIMPLES
-- =============================================
-- Este script corrige a sincronização entre pagamentos e relatórios
-- Removendo triggers problemáticos e implementando sincronização direta

-- 1. DESABILITAR TRIGGERS PROBLEMÁTICOS TEMPORARIAMENTE
DROP TRIGGER IF EXISTS trigger_pagamentos_to_reports_integrado ON pagamentos_receber;
DROP TRIGGER IF EXISTS trigger_reports_to_pagamentos_status_integrado ON reports;

-- 2. CRIAR FUNÇÃO DE SINCRONIZAÇÃO SIMPLES E SEGURA
CREATE OR REPLACE FUNCTION sincronizar_pagamento_relatorio_simples()
RETURNS TRIGGER AS $$
BEGIN
    -- Só sincronizar se o pagamento foi marcado como pago
    IF NEW.status = 'pago' AND (OLD.status IS NULL OR OLD.status != 'pago') THEN
        -- Atualizar o relatório correspondente
        UPDATE reports 
        SET 
            status = 'PAGO',
            updated_at = NOW()
        WHERE id = NEW.relatorio_id;
        
        RAISE NOTICE 'Relatório % sincronizado como PAGO devido ao pagamento %', NEW.relatorio_id, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CRIAR TRIGGER SIMPLES APENAS PARA PAGAMENTOS → RELATÓRIOS
CREATE TRIGGER trigger_pagamentos_to_reports_simples
    AFTER UPDATE ON pagamentos_receber
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_pagamento_relatorio_simples();

-- 4. FUNÇÃO PARA CRIAR PAGAMENTOS AUTOMATICAMENTE (manter existente)
-- Esta função já existe e funciona bem, não precisa modificar

-- 5. FUNÇÃO PARA ATUALIZAR STATUS AUTOMATICAMENTE (manter existente)
-- Esta função já existe e funciona bem, não precisa modificar

-- 6. VERIFICAÇÃO DOS TRIGGERS ATIVOS
SELECT '=== TRIGGERS DE SINCRONIZAÇÃO CORRIGIDOS ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('reports', 'pagamentos_receber')
AND trigger_name LIKE '%simples%'
ORDER BY event_object_table, trigger_name;

-- 7. TESTE DA SINCRONIZAÇÃO
SELECT '=== TESTE DA SINCRONIZAÇÃO ===' as info;

-- Mostrar alguns pagamentos que podem ser testados
SELECT 
    pr.id as pagamento_id,
    pr.status as status_pagamento,
    r.id as relatorio_id,
    r.status as status_relatorio,
    pr.valor_total,
    r.total_value
FROM pagamentos_receber pr
JOIN reports r ON pr.relatorio_id = r.id
WHERE pr.status = 'aguardando'
LIMIT 5;

-- 8. INSTRUÇÕES PARA TESTE
SELECT '=== INSTRUÇÕES PARA TESTE ===' as info;
SELECT '1. Vá para a página de Pagamentos a Receber' as passo1;
SELECT '2. Marque um pagamento como pago' as passo2;
SELECT '3. Verifique se o relatório correspondente também ficou como PAGO' as passo3;
SELECT '4. Verifique se os KPIs estão contando corretamente' as passo4;

-- 9. COMENTÁRIOS EXPLICATIVOS
COMMENT ON FUNCTION sincronizar_pagamento_relatorio_simples() IS 'Função simples para sincronizar apenas pagamentos → relatórios, evitando loops infinitos';

SELECT '=== SINCRONIZAÇÃO CORRIGIDA ===' as info;
SELECT 'Agora quando marcar um pagamento como pago, o relatório será sincronizado automaticamente' as resultado;
