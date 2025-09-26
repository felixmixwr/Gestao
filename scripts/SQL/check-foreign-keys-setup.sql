-- Script para verificar e configurar as foreign keys da tabela reports
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se as foreign keys existem
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'reports';

-- 2. Se as foreign keys não existirem, criar elas:
-- ALTER TABLE reports ADD CONSTRAINT reports_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id);
-- ALTER TABLE reports ADD CONSTRAINT reports_pump_id_fkey FOREIGN KEY (pump_id) REFERENCES pumps(id);
-- ALTER TABLE reports ADD CONSTRAINT reports_service_company_id_fkey FOREIGN KEY (service_company_id) REFERENCES companies(id);

-- 3. Testar query com JOIN manual para verificar se os dados existem
SELECT 
  r.id,
  r.report_number,
  r.client_id,
  r.client_rep_name,
  c.name as client_name,
  c.company_name,
  c.phone as client_phone
FROM reports r
LEFT JOIN clients c ON r.client_id = c.id
WHERE r.id = 'd264674f-b808-4d5e-a7e7-9142e34cd41b';

-- 4. Verificar se o cliente existe
SELECT 
  id,
  name,
  email,
  phone,
  company_name
FROM clients 
WHERE id = '183125c8-574b-4d87-9ff2-f02bb3fbbe1e';
