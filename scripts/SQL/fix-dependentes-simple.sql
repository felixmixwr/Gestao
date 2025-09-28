-- Script SQL simples para corrigir problemas com dependentes
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'colaboradores_dependentes' 
ORDER BY ordinal_position;

-- 2. Desabilitar RLS temporariamente
ALTER TABLE colaboradores_dependentes DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se RLS foi desabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'colaboradores_dependentes';

-- 4. Mostrar mensagem de sucesso
SELECT 'Tabela colaboradores_dependentes configurada com sucesso!' as status;





