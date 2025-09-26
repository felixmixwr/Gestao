-- =============================================
-- Script para adicionar coluna cliente_id
-- =============================================
-- Este script adiciona a coluna cliente_id à tabela programacao
-- se ela não existir.

-- Verificar se a coluna cliente_id existe e adicioná-la se necessário
DO $$
BEGIN
    -- Verificar se a coluna cliente_id existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'programacao' 
        AND column_name = 'cliente_id'
    ) THEN
        -- Adicionar a coluna cliente_id
        ALTER TABLE programacao 
        ADD COLUMN cliente_id UUID REFERENCES clients(id);
        
        RAISE NOTICE '✅ Coluna cliente_id adicionada à tabela programacao';
        
        -- Criar índice para a nova coluna
        CREATE INDEX IF NOT EXISTS idx_programacao_cliente_id ON programacao(cliente_id);
        
        RAISE NOTICE '✅ Índice criado para cliente_id';
    ELSE
        RAISE NOTICE '✅ Coluna cliente_id já existe na tabela programacao';
    END IF;
END $$;

-- Verificar se a coluna cliente existe para compatibilidade
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'programacao' 
        AND column_name = 'cliente'
    ) THEN
        -- Adicionar a coluna cliente para compatibilidade
        ALTER TABLE programacao 
        ADD COLUMN cliente TEXT;
        
        RAISE NOTICE '✅ Coluna cliente adicionada para compatibilidade';
    ELSE
        RAISE NOTICE '✅ Coluna cliente já existe na tabela programacao';
    END IF;
END $$;

-- Verificar estrutura final
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'programacao';
    
    RAISE NOTICE '📊 Tabela programacao tem % colunas', column_count;
    RAISE NOTICE '🎉 Script executado com sucesso!';
END $$;


