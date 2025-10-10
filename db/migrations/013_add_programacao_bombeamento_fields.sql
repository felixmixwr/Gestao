-- Migration 013: Adicionar campos de controle de bombeamento à tabela programacao
-- Data: 2025-10-10
-- Descrição: Adiciona campos para controlar status de bombeamento, telefone e vinculação com relatórios

-- 1. Adicionar campo telefone
ALTER TABLE programacao 
ADD COLUMN IF NOT EXISTS telefone TEXT;

-- 2. Adicionar campo status_bombeamento
ALTER TABLE programacao 
ADD COLUMN IF NOT EXISTS status_bombeamento TEXT CHECK (status_bombeamento IN ('confirmado', 'cancelado'));

-- 3. Adicionar campo report_id para vincular com relatórios
ALTER TABLE programacao 
ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES reports(id);

-- 4. Adicionar campo motivo_cancelamento para armazenar motivo quando cancelado
ALTER TABLE programacao 
ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;

-- 5. Criar índice para report_id
CREATE INDEX IF NOT EXISTS idx_programacao_report_id ON programacao(report_id);

-- 6. Criar índice para status_bombeamento
CREATE INDEX IF NOT EXISTS idx_programacao_status_bombeamento ON programacao(status_bombeamento);

-- Comentários
COMMENT ON COLUMN programacao.telefone IS 'Telefone do cliente para contato';
COMMENT ON COLUMN programacao.status_bombeamento IS 'Status do bombeamento: confirmado ou cancelado';
COMMENT ON COLUMN programacao.report_id IS 'ID do relatório gerado quando bombeamento é confirmado';
COMMENT ON COLUMN programacao.motivo_cancelamento IS 'Motivo do cancelamento quando status_bombeamento = cancelado';

