-- =============================================
-- Corrigir problema da coluna cliente obrigatória
-- =============================================
-- Este script torna a coluna cliente opcional ou adiciona valor padrão

-- 1. Verificar estrutura atual da tabela programacao
DO $$
DECLARE
    column_record RECORD;
BEGIN
    RAISE NOTICE '📋 Estrutura atual da tabela programacao:';
    
    FOR column_record IN 
        SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
        FROM information_schema.columns 
        WHERE table_name = 'programacao'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (nullable: %, default: %)', 
            column_record.column_name, 
            column_record.data_type,
            column_record.is_nullable,
            COALESCE(column_record.column_default, 'N/A');
    END LOOP;
END $$;

-- 2. Opção 1: Tornar coluna cliente opcional (recomendado)
DO $$
BEGIN
    ALTER TABLE programacao ALTER COLUMN cliente DROP NOT NULL;
    RAISE NOTICE '✅ Coluna cliente agora é opcional';
END $$;

-- 3. Opção 2: Adicionar valor padrão (alternativa)
-- Descomente se preferir valor padrão em vez de NULL
/*
DO $$
BEGIN
    ALTER TABLE programacao ALTER COLUMN cliente SET DEFAULT 'Cliente não informado';
    RAISE NOTICE '✅ Valor padrão adicionado à coluna cliente';
END $$;
*/

-- 4. Verificar se a alteração foi aplicada
DO $$
DECLARE
    cliente_nullable TEXT;
BEGIN
    SELECT is_nullable INTO cliente_nullable
    FROM information_schema.columns 
    WHERE table_name = 'programacao' AND column_name = 'cliente';
    
    IF cliente_nullable = 'YES' THEN
        RAISE NOTICE '✅ Coluna cliente agora permite valores NULL';
    ELSE
        RAISE NOTICE '❌ Coluna cliente ainda é obrigatória';
    END IF;
END $$;

-- 5. Verificar se existem registros com cliente NULL
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM programacao 
    WHERE cliente IS NULL;
    
    IF null_count > 0 THEN
        RAISE NOTICE '📊 Existem % registros com cliente NULL', null_count;
    ELSE
        RAISE NOTICE '✅ Nenhum registro com cliente NULL encontrado';
    END IF;
END $$;

DO $$
BEGIN
    RAISE NOTICE '🎉 Correção aplicada!';
    RAISE NOTICE '💡 Agora teste criar uma programação novamente';
END $$;



