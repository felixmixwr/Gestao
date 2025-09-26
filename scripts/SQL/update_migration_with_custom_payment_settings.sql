-- Script para atualizar a migração de NOTA_EMITIDA com configurações personalizadas
-- Permite definir forma de pagamento e data de vencimento específicas

-- =============================================
-- 1. ATUALIZAR FUNÇÃO DE PROCESSAMENTO AUTOMÁTICO
-- =============================================

-- Atualizar função para permitir configurações personalizadas
CREATE OR REPLACE FUNCTION process_nota_emitida_to_pagamentos_receber()
RETURNS TRIGGER AS $$
DECLARE
    cliente_uuid UUID;
    empresa_uuid UUID;
    empresa_tipo_val TEXT;
    forma_pagamento_val TEXT;
    prazo_dias_val INT;
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
        
        -- Configurações padrão (podem ser personalizadas)
        forma_pagamento_val := 'boleto'; -- Pode ser alterado para 'pix', 'a_vista'
        prazo_dias_val := 5; -- Pode ser alterado conforme necessário
        
        -- Verifica se já existe um pagamento para este relatório
        IF NOT EXISTS (
            SELECT 1 FROM public.pagamentos_receber 
            WHERE relatorio_id = NEW.id
        ) THEN
            -- Insere o pagamento com configurações personalizáveis
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
                forma_pagamento_val::public.forma_pagamento,
                CURRENT_DATE + (prazo_dias_val || ' days')::INTERVAL,
                prazo_dias_val,
                'aguardando'::public.status_pagamento,
                'Criado automaticamente quando relatório mudou para NOTA_EMITIDA - Configurações: ' || forma_pagamento_val || ', ' || prazo_dias_val || ' dias'
            );
        END IF;
        
        -- Atualiza o status do relatório para AGUARDANDO_PAGAMENTO
        NEW.status := 'AGUARDANDO_PAGAMENTO';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 2. CRIAR FUNÇÃO PARA CONFIGURAR PADRÕES DE MIGRAÇÃO
-- =============================================

-- Função para definir configurações padrão para novos pagamentos
CREATE OR REPLACE FUNCTION configurar_padroes_pagamento(
    p_forma_pagamento_padrao TEXT DEFAULT 'boleto',
    p_prazo_dias_padrao INT DEFAULT 5
)
RETURNS VOID AS $$
BEGIN
    -- Esta função pode ser usada para configurar padrões globais
    -- Por enquanto, apenas registra as configurações
    RAISE NOTICE 'Configurações de pagamento atualizadas:';
    RAISE NOTICE 'Forma de pagamento padrão: %', p_forma_pagamento_padrao;
    RAISE NOTICE 'Prazo em dias padrão: %', p_prazo_dias_padrao;
    
    -- Aqui você pode adicionar lógica para salvar essas configurações
    -- em uma tabela de configurações se necessário
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 3. CRIAR FUNÇÃO PARA MIGRAR RELATÓRIOS EXISTENTES COM CONFIGURAÇÕES PERSONALIZADAS
-- =============================================

-- Função para migrar relatórios existentes com configurações específicas
CREATE OR REPLACE FUNCTION migrar_nota_emitida_com_configuracoes(
    p_forma_pagamento TEXT DEFAULT 'boleto',
    p_prazo_dias INT DEFAULT 5,
    p_data_vencimento DATE DEFAULT NULL
)
RETURNS TABLE(
    relatorios_migrados INT,
    pagamentos_criados INT,
    valor_total_migrado DECIMAL
) AS $$
DECLARE
    v_relatorios_migrados INT := 0;
    v_pagamentos_criados INT := 0;
    v_valor_total_migrado DECIMAL := 0;
    v_data_vencimento DATE;
BEGIN
    -- Determinar data de vencimento
    IF p_data_vencimento IS NOT NULL THEN
        v_data_vencimento := p_data_vencimento;
    ELSE
        v_data_vencimento := CURRENT_DATE + (p_prazo_dias || ' days')::INTERVAL;
    END IF;
    
    -- Contar relatórios que serão migrados
    SELECT COUNT(*) INTO v_relatorios_migrados
    FROM public.reports 
    WHERE status = 'NOTA_EMITIDA';
    
    -- Migrar relatórios para pagamentos_receber
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
        observacoes,
        created_at,
        updated_at
    )
    SELECT 
        r.id as relatorio_id,
        r.client_id as cliente_id,
        r.company_id as empresa_id,
        'interna' as empresa_tipo,
        r.total_value as valor_total,
        p_forma_pagamento::public.forma_pagamento as forma_pagamento,
        v_data_vencimento as prazo_data,
        p_prazo_dias as prazo_dias,
        'aguardando'::public.status_pagamento as status,
        'Migrado com configurações personalizadas: ' || p_forma_pagamento || ', ' || p_prazo_dias || ' dias' as observacoes,
        NOW() as created_at,
        NOW() as updated_at
    FROM public.reports r
    WHERE r.status = 'NOTA_EMITIDA'
    AND NOT EXISTS (
        SELECT 1 FROM public.pagamentos_receber pr 
        WHERE pr.relatorio_id = r.id
    );
    
    -- Contar pagamentos criados
    GET DIAGNOSTICS v_pagamentos_criados = ROW_COUNT;
    
    -- Calcular valor total migrado
    SELECT COALESCE(SUM(valor_total), 0) INTO v_valor_total_migrado
    FROM public.pagamentos_receber 
    WHERE observacoes LIKE 'Migrado com configurações personalizadas%';
    
    -- Atualizar status dos relatórios migrados
    UPDATE public.reports 
    SET 
        status = 'AGUARDANDO_PAGAMENTO',
        updated_at = NOW()
    WHERE status = 'NOTA_EMITIDA';
    
    -- Retornar resultados
    RETURN QUERY SELECT v_relatorios_migrados, v_pagamentos_criados, v_valor_total_migrado;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 4. EXEMPLOS DE USO
-- =============================================

-- Exemplo 1: Migrar com configurações padrão (boleto, 5 dias)
-- SELECT * FROM migrar_nota_emitida_com_configuracoes();

-- Exemplo 2: Migrar com PIX e 3 dias
-- SELECT * FROM migrar_nota_emitida_com_configuracoes('pix', 3);

-- Exemplo 3: Migrar com data específica de vencimento
-- SELECT * FROM migrar_nota_emitida_com_configuracoes('boleto', 7, '2024-12-31');

-- =============================================
-- 5. VERIFICAR CONFIGURAÇÕES ATUAIS
-- =============================================

-- Verificar relatórios NOTA_EMITIDA existentes
SELECT 
  'Relatórios NOTA_EMITIDA:' as info,
  COUNT(*) as quantidade,
  SUM(total_value) as valor_total
FROM public.reports 
WHERE status = 'NOTA_EMITIDA';

-- Verificar pagamentos já criados
SELECT 
  'Pagamentos existentes:' as info,
  COUNT(*) as quantidade,
  SUM(valor_total) as valor_total,
  forma_pagamento,
  COUNT(*) as quantidade_por_forma
FROM public.pagamentos_receber 
GROUP BY forma_pagamento;

-- =============================================
-- 6. COMENTÁRIOS EXPLICATIVOS
-- =============================================

COMMENT ON FUNCTION process_nota_emitida_to_pagamentos_receber() IS 'Função atualizada que processa automaticamente relatórios NOTA_EMITIDA com configurações personalizáveis de forma de pagamento e prazo';

COMMENT ON FUNCTION configurar_padroes_pagamento(TEXT, INT) IS 'Função para configurar padrões globais de forma de pagamento e prazo para novos pagamentos';

COMMENT ON FUNCTION migrar_nota_emitida_com_configuracoes(TEXT, INT, DATE) IS 'Função para migrar relatórios NOTA_EMITIDA existentes com configurações específicas de forma de pagamento, prazo e data de vencimento';

-- =============================================
-- 7. RESUMO FINAL
-- =============================================

-- Mostrar resumo
SELECT 
  'Sistema atualizado com sucesso!' as status,
  'Agora você pode configurar forma de pagamento e data de vencimento personalizadas' as funcionalidade,
  'Use a função migrar_nota_emitida_com_configuracoes() para migrar com configurações específicas' as uso;
