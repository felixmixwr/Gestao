-- Adicionar campo status à tabela programacao
-- Valores possíveis: 'programado', 'reservado'
-- Padrão: 'programado' para manter compatibilidade com dados existentes

ALTER TABLE programacao 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'programado' CHECK (status IN ('programado', 'reservado'));

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_programacao_status ON programacao(status);

-- Comentário na coluna
COMMENT ON COLUMN programacao.status IS 'Status da programação: programado (azul) ou reservado (amarelo)';
