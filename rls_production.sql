-- Políticas RLS seguras para produção
-- Execute este SQL APÓS o rls_fix.sql funcionar

-- 1. Remover a política permissiva de desenvolvimento
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON expenses;

-- 2. Criar política segura baseada em company_id
CREATE POLICY "Users can only access their company expenses" ON expenses
    FOR ALL 
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- 3. Verificar a estrutura da tabela users para confirmar company_id
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('id', 'company_id', 'email');

-- 4. Verificar se há usuários com company_id
SELECT id, email, company_id 
FROM users 
LIMIT 5;

-- 5. Verificar as políticas criadas
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'expenses';
