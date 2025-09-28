-- Script SQL para desabilitar RLS na tabela colaboradores_dependentes temporariamente
-- Execute este script no Supabase SQL Editor

-- 1. Desabilitar RLS na tabela colaboradores_dependentes
ALTER TABLE colaboradores_dependentes DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se RLS foi desabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'colaboradores_dependentes';

-- 3. Mostrar mensagem de sucesso
SELECT 'RLS desabilitado na tabela colaboradores_dependentes com sucesso!' as status;





