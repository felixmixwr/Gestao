-- =============================================
-- 001_create_invoice_seq_and_table.sql
-- Cria sequence para numeração de faturas e tabela invoices
-- =============================================

-- Criar sequence para numeração de notas fiscais
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Criar tabela invoices (notas fiscais) se não existir
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES reports(id) ON DELETE SET NULL,
  nf_seq integer DEFAULT nextval('invoice_number_seq'),
  nf_number text, -- será populado pelo trigger (zero-padded)
  nf_date date,
  nf_value numeric(12,2),
  nf_due_date date,
  company_logo text,
  phone text,
  company_name text,
  address text,
  cnpj_cpf text,
  city text,
  cep text,
  uf text,
  descricao text,
  obs text,
  file_xlsx_path text,
  file_pdf_path text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índices únicos e de performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_nf_number ON invoices(nf_number);
CREATE INDEX IF NOT EXISTS idx_invoices_report_id ON invoices(report_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_nf_date ON invoices(nf_date);
CREATE INDEX IF NOT EXISTS idx_invoices_nf_due_date ON invoices(nf_due_date);

-- Habilitar Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários podem ver apenas invoices da sua empresa
CREATE POLICY "Users can view company invoices" ON invoices
  FOR SELECT USING (
    created_by IN (
      SELECT id FROM users WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Política RLS: usuários podem gerenciar apenas invoices da sua empresa
CREATE POLICY "Users can manage company invoices" ON invoices
  FOR ALL USING (
    created_by IN (
      SELECT id FROM users WHERE company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE invoices IS 'Tabela para armazenar notas fiscais (invoices) vinculadas aos relatórios';
COMMENT ON COLUMN invoices.nf_seq IS 'Sequência numérica da nota fiscal';
COMMENT ON COLUMN invoices.nf_number IS 'Número da nota fiscal formatado (zero-padded)';
COMMENT ON COLUMN invoices.report_id IS 'Referência ao relatório que gerou esta nota fiscal';
COMMENT ON COLUMN invoices.nf_value IS 'Valor total da nota fiscal';
COMMENT ON COLUMN invoices.file_xlsx_path IS 'Caminho para arquivo Excel da nota fiscal';
COMMENT ON COLUMN invoices.file_pdf_path IS 'Caminho para arquivo PDF da nota fiscal';