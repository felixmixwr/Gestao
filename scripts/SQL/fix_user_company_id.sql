-- =============================================
-- Script para corrigir company_id dos usuários
-- =============================================
-- Este script ajuda a resolver problemas com company_id em usuários

-- 1. Verificar estrutura da tabela users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'company_id'
    ) THEN
        RAISE NOTICE '✅ Tabela users tem coluna company_id';
    ELSE
        RAISE NOTICE '❌ Tabela users NÃO tem coluna company_id';
        RAISE NOTICE '💡 Adicionando coluna company_id...';
        
        -- Adicionar coluna company_id se não existir
        ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id);
        RAISE NOTICE '✅ Coluna company_id adicionada à tabela users';
    END IF;
END $$;

-- 2. Listar usuários sem company_id
DO $$
DECLARE
    user_record RECORD;
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count 
    FROM users 
    WHERE company_id IS NULL;
    
    IF user_count > 0 THEN
        RAISE NOTICE '⚠️ Encontrados % usuários sem company_id:', user_count;
        
        FOR user_record IN 
            SELECT id, email, created_at 
            FROM users 
            WHERE company_id IS NULL
            ORDER BY created_at
        LOOP
            RAISE NOTICE '  - Usuário: % (ID: %)', user_record.email, user_record.id;
        END LOOP;
        
        RAISE NOTICE '💡 SOLUÇÃO: Atribua um company_id a estes usuários';
    ELSE
        RAISE NOTICE '✅ Todos os usuários têm company_id definido';
    END IF;
END $$;

-- 3. Listar empresas disponíveis
DO $$
DECLARE
    company_record RECORD;
BEGIN
    RAISE NOTICE '🏢 Empresas disponíveis:';
    
    FOR company_record IN 
        SELECT id, name 
        FROM companies 
        ORDER BY name
    LOOP
        RAISE NOTICE '  - %: %', company_record.name, company_record.id;
    END LOOP;
END $$;

-- 4. Exemplo de como corrigir um usuário específico
-- DESCOMENTE E MODIFIQUE conforme necessário:
/*
-- Exemplo: Atribuir company_id ao usuário atual
UPDATE users 
SET company_id = 'SEU_COMPANY_ID_AQUI' 
WHERE id = auth.uid();

-- Ou atribuir a primeira empresa disponível:
UPDATE users 
SET company_id = (SELECT id FROM companies LIMIT 1)
WHERE company_id IS NULL;
*/

-- 5. Verificar usuário atual
DO $$
DECLARE
    current_user_id UUID;
    user_company_id UUID;
    user_email TEXT;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE '⚠️ Nenhum usuário autenticado no momento';
    ELSE
        SELECT company_id, email INTO user_company_id, user_email
        FROM users 
        WHERE id = current_user_id;
        
        RAISE NOTICE '👤 Usuário atual: %', user_email;
        RAISE NOTICE '🏢 Company ID: %', COALESCE(user_company_id::text, 'NÃO DEFINIDO');
        
        IF user_company_id IS NULL THEN
            RAISE NOTICE '❌ PROBLEMA: Usuário atual não tem company_id!';
            RAISE NOTICE '💡 Execute: UPDATE users SET company_id = ''SEU_COMPANY_ID'' WHERE id = auth.uid();';
        ELSE
            RAISE NOTICE '✅ Usuário atual tem company_id válido';
        END IF;
    END IF;
END $$;

RAISE NOTICE '🎉 Script de verificação executado!';



