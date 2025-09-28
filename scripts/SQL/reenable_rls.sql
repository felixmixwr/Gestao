-- =============================================
-- Script para reabilitar RLS com políticas corretas
-- =============================================
-- Execute este script após testar com RLS desabilitado

-- 1. Remover políticas antigas
DO $$
BEGIN
    DROP POLICY IF EXISTS "programacao_insert_policy" ON programacao;
    DROP POLICY IF EXISTS "programacao_select_policy" ON programacao;
    DROP POLICY IF EXISTS "programacao_update_policy" ON programacao;
    DROP POLICY IF EXISTS "programacao_delete_policy" ON programacao;
    RAISE NOTICE '✅ Políticas antigas removidas';
END $$;

-- 2. Habilitar RLS
DO $$
BEGIN
    ALTER TABLE programacao ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS habilitado para tabela programacao';
END $$;

-- 3. Criar políticas RLS corretas
DO $$
BEGIN
    -- Política para INSERT - mais permissiva para teste
    CREATE POLICY "programacao_insert_policy" ON programacao
        FOR INSERT WITH CHECK (true);
    
    -- Política para SELECT
    CREATE POLICY "programacao_select_policy" ON programacao
        FOR SELECT USING (true);
    
    -- Política para UPDATE
    CREATE POLICY "programacao_update_policy" ON programacao
        FOR UPDATE USING (true);
    
    -- Política para DELETE
    CREATE POLICY "programacao_delete_policy" ON programacao
        FOR DELETE USING (true);
    
    RAISE NOTICE '✅ Políticas RLS criadas (permissivas para teste)';
END $$;

-- 4. Verificar políticas criadas
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '📋 Políticas RLS ativas:';
    
    FOR policy_record IN 
        SELECT policyname, cmd
        FROM pg_policies 
        WHERE tablename = 'programacao'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '  ✅ %: %', policy_record.policyname, policy_record.cmd;
    END LOOP;
END $$;

-- 5. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '🎉 RLS reabilitado com políticas permissivas';
    RAISE NOTICE '💡 Agora teste criar uma programação';
    RAISE NOTICE '⚠️ IMPORTANTE: Configure políticas mais restritivas em produção!';
END $$;
