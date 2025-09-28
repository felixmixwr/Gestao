-- Script simples para verificar a estrutura da tabela reports
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todos os campos da tabela reports
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- 2. Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'reports'
) as table_exists;

-- 3. Contar registros na tabela
SELECT COUNT(*) as total_reports FROM reports;
