-- =============================================
-- NOVA ESTRUTURA INTEGRADA - RELATÓRIOS, PAGAMENTOS E FATURAMENTO
-- =============================================
-- Este script cria a nova estrutura SEM MODIFICAR dados existentes
-- Apenas adiciona novas views, funções e triggers

-- 1. ATUALIZAR ENUM DE FORMA DE PAGAMENTO (se necessário)
DO $$ 
BEGIN
    -- Adicionar 'sem_forma' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'sem_forma' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'forma_pagamento')
    ) THEN
        ALTER TYPE forma_pagamento ADD VALUE 'sem_forma';
    END IF;
END $$;

-- 2. CRIAR VIEW INTEGRADA COMPLETA
CREATE OR REPLACE VIEW view_pagamentos_receber_integrado AS
SELECT
    -- Dados do pagamento
    pr.id,
    pr.relatorio_id,
    pr.cliente_id,
    pr.empresa_id,
    pr.empresa_tipo,
    pr.valor_total,
    pr.forma_pagamento,
    pr.prazo_data,
    pr.prazo_dias,
    pr.status as pagamento_status,
    pr.observacoes,
    pr.created_at as pagamento_created_at,
    pr.updated_at as pagamento_updated_at,
    
    -- Dados do cliente
    c.name AS cliente_nome,
    c.email AS cliente_email,
    c.phone AS cliente_telefone,
    
    -- Dados do relatório
    r.report_number,
    r.date AS relatorio_data,
    r.total_value AS relatorio_valor,
    r.status AS relatorio_status,
    r.client_rep_name,
    r.whatsapp_digits,
    r.work_address,
    r.driver_name,
    r.assistant1_name,
    r.assistant2_name,
    r.realized_volume,
    
    -- Dados da empresa
    CASE 
        WHEN pr.empresa_tipo = 'interna' THEN co.name
        WHEN pr.empresa_tipo = 'terceira' THEN et.nome_fantasia
        ELSE NULL
    END AS empresa_nome,
    CASE 
        WHEN pr.empresa_tipo = 'interna' THEN NULL
        WHEN pr.empresa_tipo = 'terceira' THEN et.cnpj
        ELSE NULL
    END AS empresa_cnpj,
    
    -- Dados da bomba
    p.prefix AS bomba_prefix,
    p.model AS bomba_model,
    p.brand AS bomba_brand,
    
    -- Dados da nota fiscal (se existir)
    nf.id AS nota_fiscal_id,
    nf.numero_nota,
    nf.data_emissao AS nf_data_emissao,
    nf.data_vencimento AS nf_data_vencimento,
    nf.valor AS nf_valor,
    nf.status AS nf_status,
    nf.anexo_url AS nf_anexo_url,
    
    -- Campos calculados
    CASE 
        WHEN r.status = 'PAGO' THEN 'pago'
        WHEN r.status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO') AND pr.status = 'aguardando' THEN 'aguardando'
        WHEN r.status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO') AND pr.status = 'pago' THEN 'pago'
        WHEN pr.prazo_data < CURRENT_DATE AND pr.status = 'aguardando' THEN 'vencido'
        WHEN pr.prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND pr.status = 'aguardando' THEN 'proximo_vencimento'
        ELSE pr.status
    END AS status_unificado,
    
    -- Indicadores
    CASE WHEN nf.id IS NOT NULL THEN true ELSE false END AS tem_nota_fiscal,
    CASE WHEN r.status = 'PAGO' THEN true ELSE false END AS relatorio_pago,
    CASE WHEN pr.status = 'pago' THEN true ELSE false END AS pagamento_pago,
    
    -- Dias até vencimento
    CASE 
        WHEN pr.prazo_data IS NOT NULL THEN 
            EXTRACT(DAY FROM (pr.prazo_data - CURRENT_DATE)::interval)
        ELSE NULL
    END AS dias_ate_vencimento

FROM pagamentos_receber pr
JOIN clients c ON pr.cliente_id = c.id
JOIN reports r ON pr.relatorio_id = r.id
LEFT JOIN companies co ON pr.empresa_id = co.id AND pr.empresa_tipo = 'interna'
LEFT JOIN empresas_terceiras et ON pr.empresa_id = et.id AND pr.empresa_tipo = 'terceira'
LEFT JOIN pumps p ON r.pump_id = p.id
LEFT JOIN notas_fiscais nf ON r.id = nf.relatorio_id;

-- 3. CRIAR VIEW DE FATURAMENTO BRUTO INTEGRADO
CREATE OR REPLACE VIEW view_faturamento_bruto_integrado AS
SELECT
    -- Agregações por período
    DATE_TRUNC('day', pr.updated_at) as data_pagamento,
    DATE_TRUNC('month', pr.updated_at) as mes_pagamento,
    DATE_TRUNC('year', pr.updated_at) as ano_pagamento,
    
    -- Dados agregados
    COUNT(*) as total_pagamentos_pagos,
    SUM(pr.valor_total) as valor_total_pago,
    AVG(pr.valor_total) as valor_medio_pago,
    
    -- Dados por empresa
    pr.empresa_tipo,
    CASE 
        WHEN pr.empresa_tipo = 'interna' THEN co.name
        WHEN pr.empresa_tipo = 'terceira' THEN et.nome_fantasia
        ELSE 'Não informado'
    END AS empresa_nome,
    
    -- Dados por cliente
    COUNT(DISTINCT pr.cliente_id) as clientes_unicos,
    
    -- Métricas de performance
    COUNT(CASE WHEN r.realized_volume > 0 THEN 1 END) as pagamentos_com_volume,
    AVG(CASE WHEN r.realized_volume > 0 THEN r.realized_volume END) as volume_medio_bombeado

FROM pagamentos_receber pr
JOIN reports r ON pr.relatorio_id = r.id
LEFT JOIN companies co ON pr.empresa_id = co.id AND pr.empresa_tipo = 'interna'
LEFT JOIN empresas_terceiras et ON pr.empresa_id = et.id AND pr.empresa_tipo = 'terceira'
WHERE pr.status = 'pago'
GROUP BY 
    DATE_TRUNC('day', pr.updated_at),
    DATE_TRUNC('month', pr.updated_at),
    DATE_TRUNC('year', pr.updated_at),
    pr.empresa_tipo,
    co.name,
    et.nome_fantasia;

-- 4. CRIAR VIEW DE KPIS UNIFICADOS
CREATE OR REPLACE VIEW view_kpis_financeiros_unificados AS
SELECT
    -- KPIs de Pagamentos
    (SELECT COUNT(*) FROM pagamentos_receber WHERE status = 'aguardando') as pagamentos_aguardando,
    (SELECT COUNT(*) FROM pagamentos_receber WHERE status = 'pago') as pagamentos_pagos,
    (SELECT COUNT(*) FROM pagamentos_receber WHERE status = 'vencido') as pagamentos_vencidos,
    (SELECT COUNT(*) FROM pagamentos_receber WHERE prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status = 'aguardando') as pagamentos_proximo_vencimento,
    
    -- Valores
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'aguardando') as valor_aguardando,
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'pago') as valor_pago,
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'vencido') as valor_vencido,
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE prazo_data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status = 'aguardando') as valor_proximo_vencimento,
    
    -- Faturamento
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'pago' AND DATE_TRUNC('day', updated_at) = CURRENT_DATE) as faturamento_hoje,
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber WHERE status = 'pago' AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', CURRENT_DATE)) as faturamento_mes,
    
    -- Relatórios
    (SELECT COUNT(*) FROM reports WHERE status IN ('NOTA_EMITIDA', 'AGUARDANDO_PAGAMENTO')) as relatorios_pendentes,
    (SELECT COUNT(*) FROM reports WHERE status = 'PAGO') as relatorios_pagos,
    
    -- Notas Fiscais
    (SELECT COUNT(*) FROM notas_fiscais WHERE status = 'Faturada') as notas_faturadas,
    (SELECT COUNT(*) FROM notas_fiscais WHERE status = 'Paga') as notas_pagas,
    
    -- Métricas calculadas
    (SELECT COALESCE(SUM(valor_total), 0) FROM pagamentos_receber) as valor_total_pagamentos,
    (SELECT COUNT(*) FROM pagamentos_receber) as total_pagamentos,
    
    -- Timestamp da consulta
    NOW() as consultado_em;

-- 5. CRIAR FUNÇÃO PARA SINCRONIZAR STATUS
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

-- 6. CRIAR FUNÇÃO PARA CRIAR PAGAMENTO AUTOMÁTICO
CREATE OR REPLACE FUNCTION criar_pagamento_automatico_integrado()
RETURNS TRIGGER AS $$
DECLARE
    cliente_uuid UUID;
    empresa_uuid UUID;
    empresa_tipo_val TEXT;
    nota_fiscal_data RECORD;
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
        
        -- Buscar dados da nota fiscal se existir
        SELECT * INTO nota_fiscal_data
        FROM notas_fiscais
        WHERE relatorio_id = NEW.id
        LIMIT 1;
        
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
                'sem_forma', -- Sem forma de pagamento definida inicialmente
                CASE 
                    WHEN nota_fiscal_data.data_vencimento IS NOT NULL THEN nota_fiscal_data.data_vencimento
                    ELSE CURRENT_DATE + INTERVAL '30 days'
                END,
                CASE 
                    WHEN nota_fiscal_data.data_vencimento IS NOT NULL THEN 
                        EXTRACT(DAY FROM (nota_fiscal_data.data_vencimento - CURRENT_DATE)::interval)
                    ELSE 30
                END,
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

-- 7. CRIAR FUNÇÃO PARA ATUALIZAR STATUS BASEADO EM DATAS
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

-- 8. COMENTÁRIOS EXPLICATIVOS
COMMENT ON VIEW view_pagamentos_receber_integrado IS 'View integrada que une dados de pagamentos, relatórios, clientes, empresas, bombas e notas fiscais';
COMMENT ON VIEW view_faturamento_bruto_integrado IS 'View para cálculo de faturamento bruto baseado em pagamentos realizados';
COMMENT ON VIEW view_kpis_financeiros_unificados IS 'View com KPIs unificados de todos os módulos financeiros';
COMMENT ON FUNCTION sincronizar_status_pagamento_relatorio() IS 'Função para sincronizar status entre pagamentos e relatórios';
COMMENT ON FUNCTION criar_pagamento_automatico_integrado() IS 'Função para criar pagamentos automaticamente quando relatórios mudam de status';
COMMENT ON FUNCTION atualizar_status_automatico_pagamentos() IS 'Função para atualizar status de pagamentos baseado em datas de vencimento';

-- 9. VERIFICAÇÃO DA NOVA ESTRUTURA
SELECT '=== NOVA ESTRUTURA CRIADA COM SUCESSO ===' as info;
SELECT 'Views criadas: view_pagamentos_receber_integrado, view_faturamento_bruto_integrado, view_kpis_financeiros_unificados' as views;
SELECT 'Funções criadas: sincronizar_status_pagamento_relatorio, criar_pagamento_automatico_integrado, atualizar_status_automatico_pagamentos' as funcoes;
SELECT 'Próximo passo: Criar os triggers de sincronização' as proximo_passo;
