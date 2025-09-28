-- Script para criar a tabela de empresas terceiras
-- Empresas externas que possuem bombas terceiras

-- Tabela de empresas terceiras
CREATE TABLE IF NOT EXISTS public.empresas_terceiras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_fantasia TEXT NOT NULL,
    razao_social TEXT,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    endereco TEXT,
    cidade TEXT,
    estado VARCHAR(2),
    cep VARCHAR(10),
    telefone VARCHAR(20),
    email TEXT,
    contato_responsavel TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_empresas_terceiras_cnpj ON public.empresas_terceiras (cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_terceiras_nome_fantasia ON public.empresas_terceiras (nome_fantasia);
CREATE INDEX IF NOT EXISTS idx_empresas_terceiras_cidade ON public.empresas_terceiras (cidade);
CREATE INDEX IF NOT EXISTS idx_empresas_terceiras_estado ON public.empresas_terceiras (estado);

-- Trigger para atualizar 'updated_at'
CREATE TRIGGER update_empresas_terceiras_updated_at
BEFORE UPDATE ON public.empresas_terceiras
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários explicativos
COMMENT ON TABLE public.empresas_terceiras IS 'Tabela para empresas terceiras que possuem bombas alugadas';
COMMENT ON COLUMN public.empresas_terceiras.nome_fantasia IS 'Nome fantasia da empresa terceira';
COMMENT ON COLUMN public.empresas_terceiras.razao_social IS 'Razão social da empresa terceira';
COMMENT ON COLUMN public.empresas_terceiras.cnpj IS 'CNPJ da empresa terceira (formato: XX.XXX.XXX/XXXX-XX)';
COMMENT ON COLUMN public.empresas_terceiras.contato_responsavel IS 'Nome do responsável pela empresa terceira';




