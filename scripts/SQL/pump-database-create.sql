-- Script SQL para criar a tabela pumps do zero
-- Execute este script no Supabase SQL Editor ANTES do pump-database-update.sql

-- 1. Criar a tabela pumps com todos os campos necessários
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

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pumps_prefix ON pumps(prefix);
CREATE INDEX IF NOT EXISTS idx_pumps_status ON pumps(status);
CREATE INDEX IF NOT EXISTS idx_pumps_owner_company_id ON pumps(owner_company_id);
CREATE INDEX IF NOT EXISTS idx_pumps_total_billed ON pumps(total_billed);

-- 3. Adicionar colunas necessárias à tabela reports se não existirem
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS total_value DECIMAL(12,2) DEFAULT 0.0;

-- Verificar se a coluna pump_id existe na tabela reports
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'pump_id') THEN
    ALTER TABLE reports ADD COLUMN pump_id UUID REFERENCES pumps(id);
  END IF;
END $$;

-- 4. Criar índices na tabela reports (apenas se as colunas existirem)
CREATE INDEX IF NOT EXISTS idx_reports_pump_id ON reports(pump_id);
CREATE INDEX IF NOT EXISTS idx_reports_total_value ON reports(total_value);

-- 5. Criar função para atualizar total_billed automaticamente
CREATE OR REPLACE FUNCTION update_pump_total_billed()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se a coluna pump_id existe antes de tentar usá-la
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'pump_id') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Atualizar o total_billed da bomba quando um relatório for inserido/atualizado/deletado
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Verificar se pump_id não é nulo
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
    -- Verificar se pump_id não é nulo
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

-- 6. Criar trigger para executar a função automaticamente
DROP TRIGGER IF EXISTS trigger_update_pump_total_billed ON reports;

CREATE TRIGGER trigger_update_pump_total_billed
  AFTER INSERT OR UPDATE OR DELETE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_pump_total_billed();

-- 7. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para updated_at na tabela pumps
DROP TRIGGER IF EXISTS trigger_update_pumps_updated_at ON pumps;

CREATE TRIGGER trigger_update_pumps_updated_at
  BEFORE UPDATE ON pumps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Inserir algumas bombas de exemplo (opcional)
INSERT INTO pumps (prefix, model, pump_type, brand, capacity_m3h, year, status, owner_company_id, notes) VALUES
('BM-001', 'Modelo ABC-123', 'Estacionária', 'Schwing', 45.5, 2020, 'Disponível', (SELECT id FROM companies LIMIT 1), 'Bomba principal da frota'),
('BM-002', 'Modelo XYZ-456', 'Lança', 'Putzmeister', 60.0, 2019, 'Em Uso', (SELECT id FROM companies LIMIT 1), 'Bomba para obras de grande porte'),
('BM-003', 'Modelo DEF-789', 'Estacionária', 'Schwing', 35.0, 2021, 'Disponível', (SELECT id FROM companies LIMIT 1), 'Bomba reserva')
ON CONFLICT (prefix) DO NOTHING;

-- 10. Comentários para documentação
COMMENT ON TABLE pumps IS 'Tabela de bombas de concreto';
COMMENT ON COLUMN pumps.prefix IS 'Prefixo único da bomba (ex: BM-001)';
COMMENT ON COLUMN pumps.model IS 'Modelo da bomba';
COMMENT ON COLUMN pumps.pump_type IS 'Tipo da bomba: Estacionária ou Lança';
COMMENT ON COLUMN pumps.brand IS 'Marca da bomba';
COMMENT ON COLUMN pumps.capacity_m3h IS 'Capacidade em metros cúbicos por hora';
COMMENT ON COLUMN pumps.year IS 'Ano de fabricação da bomba';
COMMENT ON COLUMN pumps.status IS 'Status atual da bomba';
COMMENT ON COLUMN pumps.total_billed IS 'Total faturado com esta bomba (atualizado automaticamente)';
COMMENT ON COLUMN pumps.notes IS 'Observações adicionais sobre a bomba';
COMMENT ON COLUMN pumps.owner_company_id IS 'ID da empresa proprietária da bomba';

-- 11. Verificar se tudo foi criado corretamente
SELECT 
  'Tabela pumps criada com sucesso!' as status,
  COUNT(*) as total_pumps
FROM pumps;

SELECT 
  'Trigger criado com sucesso!' as status,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_pump_total_billed';

-- 12. Mostrar estrutura da tabela criada
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pumps' 
ORDER BY ordinal_position;
