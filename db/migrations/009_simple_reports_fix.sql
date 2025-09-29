-- Script simplificado para corrigir o problema de criação de relatórios
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela reports existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'reports'
) as table_exists;

-- 2. Verificar estrutura básica da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'reports' 
  AND column_name IN ('id', 'report_number', 'date', 'client_id', 'pump_id')
ORDER BY ordinal_position;

-- 3. Adicionar constraint UNIQUE se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'reports' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%report_number%'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_report_number_unique UNIQUE (report_number);
    RAISE NOTICE 'Constraint UNIQUE adicionada ao campo report_number';
  ELSE
    RAISE NOTICE 'Constraint UNIQUE já existe no campo report_number';
  END IF;
END $$;

-- 4. Criar função RPC corrigida (sem ambiguidade)
CREATE OR REPLACE FUNCTION create_report_with_number(
  date_param DATE,
  payload_json JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_report_number TEXT;
  date_str TEXT;
  random_suffix TEXT;
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  -- Gerar string de data no formato YYYYMMDD
  date_str := to_char(date_param, 'YYYYMMDD');
  
  -- Tentar gerar número único
  LOOP
    random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    new_report_number := 'RPT-' || date_str || '-' || random_suffix;
    
    -- Verificar se o número já existe (usando alias para evitar ambiguidade)
    IF NOT EXISTS (SELECT 1 FROM reports r WHERE r.report_number = new_report_number) THEN
      EXIT;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Não foi possível gerar um número único para o relatório após % tentativas', max_attempts;
    END IF;
  END LOOP;
  
  -- Retornar apenas o número gerado
  RETURN jsonb_build_object(
    'report_number', new_report_number,
    'success', true
  );
END;
$$;

-- 5. Testar a função
SELECT create_report_with_number('2024-01-15'::DATE) as test_result;

-- 6. Verificar dados existentes
SELECT 
  COUNT(*) as total_reports,
  COUNT(DISTINCT report_number) as unique_numbers,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT report_number) THEN 'OK: Todos os números são únicos'
    ELSE 'ATENÇÃO: Há números duplicados'
  END as status
FROM reports;

-- 7. Verificar se há números duplicados
SELECT 
  report_number, 
  COUNT(*) as count
FROM reports 
GROUP BY report_number 
HAVING COUNT(*) > 1
LIMIT 10;

-- 8. Mostrar alguns exemplos de números existentes
SELECT 
  report_number,
  date,
  created_at
FROM reports 
ORDER BY created_at DESC 
LIMIT 5;
