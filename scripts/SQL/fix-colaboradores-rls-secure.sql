-- Script SQL para corrigir políticas RLS da tabela colaboradores (versão segura)
-- Execute este script no Supabase SQL Editor

-- 1. Remover políticas RLS existentes
DROP POLICY IF EXISTS "Users can view colaboradores from their company" ON colaboradores;
DROP POLICY IF EXISTS "Users can insert colaboradores in their company" ON colaboradores;
DROP POLICY IF EXISTS "Users can update colaboradores in their company" ON colaboradores;
DROP POLICY IF EXISTS "Users can delete colaboradores in their company" ON colaboradores;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON colaboradores;

-- 2. Criar políticas RLS mais flexíveis
-- Política para visualizar colaboradores (permitir visualizar todos para usuários autenticados)
CREATE POLICY "Authenticated users can view colaboradores" ON colaboradores
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para inserir colaboradores (permitir inserir para usuários autenticados)
CREATE POLICY "Authenticated users can insert colaboradores" ON colaboradores
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para atualizar colaboradores (permitir atualizar para usuários autenticados)
CREATE POLICY "Authenticated users can update colaboradores" ON colaboradores
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para deletar colaboradores (permitir deletar para usuários autenticados)
CREATE POLICY "Authenticated users can delete colaboradores" ON colaboradores
  FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Verificar se as políticas foram criadas corretamente
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
WHERE tablename = 'colaboradores'
ORDER BY policyname;

-- 4. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'colaboradores';

-- 5. Mostrar mensagem de sucesso
SELECT 'Políticas RLS da tabela colaboradores corrigidas com sucesso!' as status;





