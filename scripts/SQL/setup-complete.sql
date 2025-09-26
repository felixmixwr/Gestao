-- Script COMPLETO para configurar FELIX MIX e WORLDPAV com bombas
-- Execute este script no Supabase SQL Editor

-- 1. Limpar empresas existentes e inserir apenas as empresas específicas do projeto
-- Primeiro, remover qualquer empresa existente que não seja FELIX MIX ou WORLDPAV
DELETE FROM companies WHERE name NOT IN ('FELIX MIX', 'WORLDPAV');

-- Inserir as empresas específicas do projeto
INSERT INTO companies (id, name, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'FELIX MIX', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'WORLDPAV', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- 2. Criar a tabela pumps se não existir
CREATE TABLE IF NOT EXISTS pumps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prefix VARCHAR(50) UNIQUE NOT NULL,
  model VARCHAR(100),
  pump_type VARCHAR(20) CHECK (pump_type IN ('Estacionária', 'Lança')),
  brand VARCHAR(100),
  capacity_m3h DECIMAL(10,2),
  year INTEGER CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW())),
  status VARCHAR(20) DEFAULT 'Disponível' CHECK (status IN ('Disponível', 'Em Uso', 'Em Manutenção')),
  owner_company_id UUID NOT NULL REFERENCES companies(id),
  total_billed DECIMAL(12,2) DEFAULT 0.0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pumps_prefix ON pumps(prefix);
CREATE INDEX IF NOT EXISTS idx_pumps_status ON pumps(status);
CREATE INDEX IF NOT EXISTS idx_pumps_owner_company_id ON pumps(owner_company_id);
CREATE INDEX IF NOT EXISTS idx_pumps_total_billed ON pumps(total_billed);

-- 4. Adicionar coluna total_value à tabela reports se não existir
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS total_value DECIMAL(12,2) DEFAULT 0.0;

-- 5. Criar índices na tabela reports
CREATE INDEX IF NOT EXISTS idx_reports_pump_id ON reports(pump_id);
CREATE INDEX IF NOT EXISTS idx_reports_total_value ON reports(total_value);

-- 6. Criar função para atualizar total_billed automaticamente
CREATE OR REPLACE FUNCTION update_pump_total_billed()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o total_billed da bomba quando um relatório for inserido/atualizado/deletado
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.pump_id IS NOT NULL THEN
      UPDATE pumps 
      SET total_billed = (
        SELECT COALESCE(SUM(total_value), 0) 
        FROM reports 
        WHERE pump_id = NEW.pump_id
      )
      WHERE id = NEW.pump_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.pump_id IS NOT NULL THEN
      UPDATE pumps 
      SET total_billed = (
        SELECT COALESCE(SUM(total_value), 0) 
        FROM reports 
        WHERE pump_id = OLD.pump_id
      )
      WHERE id = OLD.pump_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para executar a função automaticamente
DROP TRIGGER IF EXISTS trigger_update_pump_total_billed ON reports;

CREATE TRIGGER trigger_update_pump_total_billed
  AFTER INSERT OR UPDATE OR DELETE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_pump_total_billed();

-- 8. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Criar trigger para updated_at na tabela pumps
DROP TRIGGER IF EXISTS trigger_update_pumps_updated_at ON pumps;

CREATE TRIGGER trigger_update_pumps_updated_at
  BEFORE UPDATE ON pumps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Inserir bombas de exemplo para as empresas específicas
INSERT INTO pumps (prefix, model, pump_type, brand, capacity_m3h, year, status, owner_company_id, notes) VALUES
('BM-001', 'Modelo ABC-123', 'Estacionária', 'Schwing', 45.5, 2020, 'Disponível', '550e8400-e29b-41d4-a716-446655440001', 'Bomba principal da frota FELIX MIX'),
('BM-002', 'Modelo XYZ-456', 'Lança', 'Putzmeister', 60.0, 2019, 'Em Uso', '550e8400-e29b-41d4-a716-446655440002', 'Bomba para obras de grande porte WORLDPAV'),
('BM-003', 'Modelo DEF-789', 'Estacionária', 'Schwing', 35.0, 2021, 'Disponível', '550e8400-e29b-41d4-a716-446655440001', 'Bomba reserva FELIX MIX')
ON CONFLICT (prefix) DO NOTHING;

-- 11. Verificar se tudo foi criado corretamente
SELECT 
  'Empresas configuradas com sucesso!' as status,
  COUNT(*) as total_companies
FROM companies;

SELECT 
  'Bombas criadas com sucesso!' as status,
  COUNT(*) as total_pumps
FROM pumps;

-- 12. Mostrar distribuição por empresa
SELECT 
  c.name as empresa,
  COUNT(p.id) as total_bombas,
  SUM(p.total_billed) as total_faturado
FROM companies c
LEFT JOIN pumps p ON c.id = p.owner_company_id
GROUP BY c.id, c.name
ORDER BY c.name;

-- 13. Mostrar estrutura da tabela pumps
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pumps' 
ORDER BY ordinal_position;
