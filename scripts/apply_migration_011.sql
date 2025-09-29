-- Script para aplicar a migração 011: Corrigir constraint de foreign key para bombas terceiras
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a migração já foi aplicada
DO $$
BEGIN
  -- Verificar se o trigger já existe
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'check_pump_reference_trigger' 
    AND event_object_table = 'reports'
  ) THEN
    RAISE NOTICE '✅ Migração 011 já foi aplicada anteriormente';
    RETURN;
  END IF;
  
  RAISE NOTICE '🔄 Aplicando migração 011...';
END $$;

-- 2. Remover a constraint existente de pump_id (se existir)
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_pump_id_fkey;

-- 3. Criar função de verificação personalizada
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

-- 4. Criar trigger para validar referências de bomba
DROP TRIGGER IF EXISTS check_pump_reference_trigger ON reports;
CREATE TRIGGER check_pump_reference_trigger
  BEFORE INSERT OR UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION check_pump_reference();

-- 5. Adicionar comentário explicativo
COMMENT ON FUNCTION check_pump_reference() IS 'Função para validar se pump_id existe em pumps ou bombas_terceiras';

-- 6. Verificar se a migração foi aplicada corretamente
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

-- 7. Testar a função com dados existentes (opcional)
-- SELECT 'Testando função de verificação...' as status;
-- SELECT check_pump_reference() FROM reports LIMIT 1;
