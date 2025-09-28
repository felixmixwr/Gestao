-- Script para atualizar o campo status da tabela reports com os novos status financeiros
-- Executar este script para migrar do sistema atual para o novo sistema de status financeiros

-- 1. Primeiro, vamos verificar a estrutura atual da tabela
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'status';

-- 2. Atualizar o campo status para aceitar os novos valores
-- Se o campo já existir como ENUM, precisamos recriar
DO $$ 
BEGIN
    -- Verificar se o tipo ENUM existe e recriar se necessário
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        DROP TYPE report_status CASCADE;
    END IF;
    
    -- Criar novo tipo ENUM com os status financeiros
    CREATE TYPE report_status AS ENUM (
        'ENVIADO_FINANCEIRO',
        'RECEBIDO_FINANCEIRO', 
        'NOTA_EMITIDA',
        'AGUARDANDO_PAGAMENTO',
        'PAGO'
    );
    
    -- Atualizar a coluna para usar o novo tipo
    ALTER TABLE reports 
    ALTER COLUMN status TYPE report_status 
    USING CASE 
        WHEN status = 'PENDENTE' THEN 'ENVIADO_FINANCEIRO'::report_status
        WHEN status = 'CONFIRMADO' THEN 'RECEBIDO_FINANCEIRO'::report_status
        WHEN status = 'NOTA_EMITIDA' THEN 'NOTA_EMITIDA'::report_status
        WHEN status = 'PAGO' THEN 'PAGO'::report_status
        ELSE 'ENVIADO_FINANCEIRO'::report_status
    END;
    
    -- Definir valor padrão
    ALTER TABLE reports ALTER COLUMN status SET DEFAULT 'ENVIADO_FINANCEIRO';
    
    -- Adicionar constraint NOT NULL se não existir
    ALTER TABLE reports ALTER COLUMN status SET NOT NULL;
    
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao atualizar tipo de status: %', SQLERRM;
        -- Fallback: usar VARCHAR se ENUM não funcionar
        ALTER TABLE reports ALTER COLUMN status TYPE VARCHAR(50);
        ALTER TABLE reports ALTER COLUMN status SET DEFAULT 'ENVIADO_FINANCEIRO';
END $$;

-- 3. Verificar se a atualização foi bem-sucedida
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'status';

-- 4. Verificar alguns registros para confirmar a migração
SELECT 
    id,
    report_number,
    status,
    created_at
FROM reports 
ORDER BY id ASC 
LIMIT 5;

-- 5. Adicionar coluna paid_at se não existir
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

-- 6. Atualizar registros existentes que podem ter ficado com valores inválidos
UPDATE reports 
SET status = 'ENVIADO_FINANCEIRO' 
WHERE status IS NULL OR status = '';

-- 7. Verificar se todos os registros têm status válido
SELECT 
    status,
    COUNT(*) as quantidade
FROM reports 
GROUP BY status
ORDER BY status;

-- 8. Comentário da coluna para documentação
COMMENT ON COLUMN reports.status IS 'Status financeiro do relatório: ENVIADO_FINANCEIRO (padrão), RECEBIDO_FINANCEIRO, NOTA_EMITIDA, AGUARDANDO_PAGAMENTO, PAGO';

-- 9. Criar índices para melhor performance nas consultas por status
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_status_date ON reports(status, date);

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Campo status atualizado com sucesso!';
    RAISE NOTICE '📊 Novos status disponíveis: ENVIADO_FINANCEIRO, RECEBIDO_FINANCEIRO, NOTA_EMITIDA, AGUARDANDO_PAGAMENTO, PAGO';
    RAISE NOTICE '🔄 Status antigos migrados: PENDENTE → ENVIADO_FINANCEIRO, CONFIRMADO → RECEBIDO_FINANCEIRO';
END $$;
