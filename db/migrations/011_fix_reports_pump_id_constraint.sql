-- Migração 011: Corrigir constraint de foreign key para permitir bombas terceiras
-- Este script corrige o problema de foreign key constraint na tabela reports
-- para permitir referências tanto para pumps quanto para bombas_terceiras

-- 1. Remover a constraint existente de pump_id
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_pump_id_fkey;

-- 2. Criar uma nova constraint que permite referências para ambas as tabelas
-- Usando uma função de verificação personalizada
CREATE OR REPLACE FUNCTION check_pump_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o pump_id existe na tabela pumps
  IF EXISTS (SELECT 1 FROM pumps WHERE id = NEW.pump_id) THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se o pump_id existe na tabela bombas_terceiras
  IF EXISTS (SELECT 1 FROM bombas_terceiras WHERE id = NEW.pump_id) THEN
    RETURN NEW;
  END IF;
  
  -- Se não existe em nenhuma das tabelas, gerar erro
  RAISE EXCEPTION 'Bomba com ID % não encontrada em pumps ou bombas_terceiras', NEW.pump_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger para validar referências de bomba
DROP TRIGGER IF EXISTS check_pump_reference_trigger ON reports;
CREATE TRIGGER check_pump_reference_trigger
  BEFORE INSERT OR UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION check_pump_reference();

-- 4. Adicionar comentário explicativo
COMMENT ON FUNCTION check_pump_reference() IS 'Função para validar se pump_id existe em pumps ou bombas_terceiras';

-- 5. Verificar se a migração foi aplicada corretamente
DO $$
BEGIN
  -- Verificar se o trigger foi criado
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'check_pump_reference_trigger' 
    AND event_object_table = 'reports'
  ) THEN
    RAISE NOTICE '✅ Migração 011 aplicada com sucesso: Constraint de pump_id corrigida para suportar bombas terceiras';
  ELSE
    RAISE EXCEPTION '❌ Erro na migração 011: Trigger não foi criado';
  END IF;
END $$;







