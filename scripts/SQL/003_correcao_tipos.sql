-- =============================================
-- CORREÇÃO DE TIPOS DE DADOS - EXTRACT FUNCTION
-- =============================================
-- Este script corrige problemas de tipo com a função EXTRACT

-- 1. CORRIGIR VIEW DE PAGAMENTOS INTEGRADOS
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
    
    -- Dias até vencimento (CORRIGIDO)
    CASE 
        WHEN pr.prazo_data IS NOT NULL THEN 
            (pr.prazo_data - CURRENT_DATE)::integer
        ELSE NULL
    END AS dias_ate_vencimento

FROM pagamentos_receber pr
JOIN clients c ON pr.cliente_id = c.id
JOIN reports r ON pr.relatorio_id = r.id
LEFT JOIN companies co ON pr.empresa_id = co.id AND pr.empresa_tipo = 'interna'
LEFT JOIN empresas_terceiras et ON pr.empresa_id = et.id AND pr.empresa_tipo = 'terceira'
LEFT JOIN pumps p ON r.pump_id = p.id
LEFT JOIN notas_fiscais nf ON r.id = nf.relatorio_id;

-- 2. CORRIGIR FUNÇÃO DE CRIAÇÃO AUTOMÁTICA
CREATE OR REPLACE FUNCTION criar_pagamento_automatico_integrado()
RETURNS TRIGGER AS $$
DECLARE
    cliente_uuid UUID;
    empresa_uuid UUID;
    empresa_tipo_val TEXT;
    nota_fiscal_data RECORD;
    dias_vencimento INTEGER;
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
        
        -- Calcular dias de vencimento (CORRIGIDO)
        IF nota_fiscal_data.data_vencimento IS NOT NULL THEN
            dias_vencimento := (nota_fiscal_data.data_vencimento - CURRENT_DATE)::integer;
        ELSE
            dias_vencimento := 30;
        END IF;
        
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
                dias_vencimento,
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

-- 3. VERIFICAÇÃO DA CORREÇÃO
SELECT '=== CORREÇÃO DE TIPOS APLICADA COM SUCESSO ===' as info;
SELECT 'View view_pagamentos_receber_integrado corrigida' as view_corrigida;
SELECT 'Função criar_pagamento_automatico_integrado corrigida' as funcao_corrigida;
SELECT 'Problema de tipo EXTRACT resolvido' as problema_resolvido;
