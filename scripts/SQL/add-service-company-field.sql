-- Script para adicionar o campo service_company_id na tabela reports
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar o campo service_company_id na tabela reports
ALTER TABLE reports 
ADD COLUMN service_company_id UUID REFERENCES companies(id);

-- 2. Verificar se o campo foi adicionado
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name = 'service_company_id';

-- 3. (Opcional) Atualizar registros existentes com uma empresa padrão
-- Substitua 'ID_DA_EMPRESA' pelo ID real de uma das empresas
-- UPDATE reports 
-- SET service_company_id = 'ID_DA_EMPRESA' 
-- WHERE service_company_id IS NULL;

-- 4. Verificar as empresas disponíveis
SELECT id, name FROM companies ORDER BY name;
