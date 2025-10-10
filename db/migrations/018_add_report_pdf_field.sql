-- Migration 018: Adicionar campo para PDF escaneado na tabela reports
-- Data: 2025-10-10
-- Descrição: Adiciona campo para armazenar URL do relatório em PDF escaneado

-- Adicionar campo pdf_url para armazenar o PDF escaneado do relatório
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Criar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_reports_pdf_url ON reports(pdf_url) WHERE pdf_url IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN reports.pdf_url IS 'URL do arquivo PDF escaneado do relatório físico de bombeamento';

