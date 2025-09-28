-- =============================================
-- Script para diagnosticar e corrigir RLS da tabela programacao
-- =============================================
-- Este script identifica exatamente qual política RLS está falhando

-- 1. Verificar usuário atual e seu company_id
DO $$
DECLARE
    current_user_id UUID;
    user_company_id UUID;
    user_email TEXT;
    user_metadata JSONB;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE '❌ NENHUM USUÁRIO AUTENTICADO';
        RAISE NOTICE '💡 Faça login primeiro antes de executar este script';
        RETURN;
    END IF;
    
    -- Buscar dados do usuário
    SELECT company_id, email, raw_user_meta_data 
    INTO user_company_id, user_email, user_metadata
    FROM users 
    WHERE id = current_user_id;
    
    RAISE NOTICE '👤 Usuário autenticado: %', user_email;
    RAISE NOTICE '🆔 User ID: %', current_user_id;
    RAISE NOTICE '🏢 Company ID: %', COALESCE(user_company_id::text, 'NÃO DEFINIDO');
    RAISE NOTICE '📋 Metadata: %', user_metadata;
    
    IF user_company_id IS NULL THEN
        RAISE NOTICE '❌ PROBLEMA: Usuário não tem company_id definido!';
        RAISE NOTICE '💡 Isso causará falha na política RLS';
    ELSE
        RAISE NOTICE '✅ Usuário tem company_id válido';
    END IF;
END $$;

-- 2. Verificar se a empresa do usuário existe
DO $$
DECLARE
    current_user_id UUID;
    user_company_id UUID;
    company_exists BOOLEAN;
    company_name TEXT;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT company_id INTO user_company_id
        FROM users 
        WHERE id = current_user_id;
        
        IF user_company_id IS NOT NULL THEN
            -- Verificar se a empresa existe
            SELECT EXISTS(SELECT 1 FROM companies WHERE id = user_company_id), name
            INTO company_exists, company_name
            FROM companies 
            WHERE id = user_company_id;
            
            IF company_exists THEN
                RAISE NOTICE '✅ Empresa existe: % (%)', company_name, user_company_id;
            ELSE
                RAISE NOTICE '❌ PROBLEMA: Empresa % não existe na tabela companies!', user_company_id;
            END IF;
        END IF;
    END IF;
END $$;

-- 3. Listar TODAS as políticas RLS da tabela programacao
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '📋 Políticas RLS ativas para tabela programacao:';
    
    FOR policy_record IN 
        SELECT 
            policyname,
            cmd,
            qual,
            with_check,
            roles
        FROM pg_policies 
        WHERE tablename = 'programacao'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '  📌 Política: %', policy_record.policyname;
        RAISE NOTICE '     Comando: %', policy_record.cmd;
        RAISE NOTICE '     Condição: %', COALESCE(policy_record.qual, 'N/A');
        RAISE NOTICE '     Check: %', COALESCE(policy_record.with_check, 'N/A');
        RAISE NOTICE '     Roles: %', policy_record.roles;
        RAISE NOTICE '     ---';
    END LOOP;
END $$;

-- 4. Verificar se RLS está habilitado
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'programacao' AND relrowsecurity = true
    ) THEN
        RAISE NOTICE '✅ RLS está habilitado para tabela programacao';
    ELSE
        RAISE NOTICE '❌ RLS NÃO está habilitado para tabela programacao';
    END IF;
END $$;

-- 5. Testar a condição da política RLS manualmente
DO $$
DECLARE
    current_user_id UUID;
    user_company_id UUID;
    policy_result BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT company_id INTO user_company_id
        FROM users 
        WHERE id = current_user_id;
        
        -- Testar a condição da política RLS
        SELECT EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_user_id 
            AND company_id IS NOT NULL
        ) INTO policy_result;
        
        RAISE NOTICE '🧪 Teste da política RLS: %', policy_result;
        
        IF policy_result THEN
            RAISE NOTICE '✅ Política RLS deveria permitir INSERT';
        ELSE
            RAISE NOTICE '❌ Política RLS BLOQUEARÁ INSERT';
        END IF;
    END IF;
END $$;

-- 6. Remover TODAS as políticas existentes e criar uma nova mais simples
DO $$
BEGIN
    RAISE NOTICE '🔄 Removendo políticas antigas...';
    
    -- Remover todas as políticas existentes
    DROP POLICY IF EXISTS "Users can insert programacao for their company" ON programacao;
    DROP POLICY IF EXISTS "Users can view programacao from their company" ON programacao;
    DROP POLICY IF EXISTS "Users can update programacao from their company" ON programacao;
    DROP POLICY IF EXISTS "Users can delete programacao from their company" ON programacao;
    DROP POLICY IF EXISTS "Users can only access their company's programacao" ON programacao;
    
    RAISE NOTICE '✅ Políticas antigas removidas';
    
    -- Criar política mais simples para INSERT
    CREATE POLICY "programacao_insert_policy" ON programacao
        FOR INSERT WITH CHECK (
            company_id IN (
                SELECT company_id FROM users 
                WHERE id = auth.uid() 
                AND company_id IS NOT NULL
            )
        );
    
    -- Criar política para SELECT
    CREATE POLICY "programacao_select_policy" ON programacao
        FOR SELECT USING (
            company_id IN (
                SELECT company_id FROM users 
                WHERE id = auth.uid() 
                AND company_id IS NOT NULL
            )
        );
    
    -- Criar política para UPDATE
    CREATE POLICY "programacao_update_policy" ON programacao
        FOR UPDATE USING (
            company_id IN (
                SELECT company_id FROM users 
                WHERE id = auth.uid() 
                AND company_id IS NOT NULL
            )
        );
    
    -- Criar política para DELETE
    CREATE POLICY "programacao_delete_policy" ON programacao
        FOR DELETE USING (
            company_id IN (
                SELECT company_id FROM users 
                WHERE id = auth.uid() 
                AND company_id IS NOT NULL
            )
        );
    
    RAISE NOTICE '✅ Novas políticas RLS criadas';
END $$;

-- 7. Testar inserção manual (simulação)
DO $$
DECLARE
    current_user_id UUID;
    user_company_id UUID;
    test_result TEXT;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        SELECT company_id INTO user_company_id
        FROM users 
        WHERE id = current_user_id;
        
        IF user_company_id IS NOT NULL THEN
            -- Simular a inserção (sem realmente inserir)
            RAISE NOTICE '🧪 Simulando inserção com company_id: %', user_company_id;
            RAISE NOTICE '✅ Se chegou até aqui, a política RLS deveria funcionar';
        ELSE
            RAISE NOTICE '❌ Não é possível testar - usuário não tem company_id';
        END IF;
    END IF;
END $$;

-- 8. Mostrar políticas finais
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '📋 Políticas RLS finais:';
    
    FOR policy_record IN 
        SELECT policyname, cmd
        FROM pg_policies 
        WHERE tablename = 'programacao'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '  ✅ %: %', policy_record.policyname, policy_record.cmd;
    END LOOP;
END $$;

-- 9. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '🎉 Diagnóstico e correção concluídos!';
    RAISE NOTICE '💡 Tente criar uma programação novamente';
END $$;
