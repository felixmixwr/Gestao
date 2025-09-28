-- =============================================
-- Script para desabilitar temporariamente RLS
-- =============================================
-- ATENÇÃO: Este script desabilita RLS temporariamente para teste
-- Execute o script de correção após o teste

-- 1. Desabilitar RLS temporariamente
DO $$
BEGIN
    ALTER TABLE programacao DISABLE ROW LEVEL SECURITY;
    RAISE NOTICE '⚠️ RLS DESABILITADO temporariamente para tabela programacao';
    RAISE NOTICE '💡 Isso permite inserções sem verificação de company_id';
    RAISE NOTICE '🔒 IMPORTANTE: Reabilite o RLS após o teste!';
END $$;

-- 2. Verificar status do RLS
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'programacao' AND relrowsecurity = false
    ) THEN
        RAISE NOTICE '✅ RLS está DESABILITADO para programacao';
    ELSE
        RAISE NOTICE '❌ RLS ainda está habilitado';
    END IF;
END $$;

-- 3. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '🧪 TESTE: Tente criar uma programação agora';
    RAISE NOTICE '⚠️ LEMBRE-SE: Execute o script de reabilitação após o teste!';
END $$;
