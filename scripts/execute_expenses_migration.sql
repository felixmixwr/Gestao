-- Script corrigido para executar a migração da tabela expenses
-- Execute este script no SQL Editor do Supabase

-- Migration 012: Create expenses table for financial module (CORRIGIDA)
-- Created: 2025-01-29
-- Description: Creates the expenses table to store financial expenses data

-- 1. Primeiro, verificar se as tabelas dependentes existem
DO $$
BEGIN
    -- Verificar se a tabela pumps existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pumps') THEN
        RAISE EXCEPTION 'Tabela pumps não existe. Execute primeiro a migração das bombas.';
    END IF;
    
    -- Verificar se a tabela companies existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        RAISE EXCEPTION 'Tabela companies não existe. Execute primeiro a migração das empresas.';
    END IF;
    
    RAISE NOTICE 'Todas as tabelas dependentes existem. Prosseguindo com a criação da tabela expenses...';
END $$;

-- 2. Remover a tabela expenses se ela existir (para recriar do zero)
DROP TABLE IF EXISTS expenses CASCADE;

-- 3. Criar a tabela expenses
CREATE TABLE expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('Mão de obra', 'Diesel', 'Manutenção', 'Imposto', 'Outros')),
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    tipo_custo TEXT NOT NULL CHECK (tipo_custo IN ('fixo', 'variável')),
    data_despesa DATE NOT NULL,
    pump_id UUID NOT NULL REFERENCES pumps(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
    quilometragem_atual INTEGER,
    quantidade_litros DECIMAL(8,2),
    custo_por_litro DECIMAL(8,2),
    nota_fiscal_id UUID REFERENCES notas_fiscais(id) ON DELETE SET NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices para melhor performance
CREATE INDEX idx_expenses_company_id ON expenses(company_id);
CREATE INDEX idx_expenses_pump_id ON expenses(pump_id);
CREATE INDEX idx_expenses_categoria ON expenses(categoria);
CREATE INDEX idx_expenses_data_despesa ON expenses(data_despesa);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_tipo_custo ON expenses(tipo_custo);
CREATE INDEX idx_expenses_nota_fiscal_id ON expenses(nota_fiscal_id);

-- 5. Criar índices compostos para consultas comuns
CREATE INDEX idx_expenses_company_data ON expenses(company_id, data_despesa);
CREATE INDEX idx_expenses_pump_data ON expenses(pump_id, data_despesa);
CREATE INDEX idx_expenses_categoria_data ON expenses(categoria, data_despesa);

-- 6. Criar função para atualizar updated_at timestamp
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_expenses_updated_at();

-- 8. Adicionar comentários à tabela e colunas
COMMENT ON TABLE expenses IS 'Tabela para armazenar despesas financeiras do sistema';
COMMENT ON COLUMN expenses.id IS 'Identificador único da despesa';
COMMENT ON COLUMN expenses.descricao IS 'Descrição da despesa';
COMMENT ON COLUMN expenses.categoria IS 'Categoria da despesa (Mão de obra, Diesel, Manutenção, Imposto, Outros)';
COMMENT ON COLUMN expenses.valor IS 'Valor da despesa em reais';
COMMENT ON COLUMN expenses.tipo_custo IS 'Tipo do custo (fixo ou variável)';
COMMENT ON COLUMN expenses.data_despesa IS 'Data em que a despesa foi realizada';
COMMENT ON COLUMN expenses.pump_id IS 'ID da bomba relacionada à despesa';
COMMENT ON COLUMN expenses.company_id IS 'ID da empresa proprietária da despesa';
COMMENT ON COLUMN expenses.status IS 'Status da despesa (pendente, pago, cancelado)';
COMMENT ON COLUMN expenses.quilometragem_atual IS 'Quilometragem atual da bomba (para despesas de combustível)';
COMMENT ON COLUMN expenses.quantidade_litros IS 'Quantidade de litros (para despesas de combustível)';
COMMENT ON COLUMN expenses.custo_por_litro IS 'Custo por litro (para despesas de combustível)';
COMMENT ON COLUMN expenses.nota_fiscal_id IS 'ID da nota fiscal relacionada (se aplicável)';
COMMENT ON COLUMN expenses.observacoes IS 'Observações adicionais sobre a despesa';
COMMENT ON COLUMN expenses.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN expenses.updated_at IS 'Data e hora da última atualização do registro';

-- 9. Habilitar Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 10. Criar políticas RLS básicas
-- Política para empresas visualizarem apenas suas próprias despesas
CREATE POLICY "Companies can view their own expenses" ON expenses
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- Política para empresas inserirem suas próprias despesas
CREATE POLICY "Companies can insert their own expenses" ON expenses
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- Política para empresas atualizarem suas próprias despesas
CREATE POLICY "Companies can update their own expenses" ON expenses
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- Política para empresas deletarem suas próprias despesas
CREATE POLICY "Companies can delete their own expenses" ON expenses
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

-- 11. Inserir dados de exemplo para teste (opcional)
-- Descomente as linhas abaixo se quiser inserir dados de exemplo
/*
INSERT INTO expenses (
    descricao, categoria, valor, tipo_custo, data_despesa, 
    pump_id, company_id, status, observacoes
) VALUES 
(
    'Abastecimento de diesel para bomba WM-001', 
    'Diesel', 
    500.00, 
    'variável', 
    '2025-01-28',
    (SELECT id FROM pumps LIMIT 1),
    (SELECT id FROM companies LIMIT 1),
    'pago',
    'Abastecimento realizado no posto da BR'
),
(
    'Manutenção preventiva bomba WM-002', 
    'Manutenção', 
    1200.00, 
    'fixo', 
    '2025-01-27',
    (SELECT id FROM pumps LIMIT 1),
    (SELECT id FROM companies LIMIT 1),
    'pago',
    'Troca de óleo e filtros'
),
(
    'Salário operador João Silva', 
    'Mão de obra', 
    2500.00, 
    'fixo', 
    '2025-01-25',
    (SELECT id FROM pumps LIMIT 1),
    (SELECT id FROM companies LIMIT 1),
    'pago',
    'Salário mensal janeiro 2025'
);
*/

-- 12. Verificação final
DO $$
BEGIN
    RAISE NOTICE '✅ Migração da tabela expenses concluída com sucesso!';
    RAISE NOTICE 'Tabela expenses criada com todas as colunas, índices, triggers e políticas RLS.';
END $$;