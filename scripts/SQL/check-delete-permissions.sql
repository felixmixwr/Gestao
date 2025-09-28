-- Script para verificar permissões de exclusão na tabela reports

-- 1. Verificar se a tabela reports existe e tem a estrutura correta
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'reports';

-- 2. Verificar todas as políticas RLS ativas na tabela reports
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'reports'
ORDER BY policyname;

-- 3. Verificar permissões específicas de DELETE
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'reports' 
AND privilege_type IN ('DELETE', 'ALL');

-- 4. Verificar se RLS está habilitado na tabela
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'reports';

-- 5. Verificar usuário atual e suas permissões
SELECT current_user, session_user;

-- 6. Verificar se o usuário tem permissão para DELETE
SELECT 
    has_table_privilege(current_user, 'reports', 'DELETE') as can_delete,
    has_table_privilege(current_user, 'reports', 'SELECT') as can_select,
    has_table_privilege(current_user, 'reports', 'INSERT') as can_insert,
    has_table_privilege(current_user, 'reports', 'UPDATE') as can_update;

-- 7. Verificar se existem constraints que podem impedir exclusão
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'reports'
AND tc.constraint_type IN ('FOREIGN KEY', 'CHECK');

-- 8. Teste simples: tentar fazer um SELECT para verificar se a conexão está funcionando
SELECT COUNT(*) as total_reports FROM reports LIMIT 1;
