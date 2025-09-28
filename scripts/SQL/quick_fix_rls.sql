-- =============================================
-- SOLUÇÃO RÁPIDA para erro RLS da tabela programacao
-- =============================================
-- Este script resolve imediatamente o problema de RLS

-- 1. Desabilitar RLS temporariamente
ALTER TABLE programacao DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'programacao';

-- 3. Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE '✅ RLS DESABILITADO para tabela programacao';
    RAISE NOTICE '🧪 TESTE: Tente criar uma programação agora';
    RAISE NOTICE '⚠️ IMPORTANTE: Reabilite o RLS após confirmar que funciona';
END $$;



