-- Script para corrigir problemas de RLS na tabela pumps
-- Execute este script no Supabase SQL Editor

-- 1. Verificar status atual do RLS na tabela pumps
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'pumps';

-- 2. Habilitar RLS na tabela pumps
ALTER TABLE pumps ENABLE ROW LEVEL SECURITY;

-- 3. Criar política para permitir acesso autenticado
-- Política para SELECT (leitura)
CREATE POLICY "Permitir leitura para usuários autenticados" ON pumps
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para INSERT (inserção)
CREATE POLICY "Permitir inserção para usuários autenticados" ON pumps
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para UPDATE (atualização)
CREATE POLICY "Permitir atualização para usuários autenticados" ON pumps
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para DELETE (exclusão)
CREATE POLICY "Permitir exclusão para usuários autenticados" ON pumps
  FOR DELETE
  TO authenticated
  USING (true);

-- 4. Verificar se as políticas foram criadas
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
WHERE tablename = 'pumps';

-- 5. Verificar status final do RLS
SELECT 
  'RLS habilitado na tabela pumps' as status,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'pumps';

-- 6. Verificar se há dados na tabela pumps
SELECT 
  'Dados na tabela pumps:' as status,
  COUNT(*) as total_pumps
FROM pumps;
