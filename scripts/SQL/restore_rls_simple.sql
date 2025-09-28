-- =============================================
-- Reabilitar RLS com políticas simples
-- =============================================
-- Execute este script após confirmar que a criação funciona

-- 1. Habilitar RLS
ALTER TABLE programacao ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas
DROP POLICY IF EXISTS "programacao_insert_policy" ON programacao;
DROP POLICY IF EXISTS "programacao_select_policy" ON programacao;
DROP POLICY IF EXISTS "programacao_update_policy" ON programacao;
DROP POLICY IF EXISTS "programacao_delete_policy" ON programacao;
DROP POLICY IF EXISTS "Users can insert programacao for their company" ON programacao;
DROP POLICY IF EXISTS "Users can view programacao from their company" ON programacao;
DROP POLICY IF EXISTS "Users can update programacao from their company" ON programacao;
DROP POLICY IF EXISTS "Users can delete programacao from their company" ON programacao;

-- 3. Criar políticas simples (permitem tudo para usuários autenticados)
CREATE POLICY "programacao_insert_policy" ON programacao
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "programacao_select_policy" ON programacao
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "programacao_update_policy" ON programacao
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "programacao_delete_policy" ON programacao
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- 4. Verificar se foi aplicado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'programacao';

-- 5. Listar políticas criadas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'programacao'
ORDER BY policyname;

-- 6. Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE '✅ RLS reabilitado com políticas simples';
    RAISE NOTICE '🔒 Apenas usuários autenticados podem acessar';
    RAISE NOTICE '💡 Teste criar uma programação novamente';
END $$;



