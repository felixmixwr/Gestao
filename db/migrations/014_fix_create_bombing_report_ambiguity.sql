-- Migration 014: Corrigir ambiguidade na função create_bombing_report
-- Data: 2025-10-10
-- Descrição: Corrige o erro "column reference report_number is ambiguous"

-- Recriar a função com a correção
CREATE OR REPLACE FUNCTION create_bombing_report(
  report_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_report_number TEXT;  -- Renomeado para evitar ambiguidade
  report_id UUID;
  date_str TEXT;
  random_suffix TEXT;
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
  pump_owner_company_id UUID;
BEGIN
  -- Validar dados obrigatórios
  IF (report_data->>'date') IS NULL THEN
    RAISE EXCEPTION 'Data é obrigatória';
  END IF;
  
  IF (report_data->>'client_id') IS NULL THEN
    RAISE EXCEPTION 'Cliente é obrigatório';
  END IF;
  
  IF (report_data->>'pump_id') IS NULL THEN
    RAISE EXCEPTION 'Bomba é obrigatória';
  END IF;
  
  -- Obter dados da bomba
  SELECT owner_company_id INTO pump_owner_company_id
  FROM pumps 
  WHERE id = (report_data->>'pump_id')::UUID;
  
  IF pump_owner_company_id IS NULL THEN
    RAISE EXCEPTION 'Bomba não encontrada';
  END IF;
  
  -- Gerar número único do relatório
  date_str := to_char((report_data->>'date')::DATE, 'YYYYMMDD');
  
  LOOP
    random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    new_report_number := 'RPT-' || date_str || '-' || random_suffix;
    
    -- CORREÇÃO: Qualificar a coluna com o nome da tabela para evitar ambiguidade
    IF NOT EXISTS (SELECT 1 FROM reports WHERE reports.report_number = new_report_number) THEN
      EXIT;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Não foi possível gerar um número único para o relatório';
    END IF;
  END LOOP;
  
  -- Inserir relatório
  INSERT INTO reports (
    report_number,
    date,
    client_id,
    client_rep_name,
    client_phone,
    work_address,
    pump_id,
    pump_prefix,
    pump_owner_company_id,
    planned_volume,
    realized_volume,
    team,
    total_value,
    status,
    observations,
    created_by,
    company_id
  ) VALUES (
    new_report_number,
    (report_data->>'date')::DATE,
    (report_data->>'client_id')::UUID,
    report_data->>'client_rep_name',
    report_data->>'client_phone',
    report_data->>'work_address',
    (report_data->>'pump_id')::UUID,
    report_data->>'pump_prefix',
    pump_owner_company_id,
    CASE WHEN report_data->>'planned_volume' IS NOT NULL 
         THEN (report_data->>'planned_volume')::NUMERIC 
         ELSE NULL END,
    (report_data->>'realized_volume')::NUMERIC,
    report_data->>'team',
    (report_data->>'total_value')::NUMERIC,
    COALESCE(report_data->>'status', 'ENVIADO_FINANCEIRO'),
    report_data->>'observations',
    (report_data->>'created_by')::UUID,
    (report_data->>'company_id')::UUID
  ) RETURNING id INTO report_id;
  
  -- Atualizar total faturado da bomba
  UPDATE pumps 
  SET 
    total_billed = COALESCE(total_billed, 0) + (report_data->>'total_value')::NUMERIC,
    updated_at = NOW()
  WHERE id = (report_data->>'pump_id')::UUID;
  
  -- Retornar dados do relatório criado
  RETURN jsonb_build_object(
    'id', report_id,
    'report_number', new_report_number,
    'success', true,
    'message', 'Relatório criado com sucesso'
  );
END;
$$;

-- Comentário
COMMENT ON FUNCTION create_bombing_report IS 'Cria um relatório de bombeamento com validações e geração automática de número único. Corrigido para evitar ambiguidade de colunas.';

