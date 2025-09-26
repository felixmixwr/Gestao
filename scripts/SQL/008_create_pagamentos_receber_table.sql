-- Script para criar a tabela de pagamentos a receber
-- Criado automaticamente quando relatório muda para "aguardando pagamento"

-- Enum para forma de pagamento
DO $$ BEGIN
    CREATE TYPE public.forma_pagamento AS ENUM ('pix', 'boleto', 'a_vista');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Enum para status do pagamento
DO $$ BEGIN
    CREATE TYPE public.status_pagamento AS ENUM ('aguardando', 'proximo_vencimento', 'vencido', 'pago');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Tabela principal de pagamentos a receber
CREATE TABLE IF NOT EXISTS public.pagamentos_receber (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relatorio_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    empresa_id UUID, -- Pode ser de companies ou empresas_terceiras
    empresa_tipo TEXT CHECK (empresa_tipo IN ('interna', 'terceira')), -- Define se é empresa interna ou terceira
    valor_total DECIMAL(10,2) NOT NULL,
    forma_pagamento forma_pagamento NOT NULL,
    prazo_data DATE,
    prazo_dias INT,
    status status_pagamento DEFAULT 'aguardando'::public.status_pagamento,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_pagamentos_receber_relatorio_id ON public.pagamentos_receber (relatorio_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_receber_cliente_id ON public.pagamentos_receber (cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_receber_empresa_id ON public.pagamentos_receber (empresa_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_receber_status ON public.pagamentos_receber (status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_receber_prazo_data ON public.pagamentos_receber (prazo_data);
CREATE INDEX IF NOT EXISTS idx_pagamentos_receber_forma_pagamento ON public.pagamentos_receber (forma_pagamento);

-- Trigger para atualizar 'updated_at'
CREATE TRIGGER update_pagamentos_receber_updated_at
BEFORE UPDATE ON public.pagamentos_receber
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- View para facilitar consultas com dados relacionados
CREATE OR REPLACE VIEW public.view_pagamentos_receber_completo AS
SELECT
    pr.id,
    pr.relatorio_id,
    pr.cliente_id,
    pr.empresa_id,
    pr.empresa_tipo,
    pr.valor_total,
    pr.forma_pagamento,
    pr.prazo_data,
    pr.prazo_dias,
    pr.status,
    pr.observacoes,
    pr.created_at,
    pr.updated_at,
    -- Dados do cliente
    c.name AS cliente_nome,
    c.email AS cliente_email,
    c.phone AS cliente_telefone,
    -- Dados do relatório
    r.date AS relatorio_data,
    r.total_value AS relatorio_valor,
    -- Dados da empresa (interna ou terceira)
    CASE 
        WHEN pr.empresa_tipo = 'interna' THEN co.name
        WHEN pr.empresa_tipo = 'terceira' THEN et.nome_fantasia
        ELSE NULL
    END AS empresa_nome,
    CASE 
        WHEN pr.empresa_tipo = 'interna' THEN NULL -- companies não possui CNPJ
        WHEN pr.empresa_tipo = 'terceira' THEN et.cnpj
        ELSE NULL
    END AS empresa_cnpj
FROM
    public.pagamentos_receber pr
JOIN
    public.clients c ON pr.cliente_id = c.id
JOIN
    public.reports r ON pr.relatorio_id = r.id
LEFT JOIN
    public.companies co ON pr.empresa_id = co.id AND pr.empresa_tipo = 'interna'
LEFT JOIN
    public.empresas_terceiras et ON pr.empresa_id = et.id AND pr.empresa_tipo = 'terceira';

-- Função para atualizar status baseado na data
CREATE OR REPLACE FUNCTION update_status_pagamento()
RETURNS TRIGGER AS $$
BEGIN
    -- Se tem prazo_data definido, atualiza status baseado na data
    IF NEW.prazo_data IS NOT NULL THEN
        IF NEW.prazo_data < CURRENT_DATE THEN
            NEW.status = 'vencido'::public.status_pagamento;
        ELSIF NEW.prazo_data <= CURRENT_DATE + INTERVAL '3 days' THEN
            NEW.status = 'proximo_vencimento'::public.status_pagamento;
        ELSE
            NEW.status = 'aguardando'::public.status_pagamento;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar status automaticamente
CREATE TRIGGER update_status_pagamento_trigger
BEFORE INSERT OR UPDATE ON public.pagamentos_receber
FOR EACH ROW
EXECUTE FUNCTION update_status_pagamento();

-- Função para criar pagamento automaticamente quando relatório muda para "aguardando pagamento"
CREATE OR REPLACE FUNCTION criar_pagamento_automatico()
RETURNS TRIGGER AS $$
DECLARE
    cliente_uuid UUID;
    empresa_uuid UUID;
    empresa_tipo_val TEXT;
BEGIN
    -- Só cria pagamento se o status mudou para "aguardando pagamento"
    IF NEW.status = 'aguardando_pagamento' AND (OLD.status IS NULL OR OLD.status != 'aguardando_pagamento') THEN
        
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
            'Pagamento criado automaticamente'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar pagamento automaticamente
CREATE TRIGGER criar_pagamento_automatico_trigger
AFTER UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION criar_pagamento_automatico();

-- Comentários explicativos
COMMENT ON TABLE public.pagamentos_receber IS 'Tabela para gerenciar pagamentos a receber criados automaticamente';
COMMENT ON COLUMN public.pagamentos_receber.empresa_tipo IS 'Define se a empresa é interna (companies) ou terceira (empresas_terceiras)';
COMMENT ON COLUMN public.pagamentos_receber.prazo_data IS 'Data limite para pagamento';
COMMENT ON COLUMN public.pagamentos_receber.prazo_dias IS 'Número de dias para pagamento (usado quando prazo_data não está definido)';
COMMENT ON COLUMN public.pagamentos_receber.status IS 'Status automático baseado na data: aguardando, proximo_vencimento, vencido, pago';
