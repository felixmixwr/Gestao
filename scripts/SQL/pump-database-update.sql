-- Script SQL para atualizar a tabela pumps conforme os novos requisitos
-- Execute este script manualmente no Supabase SQL Editor
-- IMPORTANTE: Se a tabela pumps não existir, execute primeiro o pump-database-create.sql

-- Verificar se a tabela pumps existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pumps') THEN
    RAISE EXCEPTION 'Tabela pumps não existe! Execute primeiro o script pump-database-create.sql';
  END IF;
END $$;

-- 1. Adicionar novas colunas à tabela pumps
ALTER TABLE pumps 
ADD COLUMN IF NOT EXISTS prefix VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS pump_type VARCHAR(20) CHECK (pump_type IN ('Estacionária', 'Lança')),
ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS capacity_m3h DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS year INTEGER CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW())),
ADD COLUMN IF NOT EXISTS total_billed DECIMAL(12,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Atualizar a coluna status para os novos valores
ALTER TABLE pumps 
DROP CONSTRAINT IF EXISTS pumps_status_check;

ALTER TABLE pumps 
ADD CONSTRAINT pumps_status_check 
CHECK (status IN ('Disponível', 'Em Uso', 'Em Manutenção'));

-- 3. Renomear company_id para owner_company_id para maior clareza
ALTER TABLE pumps 
RENAME COLUMN company_id TO owner_company_id;

-- 4. Atualizar a foreign key constraint
ALTER TABLE pumps 
DROP CONSTRAINT IF EXISTS pumps_company_id_fkey;

ALTER TABLE pumps 
ADD CONSTRAINT pumps_owner_company_id_fkey 
FOREIGN KEY (owner_company_id) REFERENCES companies(id);

-- 5. Atualizar a tabela reports para incluir total_value
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS total_value DECIMAL(12,2) DEFAULT 0.0;

-- 6. Criar função para atualizar total_billed automaticamente
CREATE OR REPLACE FUNCTION update_pump_total_billed()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o total_billed da bomba quando um relatório for inserido/atualizado/deletado
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE pumps 
    SET total_billed = (
      SELECT COALESCE(SUM(total_value), 0) 
      FROM reports 
      WHERE pump_id = NEW.pump_id
    )
    WHERE id = NEW.pump_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE pumps 
    SET total_billed = (
      SELECT COALESCE(SUM(total_value), 0) 
      FROM reports 
      WHERE pump_id = OLD.pump_id
    )
    WHERE id = OLD.pump_id;
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

-- 8. Atualizar dados existentes (se houver)
-- Definir valores padrão para prefix se estiver vazio
UPDATE pumps 
SET prefix = 'BM-' || LPAD(id::text, 3, '0')
WHERE prefix IS NULL OR prefix = '';

-- Definir status padrão se estiver vazio
UPDATE pumps 
SET status = 'Disponível'
WHERE status IS NULL OR status NOT IN ('Disponível', 'Em Uso', 'Em Manutenção');

-- Calcular total_billed baseado nos relatórios existentes
UPDATE pumps 
SET total_billed = (
  SELECT COALESCE(SUM(total_value), 0) 
  FROM reports 
  WHERE pump_id = pumps.id
);

-- 9. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pumps_prefix ON pumps(prefix);
CREATE INDEX IF NOT EXISTS idx_pumps_status ON pumps(status);
CREATE INDEX IF NOT EXISTS idx_pumps_owner_company_id ON pumps(owner_company_id);
CREATE INDEX IF NOT EXISTS idx_reports_pump_id ON reports(pump_id);
CREATE INDEX IF NOT EXISTS idx_reports_total_value ON reports(total_value);

-- 10. Comentários para documentação
COMMENT ON COLUMN pumps.prefix IS 'Prefixo único da bomba (ex: BM-001)';
COMMENT ON COLUMN pumps.pump_type IS 'Tipo da bomba: Estacionária ou Lança';
COMMENT ON COLUMN pumps.brand IS 'Marca da bomba';
COMMENT ON COLUMN pumps.capacity_m3h IS 'Capacidade em metros cúbicos por hora';
COMMENT ON COLUMN pumps.year IS 'Ano de fabricação da bomba';
COMMENT ON COLUMN pumps.total_billed IS 'Total faturado com esta bomba (atualizado automaticamente)';
COMMENT ON COLUMN pumps.notes IS 'Observações adicionais sobre a bomba';
COMMENT ON COLUMN pumps.owner_company_id IS 'ID da empresa proprietária da bomba';
COMMENT ON COLUMN reports.total_value IS 'Valor total do relatório (atualizado automaticamente)';

-- Verificar se tudo foi criado corretamente
SELECT 
  'Tabela pumps atualizada com sucesso!' as status,
  COUNT(*) as total_pumps
FROM pumps;

SELECT 
  'Trigger criado com sucesso!' as status,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_pump_total_billed';
