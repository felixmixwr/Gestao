-- Migration 012: Create expenses table for financial module
-- Created: 2025-01-29
-- Description: Creates the expenses table to store financial expenses data

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_company_id ON expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_pump_id ON expenses(pump_id);
CREATE INDEX IF NOT EXISTS idx_expenses_categoria ON expenses(categoria);
CREATE INDEX IF NOT EXISTS idx_expenses_data_despesa ON expenses(data_despesa);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_tipo_custo ON expenses(tipo_custo);
CREATE INDEX IF NOT EXISTS idx_expenses_nota_fiscal_id ON expenses(nota_fiscal_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_expenses_company_data ON expenses(company_id, data_despesa);
CREATE INDEX IF NOT EXISTS idx_expenses_pump_data ON expenses(pump_id, data_despesa);
CREATE INDEX IF NOT EXISTS idx_expenses_categoria_data ON expenses(categoria, data_despesa);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_expenses_updated_at();

-- Add comments to table and columns
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

-- Insert sample data for testing (optional)
-- Uncomment the lines below to insert sample data
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

-- Grant permissions (adjust according to your RLS policies)
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (uncomment and adjust as needed)
/*
-- Policy for companies to see only their own expenses
CREATE POLICY "Companies can view their own expenses" ON expenses
    FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- Policy for companies to insert their own expenses
CREATE POLICY "Companies can insert their own expenses" ON expenses
    FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- Policy for companies to update their own expenses
CREATE POLICY "Companies can update their own expenses" ON expenses
    FOR UPDATE USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- Policy for companies to delete their own expenses
CREATE POLICY "Companies can delete their own expenses" ON expenses
    FOR DELETE USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));
*/
