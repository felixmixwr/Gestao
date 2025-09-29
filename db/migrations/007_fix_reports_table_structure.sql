-- Script para verificar e corrigir a estrutura da tabela reports
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela reports existe e sua estrutura
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- 2. Verificar constraints da tabela
SELECT 
  tc.constraint_name, 
  tc.constraint_type, 
  ccu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'reports';

-- 3. Verificar se existe constraint UNIQUE no report_number
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'reports' 
  AND constraint_type = 'UNIQUE';

-- 4. Se não existir constraint UNIQUE, criar
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

-- 5. Verificar se a função RPC existe
SELECT 
  routine_name, 
  routine_type, 
  data_type
FROM information_schema.routines 
WHERE routine_name = 'create_report_with_number';

-- 6. Se a função não existir, criar uma versão simplificada
CREATE OR REPLACE FUNCTION create_report_with_number(
  date_param DATE,
  payload_json JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  report_number TEXT;
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
    report_number := 'RPT-' || date_str || '-' || random_suffix;
    
    -- Verificar se o número já existe
    IF NOT EXISTS (SELECT 1 FROM reports r WHERE r.report_number = report_number) THEN
      EXIT;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Não foi possível gerar um número único para o relatório após % tentativas', max_attempts;
    END IF;
  END LOOP;
  
  -- Retornar apenas o número gerado
  RETURN jsonb_build_object(
    'report_number', report_number,
    'success', true
  );
END;
$$;

-- 7. Testar a função
SELECT create_report_with_number('2024-01-15'::DATE);

-- 8. Verificar dados existentes na tabela reports
SELECT 
  COUNT(*) as total_reports,
  COUNT(DISTINCT report_number) as unique_numbers,
  MIN(created_at) as first_report,
  MAX(created_at) as last_report
FROM reports;

-- 9. Verificar se há números duplicados
SELECT 
  report_number, 
  COUNT(*) as count
FROM reports 
GROUP BY report_number 
HAVING COUNT(*) > 1;

-- 10. Se houver duplicatas, mostrar sugestão de correção
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT report_number, COUNT(*) as count
    FROM reports 
    GROUP BY report_number 
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'ATENÇÃO: Encontradas % números de relatório duplicados. Execute o script de correção.', duplicate_count;
  ELSE
    RAISE NOTICE 'OK: Nenhum número de relatório duplicado encontrado.';
  END IF;
END $$;
