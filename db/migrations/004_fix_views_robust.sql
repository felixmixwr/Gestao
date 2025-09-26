-- =============================================
-- 004_fix_views_robust.sql
-- Views robustas que verificam se as colunas existem antes de usá-las
-- =============================================

-- Recriar view para relatórios pendentes de nota fiscal (versão robusta)
CREATE OR REPLACE VIEW pending_reports_for_invoice AS
SELECT 
  r.id as report_id,
  r.report_number,
  r.date,
  r.client_id,
  r.client_rep_name,
  r.pump_id,
  r.total_value,
  r.status,
  r.created_at,
  c.name as client_name,
  c.email as client_email,
  c.phone as client_phone,
  p.prefix as pump_prefix,
  p.model as pump_model,
  p.brand as pump_brand,
  comp.name as company_name
FROM reports r
LEFT JOIN invoices i ON i.report_id = r.id
LEFT JOIN clients c ON c.id = r.client_id
LEFT JOIN pumps p ON p.id = r.pump_id
LEFT JOIN companies comp ON comp.id = r.company_id
WHERE r.status = 'NOTA_EMITIDA' 
  AND i.id IS NULL
ORDER BY r.created_at DESC;

-- Recriar view para relatórios já com nota fiscal emitida (versão robusta)
CREATE OR REPLACE VIEW reports_with_invoices AS
SELECT 
  r.id as report_id,
  r.report_number,
  r.date,
  r.client_id,
  r.client_rep_name,
  r.pump_id,
  r.total_value,
  r.status,
  r.created_at,
  c.name as client_name,
  c.email as client_email,
  c.phone as client_phone,
  p.prefix as pump_prefix,
  p.model as pump_model,
  p.brand as pump_brand,
  comp.name as company_name,
  i.id as invoice_id,
  i.nf_number,
  i.nf_date,
  i.nf_value,
  i.nf_due_date,
  i.file_pdf_path,
  i.file_xlsx_path
FROM reports r
INNER JOIN invoices i ON i.report_id = r.id
LEFT JOIN clients c ON c.id = r.client_id
LEFT JOIN pumps p ON p.id = r.pump_id
LEFT JOIN companies comp ON comp.id = r.company_id
ORDER BY i.nf_date DESC, r.created_at DESC;

-- Função para verificar se uma coluna existe em uma tabela
CREATE OR REPLACE FUNCTION column_exists(table_name_param text, column_name_param text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.columns c
    WHERE c.table_name = table_name_param 
    AND c.column_name = column_name_param
  );
END;
$$ LANGUAGE plpgsql;

-- Função para criar view dinâmica baseada nas colunas existentes
CREATE OR REPLACE FUNCTION create_dynamic_pending_reports_view()
RETURNS void AS $$
DECLARE
  sql_query text;
BEGIN
  -- Construir query dinamicamente baseada nas colunas existentes
  sql_query := '
  CREATE OR REPLACE VIEW pending_reports_for_invoice AS
  SELECT 
    r.id as report_id,
    r.report_number,
    r.date,
    r.client_id,
    r.client_rep_name,
    r.pump_id,
    r.total_value,
    r.status,
    r.created_at,
    c.name as client_name,
    c.email as client_email,
    c.phone as client_phone,
    p.prefix as pump_prefix,
    p.model as pump_model,
    p.brand as pump_brand,
    comp.name as company_name';
    
  -- Adicionar colunas extras se existirem
  IF column_exists('reports', 'client_phone') THEN
    sql_query := sql_query || ',
    r.client_phone';
  END IF;
  
  IF column_exists('reports', 'work_address') THEN
    sql_query := sql_query || ',
    r.work_address';
  END IF;
  
  IF column_exists('reports', 'pump_prefix') THEN
    sql_query := sql_query || ',
    r.pump_prefix as report_pump_prefix';
  END IF;
  
  sql_query := sql_query || '
  FROM reports r
  LEFT JOIN invoices i ON i.report_id = r.id
  LEFT JOIN clients c ON c.id = r.client_id
  LEFT JOIN pumps p ON p.id = r.pump_id
  LEFT JOIN companies comp ON comp.id = r.company_id
  WHERE r.status = ''NOTA_EMITIDA'' 
    AND i.id IS NULL
  ORDER BY r.created_at DESC';
  
  -- Executar a query dinâmica
  EXECUTE sql_query;
  
  RAISE NOTICE 'View pending_reports_for_invoice criada dinamicamente com sucesso';
END;
$$ LANGUAGE plpgsql;

-- Executar a função para criar a view dinâmica
SELECT create_dynamic_pending_reports_view();

-- Comentários atualizados
COMMENT ON VIEW pending_reports_for_invoice IS 'Lista relatórios com status NOTA_EMITIDA que ainda não possuem nota fiscal vinculada (versão robusta)';
COMMENT ON VIEW reports_with_invoices IS 'Lista todos os relatórios que já possuem nota fiscal emitida (versão robusta)';
COMMENT ON FUNCTION column_exists(text, text) IS 'Função utilitária para verificar se uma coluna existe em uma tabela (versão corrigida sem ambiguidade)';
COMMENT ON FUNCTION create_dynamic_pending_reports_view() IS 'Função que cria a view pending_reports_for_invoice dinamicamente baseada nas colunas existentes';