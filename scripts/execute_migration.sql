-- Script para executar a migração do campo status
-- Execute este script no Supabase SQL Editor ou no seu cliente SQL

-- Verificar se a coluna status já existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'programacao' AND column_name = 'status';

-- Se a coluna não existir, executar a migração
ALTER TABLE programacao 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'programado' CHECK (status IN ('programado', 'reservado'));

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_programacao_status ON programacao(status);

-- Comentário na coluna
COMMENT ON COLUMN programacao.status IS 'Status da programação: programado (azul) ou reservado (amarelo)';

-- Verificar se a migração foi executada com sucesso
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'programacao' AND column_name = 'status';

-- Atualizar programações existentes que não têm status definido
UPDATE programacao 
SET status = 'programado' 
WHERE status IS NULL;

-- Verificar quantas programações foram atualizadas
SELECT COUNT(*) as total_programacoes, 
       COUNT(CASE WHEN status = 'programado' THEN 1 END) as programadas,
       COUNT(CASE WHEN status = 'reservado' THEN 1 END) as reservadas
FROM programacao;
