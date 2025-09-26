-- Script para testar a funcionalidade de exclusão de relatórios
-- Execute este script para verificar se a exclusão está funcionando corretamente

-- 1. Verificar estrutura da tabela reports
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS na tabela reports
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
WHERE tablename = 'reports';

-- 3. Verificar permissões de DELETE na tabela reports
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'reports' 
AND privilege_type = 'DELETE';

-- 4. Contar total de relatórios antes do teste
SELECT COUNT(*) as total_reports_before FROM reports;

-- 5. Verificar alguns relatórios existentes
SELECT 
    id,
    report_number,
    date,
    client_rep_name,
    status
FROM reports 
ORDER BY date DESC 
LIMIT 5;

-- 6. Testar uma exclusão manual (CUIDADO: Esta query vai excluir um relatório!)
-- DESCOMENTE APENAS SE QUISER TESTAR A EXCLUSÃO MANUAL
-- DELETE FROM reports WHERE id = 'SUBSTITUA_PELO_ID_DO_RELATORIO_QUE_DESEJA_EXCLUIR';

-- 7. Verificar se a exclusão funcionou
-- SELECT COUNT(*) as total_reports_after FROM reports;

-- 8. Verificar logs de auditoria (se existir)
-- SELECT * FROM audit_log WHERE table_name = 'reports' AND action = 'DELETE' ORDER BY created_at DESC LIMIT 10;
