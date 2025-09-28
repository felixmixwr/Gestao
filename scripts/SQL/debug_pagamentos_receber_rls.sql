-- =============================================
-- Script para debugar RLS na tabela pagamentos_receber
-- =============================================

-- 1. Verificar se RLS está ativo na tabela pagamentos_receber
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'pagamentos_receber' 
        AND relrowsecurity = true
    ) THEN
        RAISE NOTICE '✅ RLS está ATIVO na tabela pagamentos_receber';
    ELSE
        RAISE NOTICE '❌ RLS está DESATIVADO na tabela pagamentos_receber';
    END IF;
END $$;

-- 2. Listar todas as políticas RLS na tabela pagamentos_receber
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '📋 Políticas RLS ativas na tabela pagamentos_receber:';
    
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'pagamentos_receber'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '  - Política: %', policy_record.policyname;
        RAISE NOTICE '    Comando: %', policy_record.cmd;
        RAISE NOTICE '    Permissiva: %', policy_record.permissive;
        RAISE NOTICE '    Roles: %', policy_record.roles;
        RAISE NOTICE '    Qual: %', policy_record.qual;
        RAISE NOTICE '    With Check: %', policy_record.with_check;
        RAISE NOTICE '';
    END LOOP;
    
    IF NOT FOUND THEN
        RAISE NOTICE '❌ Nenhuma política RLS encontrada na tabela pagamentos_receber';
    END IF;
END $$;

-- 3. Verificar usuário atual e suas permissões
DO $$
DECLARE
    current_user_name TEXT;
    current_user_id UUID;
BEGIN
    SELECT current_user INTO current_user_name;
    SELECT auth.uid() INTO current_user_id;
    
    RAISE NOTICE '👤 Usuário atual: %', current_user_name;
    RAISE NOTICE '🆔 ID do usuário: %', current_user_id;
END $$;

-- 4. Testar se conseguimos fazer UPDATE na tabela
DO $$
DECLARE
    test_id UUID;
    update_count INTEGER;
BEGIN
    -- Buscar um pagamento para testar
    SELECT id INTO test_id 
    FROM pagamentos_receber 
    LIMIT 1;
    
    IF test_id IS NOT NULL THEN
        RAISE NOTICE '🧪 Testando UPDATE no pagamento ID: %', test_id;
        
        -- Tentar fazer um UPDATE simples
        UPDATE pagamentos_receber 
        SET observacoes = 'Teste de UPDATE - ' || NOW()
        WHERE id = test_id;
        
        GET DIAGNOSTICS update_count = ROW_COUNT;
        
        IF update_count > 0 THEN
            RAISE NOTICE '✅ UPDATE bem-sucedido! % linha(s) atualizada(s)', update_count;
        ELSE
            RAISE NOTICE '❌ UPDATE falhou! Nenhuma linha foi atualizada';
        END IF;
    ELSE
        RAISE NOTICE '❌ Nenhum pagamento encontrado para testar UPDATE';
    END IF;
END $$;

-- 5. Verificar se existe alguma constraint ou trigger que possa estar bloqueando
DO $$
DECLARE
    constraint_record RECORD;
    trigger_record RECORD;
BEGIN
    RAISE NOTICE '🔍 Verificando constraints na tabela pagamentos_receber:';
    
    FOR constraint_record IN 
        SELECT conname, contype
        FROM pg_constraint 
        WHERE conrelid = 'pagamentos_receber'::regclass
    LOOP
        RAISE NOTICE '  - Constraint: % (Tipo: %)', constraint_record.conname, constraint_record.contype;
    END LOOP;
    
    RAISE NOTICE '🔍 Verificando triggers na tabela pagamentos_receber:';
    
    FOR trigger_record IN 
        SELECT tgname, tgenabled, tgtype
        FROM pg_trigger 
        WHERE tgrelid = 'pagamentos_receber'::regclass
        AND NOT tgisinternal
    LOOP
        RAISE NOTICE '  - Trigger: % (Ativo: %)', trigger_record.tgname, trigger_record.tgenabled;
    END LOOP;
END $$;

-- 6. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '🎉 Diagnóstico de RLS concluído!';
    RAISE NOTICE '💡 Se UPDATE falhou, pode ser necessário ajustar as políticas RLS';
END $$;
