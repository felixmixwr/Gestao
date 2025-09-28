-- Script para atualizar a lógica de data de vencimento
-- PIX e À Vista sempre vencem no mesmo dia (hoje)
-- Boleto pode ter prazo personalizado

-- =============================================
-- 1. ATUALIZAR FUNÇÃO DE PROCESSAMENTO AUTOMÁTICO
-- =============================================

CREATE OR REPLACE FUNCTION process_nota_emitida_to_pagamentos_receber()
RETURNS TRIGGER AS $$
DECLARE
    cliente_uuid UUID;
    empresa_uuid UUID;
    empresa_tipo_val TEXT;
    forma_pagamento_val TEXT;
    prazo_dias_val INT;
    data_vencimento DATE;
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
        
        -- Determinar prazo e data de vencimento baseado na forma de pagamento
        IF forma_pagamento_val IN ('pix', 'a_vista') THEN
            -- PIX e À Vista sempre vencem no mesmo dia
            prazo_dias_val := 0;
            data_vencimento := CURRENT_DATE;
        ELSE
            -- Boleto tem prazo padrão de 5 dias
            prazo_dias_val := 5;
            data_vencimento := CURRENT_DATE + prazo_dias_val;
        END IF;
        
        -- Verifica se já existe um pagamento para este relatório
        IF NOT EXISTS (
            SELECT 1 FROM public.pagamentos_receber 
            WHERE relatorio_id = NEW.id
        ) THEN
            -- Insere o pagamento com configurações baseadas na forma de pagamento
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
                data_vencimento,
                prazo_dias_val,
                'aguardando'::public.status_pagamento,
                'Criado automaticamente - ' || forma_pagamento_val || ' (vencimento: ' || 
                CASE 
                    WHEN forma_pagamento_val IN ('pix', 'a_vista') THEN 'mesmo dia'
                    ELSE prazo_dias_val || ' dias'
                END || ')'
            );
        END IF;
        
        -- Atualiza o status do relatório para AGUARDANDO_PAGAMENTO
        NEW.status := 'AGUARDANDO_PAGAMENTO';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 2. ATUALIZAR FUNÇÃO DE MIGRAÇÃO COM LÓGICA DE VENCIMENTO
-- =============================================

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
    v_prazo_dias INT;
BEGIN
    -- Determinar data de vencimento baseado na forma de pagamento
    IF p_data_vencimento IS NOT NULL THEN
        -- Se data específica foi fornecida, usar ela
        v_data_vencimento := p_data_vencimento;
        v_prazo_dias := p_prazo_dias;
    ELSIF p_forma_pagamento IN ('pix', 'a_vista') THEN
        -- PIX e À Vista sempre vencem no mesmo dia
        v_data_vencimento := CURRENT_DATE;
        v_prazo_dias := 0;
    ELSE
        -- Boleto usa o prazo especificado
        v_data_vencimento := CURRENT_DATE + p_prazo_dias;
        v_prazo_dias := p_prazo_dias;
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
        v_prazo_dias as prazo_dias,
        'aguardando'::public.status_pagamento as status,
        'Migrado com configurações: ' || p_forma_pagamento || ' (vencimento: ' || 
        CASE 
            WHEN p_forma_pagamento IN ('pix', 'a_vista') THEN 'mesmo dia'
            ELSE v_prazo_dias || ' dias'
        END || ')' as observacoes,
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
    WHERE observacoes LIKE 'Migrado com configurações%';
    
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
-- 3. CRIAR FUNÇÃO PARA ATUALIZAR PAGAMENTOS EXISTENTES
-- =============================================

-- Função para atualizar pagamentos existentes com a nova lógica
CREATE OR REPLACE FUNCTION atualizar_vencimentos_pagamentos_existentes()
RETURNS TABLE(
    pagamentos_atualizados INT,
    pix_atualizados INT,
    a_vista_atualizados INT,
    boletos_atualizados INT
) AS $$
DECLARE
    v_pagamentos_atualizados INT := 0;
    v_pix_atualizados INT := 0;
    v_a_vista_atualizados INT := 0;
    v_boletos_atualizados INT := 0;
BEGIN
    -- Atualizar PIX para vencimento no mesmo dia
    UPDATE public.pagamentos_receber 
    SET 
        prazo_data = CURRENT_DATE,
        prazo_dias = 0,
        observacoes = COALESCE(observacoes, '') || ' [Atualizado: PIX vence no mesmo dia]',
        updated_at = NOW()
    WHERE forma_pagamento = 'pix' 
    AND prazo_data != CURRENT_DATE;
    
    GET DIAGNOSTICS v_pix_atualizados = ROW_COUNT;
    
    -- Atualizar À Vista para vencimento no mesmo dia
    UPDATE public.pagamentos_receber 
    SET 
        prazo_data = CURRENT_DATE,
        prazo_dias = 0,
        observacoes = COALESCE(observacoes, '') || ' [Atualizado: À Vista vence no mesmo dia]',
        updated_at = NOW()
    WHERE forma_pagamento = 'a_vista' 
    AND prazo_data != CURRENT_DATE;
    
    GET DIAGNOSTICS v_a_vista_atualizados = ROW_COUNT;
    
    -- Contar total de atualizações
    v_pagamentos_atualizados := v_pix_atualizados + v_a_vista_atualizados;
    
    -- Retornar resultados
    RETURN QUERY SELECT v_pagamentos_atualizados, v_pix_atualizados, v_a_vista_atualizados, v_boletos_atualizados;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 4. EXEMPLOS DE USO
-- =============================================

-- Exemplo 1: Migrar com PIX (vence no mesmo dia)
-- SELECT * FROM migrar_nota_emitida_com_configuracoes('pix');

-- Exemplo 2: Migrar com À Vista (vence no mesmo dia)
-- SELECT * FROM migrar_nota_emitida_com_configuracoes('a_vista');

-- Exemplo 3: Migrar com Boleto (vence em 7 dias)
-- SELECT * FROM migrar_nota_emitida_com_configuracoes('boleto', 7);

-- Exemplo 4: Atualizar pagamentos existentes
-- SELECT * FROM atualizar_vencimentos_pagamentos_existentes();

-- =============================================
-- 5. VERIFICAR CONFIGURAÇÕES ATUAIS
-- =============================================

-- Verificar pagamentos por forma de pagamento e vencimento
SELECT 
  forma_pagamento,
  COUNT(*) as quantidade,
  SUM(valor_total) as valor_total,
  MIN(prazo_data) as primeiro_vencimento,
  MAX(prazo_data) as ultimo_vencimento,
  AVG(prazo_dias) as prazo_medio_dias
FROM public.pagamentos_receber 
GROUP BY forma_pagamento
ORDER BY forma_pagamento;

-- Verificar pagamentos PIX e À Vista que não vencem hoje
SELECT 
  'Pagamentos PIX/À Vista com vencimento incorreto:' as info,
  COUNT(*) as quantidade
FROM public.pagamentos_receber 
WHERE forma_pagamento IN ('pix', 'a_vista') 
AND prazo_data != CURRENT_DATE;

-- =============================================
-- 6. COMENTÁRIOS EXPLICATIVOS
-- =============================================

COMMENT ON FUNCTION process_nota_emitida_to_pagamentos_receber() IS 'Função que processa automaticamente relatórios NOTA_EMITIDA: PIX e À Vista vencem no mesmo dia, Boleto tem prazo configurável';

COMMENT ON FUNCTION migrar_nota_emitida_com_configuracoes(TEXT, INT, DATE) IS 'Função para migrar relatórios NOTA_EMITIDA: PIX e À Vista sempre vencem no mesmo dia, Boleto pode ter prazo personalizado';

COMMENT ON FUNCTION atualizar_vencimentos_pagamentos_existentes() IS 'Função para atualizar pagamentos existentes: PIX e À Vista passam a vencer no mesmo dia';

-- =============================================
-- 7. RESUMO FINAL
-- =============================================

-- Mostrar resumo
SELECT 
  'Sistema atualizado com nova lógica de vencimento!' as status,
  'PIX e À Vista sempre vencem no mesmo dia' as regra_pix_a_vista,
  'Boleto pode ter prazo personalizado' as regra_boleto,
  'Use atualizar_vencimentos_pagamentos_existentes() para corrigir pagamentos existentes' as correcao_existentes;




