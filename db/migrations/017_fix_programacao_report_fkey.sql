-- Migration 017: Corrigir constraint de foreign key entre programacao e reports
-- Data: 2025-10-10
-- Descrição: Adiciona ON DELETE SET NULL para permitir exclusão de relatórios
--            mantendo o registro histórico da programação

-- 1. Remover a constraint antiga
ALTER TABLE programacao 
DROP CONSTRAINT IF EXISTS programacao_report_id_fkey;

-- 2. Recriar a constraint com ON DELETE SET NULL
ALTER TABLE programacao 
ADD CONSTRAINT programacao_report_id_fkey 
FOREIGN KEY (report_id) 
REFERENCES reports(id) 
ON DELETE SET NULL;

-- Comentário explicativo
COMMENT ON CONSTRAINT programacao_report_id_fkey ON programacao IS 
'FK para reports com ON DELETE SET NULL - permite exclusão do relatório mantendo registro histórico da programação';

