-- Fix para Row Level Security na tabela expenses
-- Execute este SQL no Supabase SQL Editor

-- 1. Primeiro, vamos verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'expenses';

-- 2. Remover políticas existentes se houver (opcional - descomente se necessário)
-- DROP POLICY IF EXISTS "Allow authenticated users to insert expenses" ON expenses;
-- DROP POLICY IF EXISTS "Allow authenticated users to select expenses" ON expenses;
-- DROP POLICY IF EXISTS "Allow authenticated users to update expenses" ON expenses;
-- DROP POLICY IF EXISTS "Allow authenticated users to delete expenses" ON expenses;

-- 3. Habilitar RLS se não estiver habilitado
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas permissivas para desenvolvimento/teste
CREATE POLICY "Allow all operations for authenticated users" ON expenses
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Verificar se a política foi criada
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'expenses';

-- 6. Teste: Verificar se o usuário atual tem acesso
SELECT current_user, auth.uid();

-- Se ainda houver problemas, execute também:
-- GRANT ALL ON expenses TO authenticated;
-- GRANT ALL ON expenses TO anon;


