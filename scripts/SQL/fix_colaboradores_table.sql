-- =============================================
-- Script para Corrigir Tabela Colaboradores
-- =============================================
-- Este script verifica e corrige a estrutura da tabela colaboradores
-- para ser compatível com o módulo de programação.

-- Verificar estrutura atual da tabela colaboradores
DO $$
BEGIN
    RAISE NOTICE '🔍 Verificando estrutura da tabela colaboradores...';
    
    -- Listar todas as colunas existentes
    RAISE NOTICE 'Colunas existentes:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'colaboradores' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - % (%) [nullable: %]', rec.column_name, rec.data_type, rec.is_nullable;
    END LOOP;
END $$;

-- Adicionar colunas necessárias se não existirem
DO $$
BEGIN
    -- Adicionar coluna cargo se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'colaboradores' AND column_name = 'cargo'
    ) THEN
        ALTER TABLE colaboradores ADD COLUMN cargo TEXT;
        RAISE NOTICE '✅ Coluna cargo adicionada';
        
        -- Se existe coluna funcao, copiar os valores
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'colaboradores' AND column_name = 'funcao'
        ) THEN
            UPDATE colaboradores SET cargo = funcao WHERE cargo IS NULL;
            RAISE NOTICE '✅ Valores copiados de funcao para cargo';
        END IF;
    ELSE
        RAISE NOTICE '✅ Coluna cargo já existe';
    END IF;
    
    -- Adicionar coluna company_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'colaboradores' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE colaboradores ADD COLUMN company_id UUID REFERENCES companies(id);
        RAISE NOTICE '✅ Coluna company_id adicionada';
    ELSE
        RAISE NOTICE '✅ Coluna company_id já existe';
    END IF;
    
    -- Adicionar coluna ativo se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'colaboradores' AND column_name = 'ativo'
    ) THEN
        ALTER TABLE colaboradores ADD COLUMN ativo BOOLEAN DEFAULT true;
        UPDATE colaboradores SET ativo = true WHERE ativo IS NULL;
        RAISE NOTICE '✅ Coluna ativo adicionada';
    ELSE
        RAISE NOTICE '✅ Coluna ativo já existe';
    END IF;
    
    -- Adicionar coluna telefone se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'colaboradores' AND column_name = 'telefone'
    ) THEN
        ALTER TABLE colaboradores ADD COLUMN telefone TEXT;
        RAISE NOTICE '✅ Coluna telefone adicionada';
    ELSE
        RAISE NOTICE '✅ Coluna telefone já existe';
    END IF;
    
    -- Adicionar coluna email se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'colaboradores' AND column_name = 'email'
    ) THEN
        ALTER TABLE colaboradores ADD COLUMN email TEXT;
        RAISE NOTICE '✅ Coluna email adicionada';
    ELSE
        RAISE NOTICE '✅ Coluna email já existe';
    END IF;
    
    -- Adicionar colunas de timestamp se não existirem
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'colaboradores' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE colaboradores ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Coluna created_at adicionada';
    ELSE
        RAISE NOTICE '✅ Coluna created_at já existe';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'colaboradores' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE colaboradores ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Coluna updated_at adicionada';
    ELSE
        RAISE NOTICE '✅ Coluna updated_at já existe';
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_colaboradores_nome ON colaboradores(nome);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo ON colaboradores(cargo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_company_id ON colaboradores(company_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_ativo ON colaboradores(ativo);

-- Configurar RLS se não estiver ativo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'colaboradores' AND relrowsecurity = true
    ) THEN
        ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS ativado para colaboradores';
    ELSE
        RAISE NOTICE '✅ RLS já está ativo para colaboradores';
    END IF;
END $$;

-- Criar política RLS se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'colaboradores' AND policyname = 'Users can only access their company''s colaboradores'
    ) THEN
        CREATE POLICY "Users can only access their company's colaboradores" ON colaboradores
            FOR ALL USING (
                company_id IN (
                    SELECT company_id FROM users 
                    WHERE id = auth.uid()
                )
            );
        RAISE NOTICE '✅ Política RLS criada para colaboradores';
    ELSE
        RAISE NOTICE '✅ Política RLS já existe para colaboradores';
    END IF;
END $$;

-- Criar trigger para updated_at se não existir
CREATE OR REPLACE FUNCTION update_colaboradores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_colaboradores_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_colaboradores_updated_at
            BEFORE UPDATE ON colaboradores
            FOR EACH ROW
            EXECUTE FUNCTION update_colaboradores_updated_at();
        RAISE NOTICE '✅ Trigger updated_at criado para colaboradores';
    ELSE
        RAISE NOTICE '✅ Trigger updated_at já existe para colaboradores';
    END IF;
END $$;

-- Verificar resultado final
DO $$
DECLARE
    total_colaboradores INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_colaboradores FROM colaboradores;
    RAISE NOTICE '🎉 Tabela colaboradores configurada com sucesso!';
    RAISE NOTICE '📊 Total de colaboradores: %', total_colaboradores;
    
    -- Verificar se há colaboradores com cargo vazio
    IF EXISTS (SELECT 1 FROM colaboradores WHERE cargo IS NULL OR cargo = '') THEN
        RAISE NOTICE '⚠️  Alguns colaboradores não têm cargo definido';
    END IF;
END $$;

