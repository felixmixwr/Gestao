-- =============================================
-- WorldRental - Felix Mix Database Setup
-- =============================================

-- Habilitar Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 1. TABELAS PRINCIPAIS
-- =============================================

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de usuários (extensão do auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_id UUID REFERENCES companies(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de bombas
CREATE TABLE IF NOT EXISTS pumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model TEXT,
  serial_number TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
  company_id UUID REFERENCES companies(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de relatórios
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  pump_id UUID REFERENCES pumps(id) NOT NULL,
  company_id UUID REFERENCES companies(id) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_hours INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de notas
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajuste conforme necessário)
-- Companies: todos podem ver, apenas admins podem modificar
CREATE POLICY "Companies are viewable by everyone" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify companies" ON companies
  FOR ALL USING (auth.role() = 'admin');

-- Users: usuários podem ver e editar apenas seus próprios dados
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Clients: usuários podem ver apenas clientes da sua empresa
CREATE POLICY "Users can view company clients" ON clients
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage company clients" ON clients
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Pumps: usuários podem ver apenas bombas da sua empresa
CREATE POLICY "Users can view company pumps" ON pumps
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage company pumps" ON pumps
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Reports: usuários podem ver apenas relatórios da sua empresa
CREATE POLICY "Users can view company reports" ON reports
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage company reports" ON reports
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Notes: usuários podem ver apenas notas da sua empresa
CREATE POLICY "Users can view company notes" ON notes
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage company notes" ON notes
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- =============================================
-- 3. FUNÇÕES E SEQUÊNCIAS
-- =============================================

-- Sequência para números únicos de relatórios
CREATE SEQUENCE IF NOT EXISTS report_sequence START 1;

-- Função para criar relatório com número único
CREATE OR REPLACE FUNCTION create_report_with_number(
  p_client_id UUID,
  p_pump_id UUID,
  p_company_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_total_hours INTEGER,
  p_notes TEXT DEFAULT NULL
) RETURNS reports
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  report_number TEXT;
  new_report reports;
BEGIN
  -- Gera número único do relatório
  report_number := 'RPT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('report_sequence')::TEXT, 4, '0');
  
  -- Insere o relatório
  INSERT INTO reports (
    report_number,
    client_id,
    pump_id,
    company_id,
    start_date,
    end_date,
    total_hours,
    notes
  ) VALUES (
    report_number,
    p_client_id,
    p_pump_id,
    p_company_id,
    p_start_date,
    p_end_date,
    p_total_hours,
    p_notes
  ) RETURNING * INTO new_report;
  
  RETURN new_report;
END;
$$;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pumps_updated_at BEFORE UPDATE ON pumps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 4. DADOS INICIAIS
-- =============================================

-- Inserir empresa padrão
INSERT INTO companies (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Felix Mix')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 5. ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_pumps_company_id ON pumps(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_company_id ON reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_pump_id ON reports(pump_id);
CREATE INDEX IF NOT EXISTS idx_notes_company_id ON notes(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_pumps_name ON pumps(name);
CREATE INDEX IF NOT EXISTS idx_reports_report_number ON reports(report_number);
CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);

-- =============================================
-- INSTRUÇÕES DE USO
-- =============================================

/*
1. Execute este script no SQL Editor do Supabase
2. Configure as variáveis de ambiente no arquivo .env
3. Crie usuários através do painel de autenticação do Supabase
4. Associe os usuários às empresas através da tabela users
5. Ajuste as políticas RLS conforme necessário para seu caso de uso
*/


