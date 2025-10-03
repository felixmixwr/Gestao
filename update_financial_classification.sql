-- Script para atualizar o sistema financeiro com nova classificação de transações
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar nova coluna tipo_transacao na tabela expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS tipo_transacao VARCHAR(20) DEFAULT 'Saída';

-- 2. Adicionar nova coluna relatorio_id para vincular faturamento aos relatórios
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS relatorio_id UUID REFERENCES reports(id);

-- 3. Atualizar registros existentes para definir tipo_transacao baseado no valor
-- Valores negativos (despesas) = Saída, valores positivos (faturamento) = Entrada
UPDATE expenses 
SET tipo_transacao = CASE 
    WHEN valor < 0 THEN 'Saída'
    WHEN valor > 0 THEN 'Entrada'
    ELSE 'Saída'  -- Para valores zero, considerar como Saída
END
WHERE tipo_transacao IS NULL OR tipo_transacao = 'Saída';

-- 4. Criar índice para melhorar performance das consultas por tipo de transação
CREATE INDEX IF NOT EXISTS idx_expenses_tipo_transacao ON expenses(tipo_transacao);
CREATE INDEX IF NOT EXISTS idx_expenses_relatorio_id ON expenses(relatorio_id);

-- 5. Adicionar constraint para garantir que tipo_transacao seja válido
ALTER TABLE expenses 
ADD CONSTRAINT chk_tipo_transacao 
CHECK (tipo_transacao IN ('Entrada', 'Saída'));

-- 6. Atualizar comentários das colunas
COMMENT ON COLUMN expenses.tipo_transacao IS 'Tipo de transação: Entrada (faturamento) ou Saída (despesa)';
COMMENT ON COLUMN expenses.relatorio_id IS 'ID do relatório vinculado (para faturamento automático)';

-- 7. Verificar se a atualização foi bem-sucedida
SELECT 
    tipo_transacao,
    COUNT(*) as quantidade,
    SUM(valor) as valor_total
FROM expenses 
GROUP BY tipo_transacao
ORDER BY tipo_transacao;

-- 8. Mostrar estatísticas das transações
SELECT 
    'Resumo das Transações' as descricao,
    COUNT(*) as total_transacoes,
    SUM(CASE WHEN tipo_transacao = 'Entrada' THEN 1 ELSE 0 END) as entradas,
    SUM(CASE WHEN tipo_transacao = 'Saída' THEN 1 ELSE 0 END) as saidas,
    SUM(CASE WHEN tipo_transacao = 'Entrada' THEN valor ELSE 0 END) as total_entradas,
    SUM(CASE WHEN tipo_transacao = 'Saída' THEN valor ELSE 0 END) as total_saidas,
    SUM(valor) as saldo_final
FROM expenses;

