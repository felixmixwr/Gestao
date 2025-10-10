-- ============================================
-- 🚨 EXECUTE ESTE SQL AGORA NO SUPABASE 🚨
-- ============================================
-- Este script FORÇA a remoção e recriação da função
-- 
-- INSTRUÇÕES:
-- 1. Copie TUDO deste arquivo
-- 2. Cole no Supabase SQL Editor
-- 3. Execute (RUN)
-- 4. Recarregue seu app (F5)
-- ============================================

-- Etapa 1: REMOVER FUNÇÃO ANTIGA (força exclusão)
DROP FUNCTION IF EXISTS create_bombing_report(JSONB) CASCADE;

-- Etapa 2: RECRIAR FUNÇÃO CORRIGIDA
CREATE FUNCTION create_bombing_report(report_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report_number TEXT;  -- Prefixo 'v_' para evitar ambiguidade
  v_report_id UUID;
  v_date_str TEXT;
  v_random_suffix TEXT;
  v_attempts INTEGER := 0;
  v_max_attempts INTEGER := 10;
  v_pump_owner_company_id UUID;
BEGIN
  -- Validações
  IF (report_data->>'date') IS NULL THEN
    RAISE EXCEPTION 'Data é obrigatória';
  END IF;
  
  IF (report_data->>'client_id') IS NULL THEN
    RAISE EXCEPTION 'Cliente é obrigatório';
  END IF;
  
  IF (report_data->>'pump_id') IS NULL THEN
    RAISE EXCEPTION 'Bomba é obrigatória';
  END IF;
  
  -- Buscar dados da bomba
  SELECT owner_company_id 
  INTO v_pump_owner_company_id
  FROM pumps 
  WHERE id = (report_data->>'pump_id')::UUID;
  
  IF v_pump_owner_company_id IS NULL THEN
    RAISE EXCEPTION 'Bomba não encontrada';
  END IF;
  
  -- Gerar número único
  v_date_str := to_char((report_data->>'date')::DATE, 'YYYYMMDD');
  
  LOOP
    v_random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    v_report_number := 'RPT-' || v_date_str || '-' || v_random_suffix;
    
    -- Verificar se número já existe
    IF NOT EXISTS (
      SELECT 1 
      FROM reports r 
      WHERE r.report_number = v_report_number
    ) THEN
      EXIT;
    END IF;
    
    v_attempts := v_attempts + 1;
    IF v_attempts >= v_max_attempts THEN
      RAISE EXCEPTION 'Não foi possível gerar número único';
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
    (report_data->>'date')::DATE,
    (report_data->>'client_id')::UUID,
    report_data->>'client_rep_name',
    report_data->>'client_phone',
    report_data->>'work_address',
    (report_data->>'pump_id')::UUID,
    report_data->>'pump_prefix',
    v_pump_owner_company_id,
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
  ) 
  RETURNING id INTO v_report_id;
  
  -- Atualizar total faturado
  UPDATE pumps 
  SET 
    total_billed = COALESCE(total_billed, 0) + (report_data->>'total_value')::NUMERIC,
    updated_at = NOW()
  WHERE id = (report_data->>'pump_id')::UUID;
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'id', v_report_id,
    'report_number', v_report_number,
    'success', true,
    'message', 'Relatório criado com sucesso'
  );
END;
$$;

-- Etapa 3: Verificação
DO $$
BEGIN
  RAISE NOTICE '✅ Função create_bombing_report recriada com sucesso!';
  RAISE NOTICE '✅ Todas as variáveis têm prefixo v_ para evitar ambiguidade';
  RAISE NOTICE '✅ Alias r adicionado à tabela reports na query';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 AGORA: Recarregue seu aplicativo (F5) e teste!';
END $$;


