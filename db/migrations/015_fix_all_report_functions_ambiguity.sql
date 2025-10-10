-- Migration 015: Corrigir TODAS as funções de relatório com ambiguidade
-- Data: 2025-10-10
-- Descrição: Corrige ambiguidade em create_report_with_number E create_bombing_report

-- ============================================
-- FUNÇÃO 1: create_report_with_number
-- ============================================
CREATE OR REPLACE FUNCTION create_report_with_number(
  date_param DATE,
  payload_json JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_report_number TEXT;  -- CORRIGIDO: renomeado
  report_id UUID;
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
    
    -- CORRIGIDO: Qualificar coluna com nome da tabela
    IF NOT EXISTS (SELECT 1 FROM reports WHERE reports.report_number = new_report_number) THEN
      EXIT;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Não foi possível gerar um número único para o relatório após % tentativas', max_attempts;
    END IF;
  END LOOP;
  
  -- Inserir relatório com o número gerado
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
    (payload_json->>'date')::DATE,
    (payload_json->>'client_id')::UUID,
    payload_json->>'client_rep_name',
    payload_json->>'client_phone',
    payload_json->>'work_address',
    (payload_json->>'pump_id')::UUID,
    payload_json->>'pump_prefix',
    (payload_json->>'pump_owner_company_id')::UUID,
    CASE WHEN payload_json->>'planned_volume' IS NOT NULL 
         THEN (payload_json->>'planned_volume')::NUMERIC 
         ELSE NULL END,
    (payload_json->>'realized_volume')::NUMERIC,
    payload_json->>'team',
    (payload_json->>'total_value')::NUMERIC,
    COALESCE(payload_json->>'status', 'ENVIADO_FINANCEIRO'),
    payload_json->>'observations',
    (payload_json->>'created_by')::UUID,
    (payload_json->>'company_id')::UUID
  ) RETURNING id INTO report_id;
  
  -- Retornar dados do relatório criado
  RETURN jsonb_build_object(
    'id', report_id,
    'report_number', new_report_number,
    'success', true
  );
END;
$$;

-- ============================================
-- FUNÇÃO 2: create_bombing_report
-- ============================================
CREATE OR REPLACE FUNCTION create_bombing_report(
  report_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_report_number TEXT;  -- CORRIGIDO: renomeado
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
    
    -- CORRIGIDO: Qualificar coluna com nome da tabela
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

-- Comentários
COMMENT ON FUNCTION create_report_with_number IS 'Cria um relatório com número único gerado automaticamente. CORRIGIDO: ambiguidade removida.';
COMMENT ON FUNCTION create_bombing_report IS 'Cria um relatório de bombeamento com validações e geração automática de número único. CORRIGIDO: ambiguidade removida.';


