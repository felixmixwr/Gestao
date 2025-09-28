-- Script SQL para corrigir políticas RLS da tabela colaboradores
-- Execute este script no Supabase SQL Editor

-- 1. Remover políticas RLS existentes (se houver)
DROP POLICY IF EXISTS "Users can view colaboradores from their company" ON colaboradores;
DROP POLICY IF EXISTS "Users can insert colaboradores in their company" ON colaboradores;
DROP POLICY IF EXISTS "Users can update colaboradores in their company" ON colaboradores;
DROP POLICY IF EXISTS "Users can delete colaboradores in their company" ON colaboradores;

-- 2. Desabilitar RLS temporariamente para permitir inserções
ALTER TABLE colaboradores DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se a tabela existe e tem a estrutura correta
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'colaboradores' 
ORDER BY ordinal_position;

-- 4. Verificar se existem dados na tabela
SELECT COUNT(*) as total_colaboradores FROM colaboradores;

-- 5. Testar inserção de um colaborador de exemplo (comentado para não inserir dados desnecessários)
/*
INSERT INTO colaboradores (
  nome,
  funcao,
  tipo_contrato,
  salario_fixo,
  company_id
) VALUES (
  'Teste RLS',
  'Motorista Operador de Bomba',
  'fixo',
  3000.00,
  (SELECT id FROM companies LIMIT 1)
);
*/

-- 6. Reabilitar RLS com políticas mais permissivas
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS mais permissivas (permitir todas as operações para usuários autenticados)
CREATE POLICY "Allow all operations for authenticated users" ON colaboradores
  FOR ALL USING (auth.role() = 'authenticated');

-- 8. Verificar se as políticas foram criadas
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
WHERE tablename = 'colaboradores';

-- 9. Mostrar mensagem de sucesso
SELECT 'Políticas RLS da tabela colaboradores corrigidas com sucesso!' as status;





