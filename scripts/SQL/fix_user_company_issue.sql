-- =============================================
-- Script para corrigir problema de company_id dos usuários
-- =============================================
-- Este script resolve o erro RLS "new row violates row-level security policy"

-- 1. Verificar se a tabela users tem coluna company_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'company_id'
    ) THEN
        RAISE NOTICE '❌ Tabela users não tem coluna company_id';
        RAISE NOTICE '💡 Adicionando coluna company_id...';
        
        ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);
        RAISE NOTICE '✅ Coluna company_id adicionada à tabela users';
    ELSE
        RAISE NOTICE '✅ Tabela users já tem coluna company_id';
    END IF;
END $$;

-- 2. Verificar usuários sem company_id
DO $$
DECLARE
    user_count INTEGER;
    current_user_id UUID;
    user_company_id UUID;
    user_email TEXT;
BEGIN
    -- Contar usuários sem company_id
    SELECT COUNT(*) INTO user_count 
    FROM users 
    WHERE company_id IS NULL;
    
    RAISE NOTICE '📊 Usuários sem company_id: %', user_count;
    
    -- Verificar usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT company_id, email INTO user_company_id, user_email
        FROM users 
        WHERE id = current_user_id;
        
        RAISE NOTICE '👤 Usuário atual: %', user_email;
        RAISE NOTICE '🏢 Company ID: %', COALESCE(user_company_id::text, 'NÃO DEFINIDO');
        
        IF user_company_id IS NULL THEN
            RAISE NOTICE '❌ PROBLEMA IDENTIFICADO: Usuário atual não tem company_id!';
        END IF;
    END IF;
END $$;

-- 3. Listar empresas disponíveis
DO $$
DECLARE
    company_record RECORD;
    company_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO company_count FROM companies;
    
    IF company_count > 0 THEN
        RAISE NOTICE '🏢 Empresas disponíveis (%):', company_count;
        
        FOR company_record IN 
            SELECT id, name 
            FROM companies 
            ORDER BY name
        LOOP
            RAISE NOTICE '  - %: %', company_record.name, company_record.id;
        END LOOP;
    ELSE
        RAISE NOTICE '⚠️ Nenhuma empresa encontrada na tabela companies';
    END IF;
END $$;

-- 4. SOLUÇÃO TEMPORÁRIA: Atribuir company_id a usuários sem ele
-- IMPORTANTE: Descomente e modifique conforme necessário
DO $$
DECLARE
    first_company_id UUID;
    updated_users INTEGER;
BEGIN
    -- Pegar o ID da primeira empresa disponível
    SELECT id INTO first_company_id FROM companies LIMIT 1;
    
    IF first_company_id IS NOT NULL THEN
        -- Atualizar usuários sem company_id
        UPDATE users 
        SET company_id = first_company_id
        WHERE company_id IS NULL;
        
        GET DIAGNOSTICS updated_users = ROW_COUNT;
        
        IF updated_users > 0 THEN
            RAISE NOTICE '✅ % usuários atualizados com company_id: %', updated_users, first_company_id;
        ELSE
            RAISE NOTICE '✅ Todos os usuários já têm company_id definido';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Nenhuma empresa encontrada - não é possível atribuir company_id';
    END IF;
END $$;

-- 5. Verificar se o problema foi resolvido
DO $$
DECLARE
    current_user_id UUID;
    user_company_id UUID;
    user_email TEXT;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT company_id, email INTO user_company_id, user_email
        FROM users 
        WHERE id = current_user_id;
        
        IF user_company_id IS NOT NULL THEN
            RAISE NOTICE '✅ PROBLEMA RESOLVIDO: Usuário % agora tem company_id: %', user_email, user_company_id;
        ELSE
            RAISE NOTICE '❌ PROBLEMA PERSISTE: Usuário % ainda não tem company_id', user_email;
        END IF;
    END IF;
END $$;

-- 6. Verificar políticas RLS da tabela programacao
DO $$
DECLARE
    policy_record RECORD;
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'programacao';
    
    RAISE NOTICE '📋 Políticas RLS para programacao: %', policy_count;
    
    FOR policy_record IN 
        SELECT policyname, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'programacao'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '  - %: %', policy_record.policyname, policy_record.cmd;
    END LOOP;
END $$;

-- 7. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '🎉 Script de correção executado!';
    RAISE NOTICE '💡 Agora tente criar uma programação novamente';
END $$;
