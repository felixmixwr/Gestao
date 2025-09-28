-- Script para adicionar a coluna paid_at à tabela reports
-- Execute este script se a coluna paid_at não existir

-- 1. Verificar se a coluna paid_at já existe
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'paid_at';

-- 2. Adicionar coluna paid_at se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reports' AND column_name = 'paid_at'
    ) THEN
        ALTER TABLE reports ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE NULL;
        COMMENT ON COLUMN reports.paid_at IS 'Data e hora em que o relatório foi marcado como pago';
        RAISE NOTICE '✅ Coluna paid_at adicionada à tabela reports';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna paid_at já existe na tabela reports';
    END IF;
END $$;

-- 3. Verificar se a coluna foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'paid_at';

-- 4. Verificar se existem relatórios com status PAGO para teste
SELECT 
    COUNT(*) as total_pagos,
    'Relatórios com status PAGO encontrados' as info
FROM reports 
WHERE status = 'PAGO';

-- 5. Mostrar alguns relatórios para verificar a estrutura
SELECT 
    id,
    report_number,
    status,
    CASE 
        WHEN paid_at IS NOT NULL THEN paid_at::TEXT
        ELSE 'NULL'
    END as paid_at
FROM reports 
ORDER BY id ASC
LIMIT 3;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Script de adição da coluna paid_at executado com sucesso!';
    RAISE NOTICE '📅 Coluna paid_at: TIMESTAMP WITH TIME ZONE NULL';
    RAISE NOTICE '💡 Esta coluna armazena quando o relatório foi marcado como PAGO';
END $$;
