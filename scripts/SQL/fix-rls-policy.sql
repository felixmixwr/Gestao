-- Script para corrigir a política RLS da tabela reports
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se RLS está habilitado na tabela reports
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reports';

-- 2. Verificar políticas existentes na tabela reports
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'reports';

-- 3. Desabilitar RLS temporariamente (CUIDADO: isso remove todas as políticas)
-- ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- 4. Ou criar uma política permissiva para INSERT (RECOMENDADO)
-- Política para permitir INSERT para usuários autenticados
CREATE POLICY "Allow authenticated users to insert reports" ON reports
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 5. Política para permitir SELECT para usuários autenticados
CREATE POLICY "Allow authenticated users to select reports" ON reports
FOR SELECT 
TO authenticated
USING (true);

-- 6. Política para permitir UPDATE para usuários autenticados
CREATE POLICY "Allow authenticated users to update reports" ON reports
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'reports';

-- 8. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reports';
