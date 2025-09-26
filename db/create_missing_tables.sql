-- Script para criar tabelas que podem estar faltando
-- Execute este script no Supabase SQL Editor se as tabelas não existirem

-- 1. Criar tabela companies (se não existir)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar tabela clients (se não existir)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company_id UUID REFERENCES companies(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar tabela bombas (se não existir)
CREATE TABLE IF NOT EXISTS bombas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    model TEXT,
    serial_number TEXT,
    status TEXT CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
    company_id UUID REFERENCES companies(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar tabela reports (se não existir)
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_number TEXT NOT NULL,
    client_id UUID REFERENCES clients(id) NOT NULL,
    bomba_id UUID REFERENCES bombas(id) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Criar tabela colaboradores (se não existir)
CREATE TABLE IF NOT EXISTS colaboradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company_id UUID REFERENCES companies(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Criar tabela programacao (se não existir)
CREATE TABLE IF NOT EXISTS programacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) NOT NULL,
    bomba_id UUID REFERENCES bombas(id) NOT NULL,
    scheduled_date DATE NOT NULL,
    status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Inserir empresa padrão se não existir
INSERT INTO companies (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Felix Mix')
ON CONFLICT (id) DO NOTHING;

INSERT INTO companies (id, name) 
VALUES ('00000000-0000-0000-0000-000000000002', 'WorldRental')
ON CONFLICT (id) DO NOTHING;

-- 8. Habilitar RLS nas tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bombas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE programacao ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas RLS básicas (permissivas para teste)
CREATE POLICY "Enable all operations for authenticated users" ON companies
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON bombas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON reports
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON colaboradores
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON programacao
    FOR ALL USING (auth.role() = 'authenticated');

-- 10. Criar triggers de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bombas_updated_at BEFORE UPDATE ON bombas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_colaboradores_updated_at BEFORE UPDATE ON colaboradores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programacao_updated_at BEFORE UPDATE ON programacao
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
