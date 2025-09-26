-- Script simples para testar a funcionalidade de exclusão
-- Compatível com todas as versões do PostgreSQL

-- 1. Verificar se a tabela reports existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'reports';

-- 2. Contar total de relatórios
SELECT COUNT(*) as total_reports FROM reports;

-- 3. Verificar alguns relatórios existentes
SELECT 
    id,
    report_number,
    date,
    client_rep_name,
    status
FROM reports 
ORDER BY date DESC 
LIMIT 5;

-- 4. Verificar políticas RLS (se existirem)
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'reports';

-- 5. Verificar permissões básicas
SELECT 
    has_table_privilege(current_user, 'reports', 'DELETE') as can_delete,
    has_table_privilege(current_user, 'reports', 'SELECT') as can_select;

-- 6. Verificar usuário atual
SELECT current_user;

-- 7. Teste de conectividade básica
SELECT 'Conexão funcionando!' as status;
