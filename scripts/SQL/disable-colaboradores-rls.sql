-- Script SQL para desabilitar RLS na tabela colaboradores temporariamente
-- Execute este script no Supabase SQL Editor

-- 1. Desabilitar RLS na tabela colaboradores
ALTER TABLE colaboradores DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se RLS foi desabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'colaboradores';

-- 3. Mostrar mensagem de sucesso
SELECT 'RLS desabilitado na tabela colaboradores com sucesso!' as status;





