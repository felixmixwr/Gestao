-- =============================================
-- 003_view_pending_reports.sql
-- View que lista reports com status = 'NOTA_EMITIDA' e sem nota vinculada
-- =============================================

-- Criar view para relatórios pendentes de nota fiscal
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

-- Criar view adicional para relatórios já com nota fiscal emitida
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

-- Criar view para estatísticas de notas fiscais
CREATE OR REPLACE VIEW invoice_statistics AS
SELECT 
  comp.name as company_name,
  COUNT(i.id) as total_invoices,
  COUNT(CASE WHEN i.nf_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as invoices_last_30_days,
  COUNT(CASE WHEN i.nf_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as invoices_last_7_days,
  COALESCE(SUM(i.nf_value), 0) as total_invoiced_value,
  COALESCE(SUM(CASE WHEN i.nf_date >= CURRENT_DATE - INTERVAL '30 days' THEN i.nf_value ELSE 0 END), 0) as value_last_30_days,
  COALESCE(SUM(CASE WHEN i.nf_date >= CURRENT_DATE - INTERVAL '7 days' THEN i.nf_value ELSE 0 END), 0) as value_last_7_days,
  COALESCE(AVG(i.nf_value), 0) as average_invoice_value
FROM companies comp
LEFT JOIN users u ON u.company_id = comp.id
LEFT JOIN invoices i ON i.created_by = u.id
GROUP BY comp.id, comp.name
ORDER BY total_invoiced_value DESC;

-- Comentários para documentação
COMMENT ON VIEW pending_reports_for_invoice IS 'Lista relatórios com status NOTA_EMITIDA que ainda não possuem nota fiscal vinculada';
COMMENT ON VIEW reports_with_invoices IS 'Lista todos os relatórios que já possuem nota fiscal emitida';
COMMENT ON VIEW invoice_statistics IS 'Estatísticas de notas fiscais por empresa';