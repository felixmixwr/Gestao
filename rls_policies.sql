-- Verificar políticas RLS existentes na tabela expenses
-- Execute este SQL para ver as políticas atuais

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
WHERE tablename = 'expenses';

-- Se não houver políticas ou estiverem restritivas, execute os comandos abaixo:

-- 1. Habilitar RLS na tabela expenses (se não estiver habilitado)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 2. Criar política para permitir INSERT para usuários autenticados
CREATE POLICY "Allow authenticated users to insert expenses" ON expenses
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- 3. Criar política para permitir SELECT para usuários autenticados
CREATE POLICY "Allow authenticated users to select expenses" ON expenses
    FOR SELECT 
    TO authenticated
    USING (true);

-- 4. Criar política para permitir UPDATE para usuários autenticados
CREATE POLICY "Allow authenticated users to update expenses" ON expenses
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Criar política para permitir DELETE para usuários autenticados (opcional)
CREATE POLICY "Allow authenticated users to delete expenses" ON expenses
    FOR DELETE 
    TO authenticated
    USING (true);

-- 6. Política mais restritiva baseada em company_id (recomendada para produção)
-- Descomente se quiser usar esta política mais segura:

/*
-- Política baseada na company_id do usuário
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
*/

-- Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'expenses';

