-- Script para criar a tabela de notas fiscais
-- Execute este script no Supabase SQL Editor

-- Criar tabela de notas fiscais
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nf_number VARCHAR(20) NOT NULL UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  company_logo VARCHAR(50) NOT NULL CHECK (company_logo IN ('Felix Mix', 'WorldRental')),
  phone VARCHAR(20) NOT NULL,
  nf_date DATE NOT NULL,
  nf_due_date DATE NOT NULL,
  address VARCHAR(500),
  cnpj_cpf VARCHAR(20),
  city VARCHAR(100),
  cep VARCHAR(10),
  uf VARCHAR(2),
  nf_value DECIMAL(10,2) NOT NULL CHECK (nf_value > 0),
  descricao TEXT,
  obs TEXT,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  file_xlsx_path VARCHAR(500),
  file_pdf_path VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notes_nf_number ON notes(nf_number);
CREATE INDEX IF NOT EXISTS idx_notes_company_name ON notes(company_name);
CREATE INDEX IF NOT EXISTS idx_notes_nf_date ON notes(nf_date);
CREATE INDEX IF NOT EXISTS idx_notes_nf_due_date ON notes(nf_due_date);
CREATE INDEX IF NOT EXISTS idx_notes_report_id ON notes(report_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_updated_at();

-- Criar view para relatórios pendentes de nota
CREATE OR REPLACE VIEW pending_reports_for_invoice AS
SELECT 
  r.id,
  r.report_number,
  r.created_at,
  c.name as responsible_name,
  p.prefix as pump_prefix,
  (r.total_hours * 50) as total_value, -- R$ 50/hora (ajustar conforme necessário)
  c.name as client_name,
  comp.name as company_name,
  r.start_date,
  r.end_date,
  r.total_hours
FROM reports r
LEFT JOIN notes n ON n.report_id = r.id
JOIN clients c ON c.id = r.client_id
JOIN pumps p ON p.id = r.pump_id
JOIN companies comp ON comp.id = r.company_id
WHERE n.id IS NULL
ORDER BY r.created_at DESC;

-- Configurar RLS (Row Level Security)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para todos os usuários autenticados
CREATE POLICY "Allow authenticated users to read notes" ON notes
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserção apenas para admin e financeiro
CREATE POLICY "Allow admin and financeiro to insert notes" ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role IN ('admin', 'financeiro')
    )
  );

-- Política para permitir atualização apenas para admin e financeiro
CREATE POLICY "Allow admin and financeiro to update notes" ON notes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role IN ('admin', 'financeiro')
    )
  );

-- Política para permitir exclusão apenas para admin
CREATE POLICY "Allow admin to delete notes" ON notes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- Comentários para documentação
COMMENT ON TABLE notes IS 'Tabela de notas fiscais do sistema';
COMMENT ON COLUMN notes.nf_number IS 'Número sequencial da nota fiscal';
COMMENT ON COLUMN notes.company_logo IS 'Logo da empresa emissora (Felix Mix ou WorldRental)';
COMMENT ON COLUMN notes.nf_value IS 'Valor da nota fiscal em reais';
COMMENT ON COLUMN notes.report_id IS 'ID do relatório vinculado (opcional)';
COMMENT ON COLUMN notes.file_xlsx_path IS 'Caminho do arquivo XLSX no storage';
COMMENT ON COLUMN notes.file_pdf_path IS 'Caminho do arquivo PDF no storage';

-- Inserir dados de exemplo (opcional)
INSERT INTO notes (
  nf_number,
  company_name,
  company_logo,
  phone,
  nf_date,
  nf_due_date,
  nf_value,
  descricao
) VALUES (
  '000001',
  'Empresa Exemplo LTDA',
  'Felix Mix',
  '(11) 99999-9999',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  1500.00,
  'Serviços de bomba - exemplo de nota fiscal'
) ON CONFLICT (nf_number) DO NOTHING;
