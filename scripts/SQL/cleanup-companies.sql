-- Script para limpar empresas e manter apenas FELIX MIX e WORLDPAV
-- Execute este script no Supabase SQL Editor

-- 1. Verificar empresas existentes antes da limpeza
SELECT 
  'Empresas existentes ANTES da limpeza:' as status,
  COUNT(*) as total_companies
FROM companies;

SELECT 
  id,
  name,
  created_at
FROM companies 
ORDER BY name;

-- 2. Limpar empresas existentes (manter apenas FELIX MIX e WORLDPAV)
-- Primeiro, atualizar bombas que referenciam empresas que serão removidas
UPDATE pumps 
SET owner_company_id = '550e8400-e29b-41d4-a716-446655440001'  -- FELIX MIX
WHERE owner_company_id IN (
  SELECT id FROM companies 
  WHERE name NOT IN ('FELIX MIX', 'WORLDPAV')
);

-- Remover empresas que não são FELIX MIX ou WORLDPAV
DELETE FROM companies WHERE name NOT IN ('FELIX MIX', 'WORLDPAV');

-- 3. Inserir as empresas específicas do projeto
INSERT INTO companies (id, name, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'FELIX MIX', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'WORLDPAV', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- 4. Verificar empresas após a limpeza
SELECT 
  'Empresas após limpeza:' as status,
  COUNT(*) as total_companies
FROM companies;

SELECT 
  id,
  name,
  created_at
FROM companies 
ORDER BY name;

-- 5. Verificar bombas e suas empresas associadas
SELECT 
  p.prefix,
  p.model,
  p.status,
  c.name as empresa_proprietaria
FROM pumps p
LEFT JOIN companies c ON p.owner_company_id = c.id
ORDER BY p.prefix;

-- 6. Verificar se há bombas sem empresa associada
SELECT 
  'Bombas sem empresa associada:' as status,
  COUNT(*) as total_pumps_without_company
FROM pumps p
LEFT JOIN companies c ON p.owner_company_id = c.id
WHERE c.id IS NULL;
