-- RPC Functions para o sistema de relatórios
-- Execute estas funções no Supabase SQL Editor se desejar usar as funcionalidades avançadas

-- 1. Função para criar relatório com número único
-- CORRIGIDA: Evita ambiguidade de coluna report_number
CREATE OR REPLACE FUNCTION create_report_with_number(
  date_param DATE,
  payload_json JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_report_number TEXT;  -- CORRIGIDO: renomeado para evitar ambiguidade
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

-- 2. Função para incrementar total faturado da bomba
CREATE OR REPLACE FUNCTION increment_pump_total_billed(
  pump_id_param UUID,
  amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se a bomba existe
  IF NOT EXISTS (SELECT 1 FROM pumps WHERE id = pump_id_param) THEN
    RAISE EXCEPTION 'Bomba com ID % não encontrada', pump_id_param;
  END IF;
  
  -- Atualizar total faturado
  UPDATE pumps 
  SET 
    total_billed = COALESCE(total_billed, 0) + amount,
    updated_at = NOW()
  WHERE id = pump_id_param;
  
  RETURN TRUE;
END;
$$;

-- 3. Função para obter estatísticas de relatórios por período
CREATE OR REPLACE FUNCTION get_reports_stats(
  start_date DATE,
  end_date DATE,
  company_id_param UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_reports', COUNT(*),
    'total_volume', COALESCE(SUM(realized_volume), 0),
    'total_value', COALESCE(SUM(total_value), 0),
    'status_breakdown', jsonb_object_agg(
      status, 
      jsonb_build_object(
        'count', status_count,
        'value', status_value
      )
    )
  ) INTO stats
  FROM (
    SELECT 
      status,
      COUNT(*) as status_count,
      SUM(total_value) as status_value
    FROM reports 
    WHERE date BETWEEN start_date AND end_date
      AND (company_id_param IS NULL OR company_id = company_id_param)
    GROUP BY status
  ) status_stats
  CROSS JOIN (
    SELECT 
      COUNT(*) as total_count,
      SUM(realized_volume) as total_volume,
      SUM(total_value) as total_value
    FROM reports 
    WHERE date BETWEEN start_date AND end_date
      AND (company_id_param IS NULL OR company_id = company_id_param)
  ) totals;
  
  RETURN COALESCE(stats, '{}'::jsonb);
END;
$$;

-- 4. Função para gerar relatório de bombeamento com validações
-- CORRIGIDA: Evita ambiguidade de coluna report_number
CREATE OR REPLACE FUNCTION create_bombing_report(
  p_report_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report_number TEXT;  -- Prefixo v_ para evitar ambiguidade
  v_report_id UUID;
  v_date_str TEXT;
  v_random_suffix TEXT;
  v_attempts INTEGER := 0;
  v_max_attempts INTEGER := 10;
  v_pump_owner_company_id UUID;
BEGIN
  -- Validar dados obrigatórios
  IF (p_report_data->>'date') IS NULL THEN
    RAISE EXCEPTION 'Data é obrigatória';
  END IF;
  
  IF (p_report_data->>'client_id') IS NULL THEN
    RAISE EXCEPTION 'Cliente é obrigatório';
  END IF;
  
  IF (p_report_data->>'pump_id') IS NULL THEN
    RAISE EXCEPTION 'Bomba é obrigatória';
  END IF;
  
  -- Obter dados da bomba
  SELECT p.owner_company_id INTO v_pump_owner_company_id
  FROM pumps p
  WHERE p.id = (p_report_data->>'pump_id')::UUID;
  
  IF v_pump_owner_company_id IS NULL THEN
    RAISE EXCEPTION 'Bomba não encontrada';
  END IF;
  
  -- Gerar número único do relatório
  v_date_str := to_char((p_report_data->>'date')::DATE, 'YYYYMMDD');
  
  LOOP
    v_random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    v_report_number := 'RPT-' || v_date_str || '-' || v_random_suffix;
    
    -- CORREÇÃO: Alias explícito na tabela
    IF NOT EXISTS (SELECT 1 FROM reports r WHERE r.report_number = v_report_number) THEN
      EXIT;
    END IF;
    
    v_attempts := v_attempts + 1;
    IF v_attempts >= v_max_attempts THEN
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
    v_report_number,
    (p_report_data->>'date')::DATE,
    (p_report_data->>'client_id')::UUID,
    p_report_data->>'client_rep_name',
    p_report_data->>'client_phone',
    p_report_data->>'work_address',
    (p_report_data->>'pump_id')::UUID,
    p_report_data->>'pump_prefix',
    v_pump_owner_company_id,
    CASE WHEN p_report_data->>'planned_volume' IS NOT NULL 
         THEN (p_report_data->>'planned_volume')::NUMERIC 
         ELSE NULL END,
    (p_report_data->>'realized_volume')::NUMERIC,
    p_report_data->>'team',
    (p_report_data->>'total_value')::NUMERIC,
    COALESCE(p_report_data->>'status', 'ENVIADO_FINANCEIRO'),
    p_report_data->>'observations',
    (p_report_data->>'created_by')::UUID,
    (p_report_data->>'company_id')::UUID
  ) RETURNING id INTO v_report_id;
  
  -- Atualizar total faturado da bomba
  UPDATE pumps p
  SET 
    total_billed = COALESCE(p.total_billed, 0) + (p_report_data->>'total_value')::NUMERIC,
    updated_at = NOW()
  WHERE p.id = (p_report_data->>'pump_id')::UUID;
  
  -- Retornar dados do relatório criado
  RETURN jsonb_build_object(
    'id', v_report_id,
    'report_number', v_report_number,
    'success', true,
    'message', 'Relatório criado com sucesso'
  );
END;
$$;

-- Comentários sobre o uso das funções:
-- 
-- 1. create_report_with_number: Usada para gerar números únicos de relatório
--    Exemplo: SELECT create_report_with_number('2024-01-15', '{"client_id": "uuid", ...}');
--
-- 2. increment_pump_total_billed: Usada para atualizar o total faturado de uma bomba
--    Exemplo: SELECT increment_pump_total_billed('pump-uuid', 1500.00);
--
-- 3. get_reports_stats: Usada para obter estatísticas de relatórios
--    Exemplo: SELECT get_reports_stats('2024-01-01', '2024-01-31', 'company-uuid');
--
-- 4. create_bombing_report: Função completa para criar relatório com validações
--    Exemplo: SELECT create_bombing_report('{"date": "2024-01-15", "client_id": "uuid", ...}');
