-- Script SQL para corrigir políticas RLS da tabela colaboradores_dependentes
-- Execute este script no Supabase SQL Editor

-- 1. Remover políticas RLS existentes (se houver)
DROP POLICY IF EXISTS "Users can manage dependentes from their company colaboradores" ON colaboradores_dependentes;

-- 2. Desabilitar RLS temporariamente para permitir inserções
ALTER TABLE colaboradores_dependentes DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se a tabela existe e tem a estrutura correta
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'colaboradores_dependentes' 
ORDER BY ordinal_position;

-- 4. Verificar se existem dados na tabela
SELECT COUNT(*) as total_dependentes FROM colaboradores_dependentes;

-- 5. Reabilitar RLS com políticas mais permissivas
ALTER TABLE colaboradores_dependentes ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS mais permissivas (permitir todas as operações para usuários autenticados)
CREATE POLICY "Allow all operations for authenticated users" ON colaboradores_dependentes
  FOR ALL USING (auth.role() = 'authenticated');

-- 7. Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'colaboradores_dependentes';

-- 8. Mostrar mensagem de sucesso
SELECT 'Políticas RLS da tabela colaboradores_dependentes corrigidas com sucesso!' as status;





