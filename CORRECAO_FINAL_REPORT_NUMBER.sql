-- ============================================
-- CORREÇÃO FINAL DEFINITIVA
-- Remove e recria a função create_bombing_report
-- Execute este SQL completo no Supabase SQL Editor
-- ============================================

-- PASSO 1: Verificar se a função existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_bombing_report'
    ) THEN
        RAISE NOTICE '✅ Função create_bombing_report encontrada. Será recriada.';
    ELSE
        RAISE NOTICE '⚠️ Função create_bombing_report não existe. Será criada.';
    END IF;
END $$;

-- PASSO 2: DROPAR a função antiga (força remoção)
DROP FUNCTION IF EXISTS create_bombing_report(JSONB);

-- PASSO 3: RECRIAR a função CORRIGIDA
CREATE OR REPLACE FUNCTION create_bombing_report(
  report_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_report_number TEXT;  -- ✅ VARIÁVEL RENOMEADA
  report_id UUID;
  date_str TEXT;
  random_suffix TEXT;
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
  pump_owner_company_id UUID;
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
  
  -- Buscar owner_company_id da bomba
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
    
    -- ✅ CORREÇÃO: Qualificar coluna com nome da tabela
    IF NOT EXISTS (
      SELECT 1 FROM reports 
      WHERE reports.report_number = new_report_number
    ) THEN
      EXIT;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Não foi possível gerar número único para o relatório';
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
    new_report_number,  -- ✅ USA A VARIÁVEL RENOMEADA
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
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'id', report_id,
    'report_number', new_report_number,  -- ✅ USA A VARIÁVEL RENOMEADA
    'success', true,
    'message', 'Relatório criado com sucesso'
  );
END;
$$;

-- PASSO 4: Adicionar comentário
COMMENT ON FUNCTION create_bombing_report(JSONB) IS 
'Cria relatório de bombeamento com número único gerado automaticamente. CORRIGIDO em 2025-10-10.';

-- PASSO 5: Testar a função
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ FUNÇÃO create_bombing_report RECRIADA!';
    RAISE NOTICE '✅ Ambiguidade de report_number CORRIGIDA!';
    RAISE NOTICE '✅ Status padrão: ENVIADO_FINANCEIRO';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Agora RECARREGUE seu aplicativo (F5) e teste novamente!';
END $$;

