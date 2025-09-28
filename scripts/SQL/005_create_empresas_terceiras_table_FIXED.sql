-- Script CORRIGIDO para criar/atualizar a tabela de empresas terceiras
-- Empresas externas que possuem bombas terceiras
-- CORREÇÃO: Verifica se tabela existe e adiciona colunas faltantes

-- Criar tabela empresas_terceiras se não existir
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

-- Adicionar colunas que podem estar faltando (se a tabela já existir)
DO $$ 
BEGIN
    -- Adicionar coluna cidade se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'cidade' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN cidade TEXT;
    END IF;
    
    -- Adicionar coluna estado se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'estado' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN estado VARCHAR(2);
    END IF;
    
    -- Adicionar coluna cep se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'cep' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN cep VARCHAR(10);
    END IF;
    
    -- Adicionar coluna telefone se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'telefone' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN telefone VARCHAR(20);
    END IF;
    
    -- Adicionar coluna email se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'email' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN email TEXT;
    END IF;
    
    -- Adicionar coluna contato_responsavel se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'contato_responsavel' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN contato_responsavel TEXT;
    END IF;
    
    -- Adicionar coluna created_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'created_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Adicionar coluna updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'updated_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Criar índices para otimização (apenas se não existirem)
CREATE INDEX IF NOT EXISTS idx_empresas_terceiras_cnpj ON public.empresas_terceiras (cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_terceiras_nome_fantasia ON public.empresas_terceiras (nome_fantasia);
CREATE INDEX IF NOT EXISTS idx_empresas_terceiras_cidade ON public.empresas_terceiras (cidade);
CREATE INDEX IF NOT EXISTS idx_empresas_terceiras_estado ON public.empresas_terceiras (estado);

-- Criar trigger para atualizar 'updated_at' (apenas se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_empresas_terceiras_updated_at') THEN
        CREATE TRIGGER update_empresas_terceiras_updated_at
        BEFORE UPDATE ON public.empresas_terceiras
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Comentários explicativos
COMMENT ON TABLE public.empresas_terceiras IS 'Tabela para empresas terceiras que possuem bombas alugadas';
COMMENT ON COLUMN public.empresas_terceiras.nome_fantasia IS 'Nome fantasia da empresa terceira';
COMMENT ON COLUMN public.empresas_terceiras.razao_social IS 'Razão social da empresa terceira';
COMMENT ON COLUMN public.empresas_terceiras.cnpj IS 'CNPJ da empresa terceira (formato: XX.XXX.XXX/XXXX-XX)';
COMMENT ON COLUMN public.empresas_terceiras.contato_responsavel IS 'Nome do responsável pela empresa terceira';




