-- =============================================
-- TRIGGERS DE SINCRONIZAÇÃO BIDIRECIONAL
-- =============================================
-- Este script cria os triggers para sincronizar dados entre os módulos
-- SEM MODIFICAR dados existentes

-- 1. REMOVER TRIGGERS ANTIGOS (se existirem)
DROP TRIGGER IF EXISTS trigger_reports_to_pagamentos_receber ON reports;
DROP TRIGGER IF EXISTS trigger_pagamentos_receber_to_reports ON pagamentos_receber;
DROP TRIGGER IF EXISTS trigger_notas_fiscais_to_pagamentos ON notas_fiscais;
DROP TRIGGER IF EXISTS trigger_atualizar_status_automatico ON pagamentos_receber;

-- 2. TRIGGER: RELATÓRIOS → PAGAMENTOS (criação automática)
CREATE TRIGGER trigger_reports_to_pagamentos_integrado
    AFTER UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION criar_pagamento_automatico_integrado();

-- 3. TRIGGER: PAGAMENTOS → RELATÓRIOS (sincronização de status)
CREATE TRIGGER trigger_pagamentos_to_reports_integrado
    AFTER UPDATE ON pagamentos_receber
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_status_pagamento_relatorio();

-- 4. TRIGGER: RELATÓRIOS → PAGAMENTOS (sincronização de status)
CREATE TRIGGER trigger_reports_to_pagamentos_status_integrado
    AFTER UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_status_pagamento_relatorio();

-- 5. TRIGGER: ATUALIZAÇÃO AUTOMÁTICA DE STATUS POR DATA
CREATE TRIGGER trigger_atualizar_status_automatico_integrado
    BEFORE INSERT OR UPDATE ON pagamentos_receber
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_status_automatico_pagamentos();

-- 6. TRIGGER: NOTAS FISCAIS → PAGAMENTOS (sincronização de dados)
CREATE OR REPLACE FUNCTION sincronizar_nota_fiscal_pagamento()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando uma nota fiscal é criada ou atualizada, atualizar o pagamento correspondente
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE pagamentos_receber 
        SET 
            prazo_data = NEW.data_vencimento,
            prazo_dias = (NEW.data_vencimento - CURRENT_DATE)::integer,
            valor_total = NEW.valor,
            observacoes = COALESCE(observacoes, '') || ' | Dados sincronizados da nota fiscal ' || NEW.numero_nota,
            updated_at = NOW()
        WHERE relatorio_id = NEW.relatorio_id;
        
        RAISE NOTICE 'Pagamento sincronizado com nota fiscal % para relatório %', NEW.numero_nota, NEW.relatorio_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notas_fiscais_to_pagamentos_integrado
    AFTER INSERT OR UPDATE ON notas_fiscais
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_nota_fiscal_pagamento();

-- 7. TRIGGER: ATUALIZAÇÃO DE STATUS DE NOTAS FISCAIS
CREATE OR REPLACE FUNCTION sincronizar_status_nota_fiscal()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a nota fiscal foi marcada como paga, atualizar pagamento e relatório
    IF NEW.status = 'Paga' AND (OLD.status IS NULL OR OLD.status != 'Paga') THEN
        -- Atualizar pagamento
        UPDATE pagamentos_receber 
        SET 
            status = 'pago',
            observacoes = COALESCE(observacoes, '') || ' | Nota fiscal marcada como paga',
            updated_at = NOW()
        WHERE relatorio_id = NEW.relatorio_id;
        
        -- Atualizar relatório
        UPDATE reports 
        SET 
            status = 'PAGO',
            updated_at = NOW()
        WHERE id = NEW.relatorio_id;
        
        RAISE NOTICE 'Nota fiscal % marcada como paga - pagamento e relatório atualizados', NEW.numero_nota;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_status_notas_fiscais_integrado
    AFTER UPDATE ON notas_fiscais
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_status_nota_fiscal();

-- 8. FUNÇÃO PARA MIGRAR DADOS EXISTENTES (execução manual)
CREATE OR REPLACE FUNCTION migrar_dados_existentes_para_integracao()
RETURNS TABLE(
    acao TEXT,
    quantidade INTEGER,
    detalhes TEXT
) AS $$
DECLARE
    relatorios_sem_pagamento INTEGER;
    pagamentos_criados INTEGER;
    status_atualizados INTEGER;
BEGIN
    -- Contar relatórios que precisam de pagamentos
    SELECT COUNT(*) INTO relatorios_sem_pagamento
    FROM reports r
    LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
    WHERE r.status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO')
    AND pr.id IS NULL;
    
    -- Criar pagamentos para relatórios que não têm
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
    )
    SELECT 
        r.id,
        r.client_id,
        r.company_id,
        'interna',
        COALESCE(r.total_value, 0),
        'sem_forma',
        COALESCE(nf.data_vencimento, CURRENT_DATE + INTERVAL '30 days'),
        COALESCE((nf.data_vencimento - CURRENT_DATE)::integer, 30),
        'aguardando',
        'Migrado automaticamente - ' || r.status
    FROM reports r
    LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
    LEFT JOIN notas_fiscais nf ON r.id = nf.relatorio_id
    WHERE r.status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO')
    AND pr.id IS NULL;
    
    GET DIAGNOSTICS pagamentos_criados = ROW_COUNT;
    
    -- Atualizar status de pagamentos baseado em datas
    UPDATE pagamentos_receber 
    SET 
        status = CASE 
            WHEN prazo_data < CURRENT_DATE THEN 'vencido'
            WHEN prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'proximo_vencimento'
            ELSE status
        END,
        observacoes = COALESCE(observacoes, '') || ' | Status atualizado na migração'
    WHERE status = 'aguardando'
    AND (prazo_data < CURRENT_DATE OR prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days');
    
    GET DIAGNOSTICS status_atualizados = ROW_COUNT;
    
    -- Retornar resultados
    RETURN QUERY SELECT 
        'Relatórios sem pagamento encontrados'::TEXT,
        relatorios_sem_pagamento,
        'Relatórios que precisavam de pagamentos criados'::TEXT;
    
    RETURN QUERY SELECT 
        'Pagamentos criados'::TEXT,
        pagamentos_criados,
        'Novos pagamentos criados para relatórios existentes'::TEXT;
    
    RETURN QUERY SELECT 
        'Status atualizados'::TEXT,
        status_atualizados,
        'Status de pagamentos atualizados baseado em datas'::TEXT;
    
END;
$$ LANGUAGE plpgsql;

-- 9. VERIFICAÇÃO DOS TRIGGERS CRIADOS
SELECT '=== TRIGGERS DE SINCRONIZAÇÃO CRIADOS ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('reports', 'pagamentos_receber', 'notas_fiscais')
AND trigger_name LIKE '%integrado%'
ORDER BY event_object_table, trigger_name;

-- 10. INSTRUÇÕES PARA MIGRAÇÃO
SELECT '=== INSTRUÇÕES PARA MIGRAÇÃO ===' as info;
SELECT '1. Execute: SELECT * FROM migrar_dados_existentes_para_integracao();' as passo1;
SELECT '2. Verifique os resultados da migração' as passo2;
SELECT '3. Teste a sincronização criando/atualizando relatórios' as passo3;
SELECT '4. Verifique se os pagamentos são criados automaticamente' as passo4;
SELECT '5. Teste marcar pagamentos como pago e verificar sincronização' as passo5;

-- 11. COMENTÁRIOS FINAIS
COMMENT ON FUNCTION migrar_dados_existentes_para_integracao() IS 'Função para migrar dados existentes para a nova estrutura integrada - execute manualmente';
COMMENT ON FUNCTION sincronizar_nota_fiscal_pagamento() IS 'Função para sincronizar dados de notas fiscais com pagamentos';
COMMENT ON FUNCTION sincronizar_status_nota_fiscal() IS 'Função para sincronizar status de notas fiscais com pagamentos e relatórios';
