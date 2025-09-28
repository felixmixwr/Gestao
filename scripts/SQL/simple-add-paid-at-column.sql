-- Script SIMPLES para adicionar a coluna paid_at à tabela reports
-- Execute este script se a coluna paid_at não existir

-- 1. Verificar se a coluna paid_at já existe
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'paid_at';

-- 2. Adicionar coluna paid_at se não existir
ALTER TABLE reports ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE NULL;

-- 3. Adicionar comentário na coluna
COMMENT ON COLUMN reports.paid_at IS 'Data e hora em que o relatório foi marcado como pago';

-- 4. Verificar se a coluna foi criada
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'paid_at';

-- 5. Mostrar estrutura da tabela reports
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- Mensagem de sucesso
SELECT '✅ Coluna paid_at adicionada com sucesso!' as resultado;






