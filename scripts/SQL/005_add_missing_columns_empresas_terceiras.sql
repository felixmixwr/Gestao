-- Script para adicionar colunas faltantes na tabela empresas_terceiras
-- Use este script se a tabela já existe mas está faltando algumas colunas

-- Adicionar colunas que podem estar faltando
DO $$ 
BEGIN
    -- Adicionar coluna cidade se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'cidade' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN cidade TEXT;
        RAISE NOTICE 'Coluna cidade adicionada à tabela empresas_terceiras';
    ELSE
        RAISE NOTICE 'Coluna cidade já existe na tabela empresas_terceiras';
    END IF;
    
    -- Adicionar coluna estado se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'estado' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN estado VARCHAR(2);
        RAISE NOTICE 'Coluna estado adicionada à tabela empresas_terceiras';
    ELSE
        RAISE NOTICE 'Coluna estado já existe na tabela empresas_terceiras';
    END IF;
    
    -- Adicionar coluna cep se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'cep' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN cep VARCHAR(10);
        RAISE NOTICE 'Coluna cep adicionada à tabela empresas_terceiras';
    ELSE
        RAISE NOTICE 'Coluna cep já existe na tabela empresas_terceiras';
    END IF;
    
    -- Adicionar coluna telefone se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'telefone' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN telefone VARCHAR(20);
        RAISE NOTICE 'Coluna telefone adicionada à tabela empresas_terceiras';
    ELSE
        RAISE NOTICE 'Coluna telefone já existe na tabela empresas_terceiras';
    END IF;
    
    -- Adicionar coluna email se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'email' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN email TEXT;
        RAISE NOTICE 'Coluna email adicionada à tabela empresas_terceiras';
    ELSE
        RAISE NOTICE 'Coluna email já existe na tabela empresas_terceiras';
    END IF;
    
    -- Adicionar coluna contato_responsavel se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'contato_responsavel' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN contato_responsavel TEXT;
        RAISE NOTICE 'Coluna contato_responsavel adicionada à tabela empresas_terceiras';
    ELSE
        RAISE NOTICE 'Coluna contato_responsavel já existe na tabela empresas_terceiras';
    END IF;
    
    -- Adicionar coluna created_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'created_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna created_at adicionada à tabela empresas_terceiras';
    ELSE
        RAISE NOTICE 'Coluna created_at já existe na tabela empresas_terceiras';
    END IF;
    
    -- Adicionar coluna updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'empresas_terceiras' 
                   AND column_name = 'updated_at' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.empresas_terceiras ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada à tabela empresas_terceiras';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe na tabela empresas_terceiras';
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
        RAISE NOTICE 'Trigger update_empresas_terceiras_updated_at criado';
    ELSE
        RAISE NOTICE 'Trigger update_empresas_terceiras_updated_at já existe';
    END IF;
END $$;




