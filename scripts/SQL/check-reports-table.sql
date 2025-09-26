-- Script para verificar e corrigir a estrutura da tabela reports
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar a estrutura atual da tabela reports
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- 2. Adicionar campos que podem estar faltando
-- (Execute apenas os comandos necessários baseado na estrutura atual)

-- Adicionar service_company_id se não existir
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS service_company_id UUID REFERENCES companies(id);

-- Adicionar driver_name se não existir
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS driver_name TEXT;

-- Adicionar assistant1_name se não existir
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS assistant1_name TEXT;

-- Adicionar assistant2_name se não existir
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS assistant2_name TEXT;

-- 3. Verificar a estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- 4. Verificar se há registros na tabela
SELECT COUNT(*) as total_reports FROM reports;
