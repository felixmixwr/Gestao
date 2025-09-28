-- Script SQL para configurar as empresas FELIX MIX e WORLDPAV
-- Execute este script no Supabase SQL Editor

-- 1. Inserir as empresas específicas do projeto
INSERT INTO companies (id, name, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'FELIX MIX', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'WORLDPAV', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- 2. Verificar se as empresas foram inseridas corretamente
SELECT 
  'Empresas configuradas com sucesso!' as status,
  COUNT(*) as total_companies
FROM companies;

-- 3. Mostrar as empresas cadastradas
SELECT 
  id,
  name,
  created_at
FROM companies 
ORDER BY name;

-- 4. Atualizar bombas de exemplo para usar as empresas corretas
UPDATE pumps 
SET owner_company_id = '550e8400-e29b-41d4-a716-446655440001'
WHERE prefix IN ('BM-001', 'BM-003');

UPDATE pumps 
SET owner_company_id = '550e8400-e29b-41d4-a716-446655440002'
WHERE prefix = 'BM-002';

-- 5. Verificar as bombas atualizadas
SELECT 
  p.prefix,
  p.model,
  p.status,
  c.name as empresa_proprietaria
FROM pumps p
JOIN companies c ON p.owner_company_id = c.id
ORDER BY p.prefix;
