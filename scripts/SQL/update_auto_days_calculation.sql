-- Script para atualizar o sistema com cálculo automático de dias
-- Quando a data de vencimento é definida, os dias são calculados automaticamente

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
-- 2. CRIAR FUNÇÃO PARA CALCULAR DIAS AUTOMATICAMENTE
-- =============================================

-- Função para calcular dias baseado na data de vencimento
CREATE OR REPLACE FUNCTION calcular_dias_vencimento(p_data_vencimento DATE)
RETURNS INT AS $$
BEGIN
    -- Calcular diferença em dias entre hoje e a data de vencimento
    -- Em PostgreSQL, subtração de datas já retorna o número de dias como inteiro
    RETURN GREATEST(0, p_data_vencimento - CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 3. CRIAR TRIGGER PARA ATUALIZAR DIAS AUTOMATICAMENTE
-- =============================================

-- Função para atualizar prazo_dias quando prazo_data mudar
CREATE OR REPLACE FUNCTION update_prazo_dias_on_date_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a data de vencimento mudou e não é PIX ou À Vista
    IF NEW.prazo_data IS NOT NULL AND NEW.forma_pagamento NOT IN ('pix', 'a_vista') THEN
        -- Calcular dias automaticamente
        NEW.prazo_dias := calcular_dias_vencimento(NEW.prazo_data);
    ELSIF NEW.forma_pagamento IN ('pix', 'a_vista') THEN
        -- PIX e À Vista sempre vencem hoje
        NEW.prazo_data := CURRENT_DATE;
        NEW.prazo_dias := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar prazo_dias automaticamente
DROP TRIGGER IF EXISTS trigger_update_prazo_dias ON public.pagamentos_receber;
CREATE TRIGGER trigger_update_prazo_dias
    BEFORE INSERT OR UPDATE ON public.pagamentos_receber
    FOR EACH ROW
    EXECUTE FUNCTION update_prazo_dias_on_date_change();

-- =============================================
-- 4. ATUALIZAR FUNÇÃO DE MIGRAÇÃO COM CÁLCULO AUTOMÁTICO
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
        -- Se data específica foi fornecida, usar ela e calcular dias
        v_data_vencimento := p_data_vencimento;
        v_prazo_dias := calcular_dias_vencimento(p_data_vencimento);
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
-- 5. CRIAR FUNÇÃO PARA ATUALIZAR PAGAMENTOS EXISTENTES
-- =============================================

-- Função para recalcular dias de todos os pagamentos existentes
CREATE OR REPLACE FUNCTION recalcular_dias_pagamentos_existentes()
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
        observacoes = COALESCE(observacoes, '') || ' [Recalculado: PIX vence no mesmo dia]',
        updated_at = NOW()
    WHERE forma_pagamento = 'pix' 
    AND prazo_data != CURRENT_DATE;
    
    GET DIAGNOSTICS v_pix_atualizados = ROW_COUNT;
    
    -- Atualizar À Vista para vencimento no mesmo dia
    UPDATE public.pagamentos_receber 
    SET 
        prazo_data = CURRENT_DATE,
        prazo_dias = 0,
        observacoes = COALESCE(observacoes, '') || ' [Recalculado: À Vista vence no mesmo dia]',
        updated_at = NOW()
    WHERE forma_pagamento = 'a_vista' 
    AND prazo_data != CURRENT_DATE;
    
    GET DIAGNOSTICS v_a_vista_atualizados = ROW_COUNT;
    
    -- Recalcular dias para Boletos baseado na data de vencimento
    UPDATE public.pagamentos_receber 
    SET 
        prazo_dias = calcular_dias_vencimento(prazo_data),
        observacoes = COALESCE(observacoes, '') || ' [Recalculado: dias baseado na data de vencimento]',
        updated_at = NOW()
    WHERE forma_pagamento = 'boleto' 
    AND prazo_data IS NOT NULL;
    
    GET DIAGNOSTICS v_boletos_atualizados = ROW_COUNT;
    
    -- Contar total de atualizações
    v_pagamentos_atualizados := v_pix_atualizados + v_a_vista_atualizados + v_boletos_atualizados;
    
    -- Retornar resultados
    RETURN QUERY SELECT v_pagamentos_atualizados, v_pix_atualizados, v_a_vista_atualizados, v_boletos_atualizados;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. EXEMPLOS DE USO
-- =============================================

-- Exemplo 1: Migrar com data específica (dias calculados automaticamente)
-- SELECT * FROM migrar_nota_emitida_com_configuracoes('boleto', 0, '2024-12-31');

-- Exemplo 2: Migrar com PIX (vence hoje)
-- SELECT * FROM migrar_nota_emitida_com_configuracoes('pix');

-- Exemplo 3: Recalcular todos os pagamentos existentes
-- SELECT * FROM recalcular_dias_pagamentos_existentes();

-- =============================================
-- 7. VERIFICAR CONFIGURAÇÕES ATUAIS
-- =============================================

-- Verificar pagamentos por forma de pagamento e vencimento
SELECT 
  forma_pagamento,
  COUNT(*) as quantidade,
  SUM(valor_total) as valor_total,
  MIN(prazo_data) as primeiro_vencimento,
  MAX(prazo_data) as ultimo_vencimento,
  AVG(prazo_dias) as prazo_medio_dias,
  MIN(prazo_dias) as menor_prazo,
  MAX(prazo_dias) as maior_prazo
FROM public.pagamentos_receber 
GROUP BY forma_pagamento
ORDER BY forma_pagamento;

-- Verificar pagamentos com dias inconsistentes
SELECT 
  'Pagamentos com dias inconsistentes:' as info,
  COUNT(*) as quantidade
FROM public.pagamentos_receber 
WHERE forma_pagamento = 'boleto' 
AND prazo_data IS NOT NULL 
AND prazo_dias != calcular_dias_vencimento(prazo_data);

-- =============================================
-- 8. COMENTÁRIOS EXPLICATIVOS
-- =============================================

COMMENT ON FUNCTION calcular_dias_vencimento(DATE) IS 'Calcula automaticamente quantos dias faltam até a data de vencimento';

COMMENT ON FUNCTION update_prazo_dias_on_date_change() IS 'Trigger que atualiza automaticamente o campo prazo_dias quando prazo_data é alterado';

COMMENT ON FUNCTION recalcular_dias_pagamentos_existentes() IS 'Recalcula os dias de todos os pagamentos existentes baseado na data de vencimento';

-- =============================================
-- 9. RESUMO FINAL
-- =============================================

-- Mostrar resumo
SELECT 
  'Sistema atualizado com cálculo automático de dias!' as status,
  'Agora os dias são calculados automaticamente baseado na data de vencimento' as funcionalidade,
  'PIX e À Vista sempre vencem hoje (0 dias)' as regra_pix_a_vista,
  'Boleto calcula dias automaticamente baseado na data' as regra_boleto,
  'Use recalcular_dias_pagamentos_existentes() para corrigir pagamentos existentes' as correcao_existentes;
