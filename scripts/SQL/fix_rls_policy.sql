-- =============================================
-- Script para corrigir política RLS da tabela programacao
-- =============================================
-- Este script corrige problemas com Row Level Security

-- 1. Primeiro, vamos verificar se RLS está habilitado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'programacao' AND relrowsecurity = true
    ) THEN
        ALTER TABLE programacao ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS habilitado para tabela programacao';
    ELSE
        RAISE NOTICE '✅ RLS já está habilitado para tabela programacao';
    END IF;
END $$;

-- 2. Remover políticas existentes que podem estar causando conflito
DO $$
BEGIN
    -- Remover política existente se houver
    DROP POLICY IF EXISTS "Users can only access their company's programacao" ON programacao;
    RAISE NOTICE '✅ Políticas antigas removidas';
END $$;

-- 3. Criar nova política RLS mais robusta
DO $$
BEGIN
    -- Política para INSERT: usuário deve ter company_id válido
    CREATE POLICY "Users can insert programacao for their company" ON programacao
        FOR INSERT WITH CHECK (
            company_id IN (
                SELECT company_id FROM users 
                WHERE id = auth.uid() AND company_id IS NOT NULL
            )
        );
    
    -- Política para SELECT: usuário pode ver apenas dados da sua empresa
    CREATE POLICY "Users can view programacao from their company" ON programacao
        FOR SELECT USING (
            company_id IN (
                SELECT company_id FROM users 
                WHERE id = auth.uid() AND company_id IS NOT NULL
            )
        );
    
    -- Política para UPDATE: usuário pode editar apenas dados da sua empresa
    CREATE POLICY "Users can update programacao from their company" ON programacao
        FOR UPDATE USING (
            company_id IN (
                SELECT company_id FROM users 
                WHERE id = auth.uid() AND company_id IS NOT NULL
            )
        );
    
    -- Política para DELETE: usuário pode deletar apenas dados da sua empresa
    CREATE POLICY "Users can delete programacao from their company" ON programacao
        FOR DELETE USING (
            company_id IN (
                SELECT company_id FROM users 
                WHERE id = auth.uid() AND company_id IS NOT NULL
            )
        );
    
    RAISE NOTICE '✅ Novas políticas RLS criadas com sucesso';
END $$;

-- 4. Verificar se o usuário atual tem company_id
DO $$
DECLARE
    current_user_id UUID;
    user_company_id UUID;
BEGIN
    -- Obter ID do usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE '⚠️ Usuário não autenticado';
    ELSE
        -- Verificar company_id do usuário
        SELECT company_id INTO user_company_id 
        FROM users 
        WHERE id = current_user_id;
        
        IF user_company_id IS NULL THEN
            RAISE NOTICE '⚠️ ATENÇÃO: Usuário % não tem company_id definido', current_user_id;
            RAISE NOTICE '💡 Solução: Atualize a tabela users para definir company_id para este usuário';
        ELSE
            RAISE NOTICE '✅ Usuário % tem company_id: %', current_user_id, user_company_id;
        END IF;
    END IF;
END $$;

-- 5. Verificar estrutura da tabela users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'company_id'
    ) THEN
        RAISE NOTICE '✅ Tabela users tem coluna company_id';
    ELSE
        RAISE NOTICE '❌ Tabela users NÃO tem coluna company_id';
        RAISE NOTICE '💡 Execute: ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);';
    END IF;
END $$;

-- 6. Verificar se existem empresas na tabela companies
DO $$
DECLARE
    company_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO company_count FROM companies;
    
    IF company_count > 0 THEN
        RAISE NOTICE '✅ Existem % empresas na tabela companies', company_count;
    ELSE
        RAISE NOTICE '⚠️ Tabela companies está vazia';
    END IF;
END $$;

-- 7. Mostrar políticas ativas
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '📋 Políticas RLS ativas para tabela programacao:';
    
    FOR policy_record IN 
        SELECT policyname, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'programacao'
    LOOP
        RAISE NOTICE '  - %: %', policy_record.policyname, policy_record.cmd;
    END LOOP;
END $$;

RAISE NOTICE '🎉 Script de correção RLS executado com sucesso!';




