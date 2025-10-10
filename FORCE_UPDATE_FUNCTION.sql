-- ============================================
-- 🔥 FORÇA ATUALIZAÇÃO TOTAL DA FUNÇÃO
-- Execute ESTE SQL no Supabase SQL Editor
-- ============================================

-- 1️⃣ VERIFICAR funções existentes
SELECT 
    proname as "Nome da Função",
    pg_get_functiondef(oid) as "Definição"
FROM pg_proc 
WHERE proname LIKE '%bombing%' OR proname LIKE '%report%';

-- 2️⃣ DROPAR TODAS as funções relacionadas (força limpeza)
DROP FUNCTION IF EXISTS create_bombing_report(JSONB) CASCADE;
DROP FUNCTION IF EXISTS create_report_with_number(DATE, JSONB) CASCADE;

-- 3️⃣ RECRIAR create_bombing_report com TODAS variáveis prefixadas
CREATE FUNCTION create_bombing_report(p_report_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report_number TEXT;
  v_report_id UUID;
  v_date_str TEXT;
  v_random_suffix TEXT;
  v_attempts INTEGER := 0;
  v_max_attempts INTEGER := 10;
  v_pump_owner_company_id UUID;
BEGIN
  -- Validações
  IF (p_report_data->>'date') IS NULL THEN
    RAISE EXCEPTION 'Data é obrigatória';
  END IF;
  
  IF (p_report_data->>'client_id') IS NULL THEN
    RAISE EXCEPTION 'Cliente é obrigatório';
  END IF;
  
  IF (p_report_data->>'pump_id') IS NULL THEN
    RAISE EXCEPTION 'Bomba é obrigatória';
  END IF;
  
  -- Buscar dados da bomba
  SELECT p.owner_company_id 
  INTO v_pump_owner_company_id
  FROM pumps p
  WHERE p.id = (p_report_data->>'pump_id')::UUID;
  
  IF v_pump_owner_company_id IS NULL THEN
    RAISE EXCEPTION 'Bomba não encontrada';
  END IF;
  
  -- Gerar número único
  v_date_str := to_char((p_report_data->>'date')::DATE, 'YYYYMMDD');
  
  LOOP
    v_random_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    v_report_number := 'RPT-' || v_date_str || '-' || v_random_suffix;
    
    -- Verificação com alias explícito
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
  ) 
  RETURNING id INTO v_report_id;
  
  -- Atualizar total faturado
  UPDATE pumps p
  SET 
    total_billed = COALESCE(p.total_billed, 0) + (p_report_data->>'total_value')::NUMERIC,
    updated_at = NOW()
  WHERE p.id = (p_report_data->>'pump_id')::UUID;
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'id', v_report_id,
    'report_number', v_report_number,
    'success', true,
    'message', 'Relatório criado com sucesso'
  );
END;
$$;

-- 4️⃣ GRANT permissões
GRANT EXECUTE ON FUNCTION create_bombing_report(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_bombing_report(JSONB) TO anon;

-- 5️⃣ Verificar se foi criada
SELECT 
    proname as "Função Criada",
    proargnames as "Argumentos",
    prosrc LIKE '%v_report_number%' as "Variáveis Prefixadas"
FROM pg_proc 
WHERE proname = 'create_bombing_report';

-- 6️⃣ Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ FUNÇÃO create_bombing_report RECRIADA!';
  RAISE NOTICE '✅ Parâmetro: p_report_data';
  RAISE NOTICE '✅ Todas variáveis com prefixo v_';
  RAISE NOTICE '✅ Todos alias de tabelas explícitos (p., r.)';
  RAISE NOTICE '✅ GRANT executado para authenticated e anon';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Feche TODAS as abas do navegador';
  RAISE NOTICE '🔄 Abra nova aba: http://localhost:5173';
  RAISE NOTICE '🔄 Teste novamente!';
END $$;


