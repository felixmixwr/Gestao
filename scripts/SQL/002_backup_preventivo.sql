-- =============================================
-- SCRIPT DE BACKUP PREVENTIVO
-- =============================================
-- Este script cria tabelas de backup ANTES de qualquer alteração
-- NÃO MODIFICA os dados originais - apenas cria cópias de segurança

-- 1. CRIAR TABELA DE BACKUP DOS RELATÓRIOS
CREATE TABLE IF NOT EXISTS backup_reports_antes_integracao AS
SELECT * FROM reports;

-- 2. CRIAR TABELA DE BACKUP DOS PAGAMENTOS
CREATE TABLE IF NOT EXISTS backup_pagamentos_receber_antes_integracao AS
SELECT * FROM pagamentos_receber;

-- 3. CRIAR TABELA DE BACKUP DAS NOTAS FISCAIS
CREATE TABLE IF NOT EXISTS backup_notas_fiscais_antes_integracao AS
SELECT * FROM notas_fiscais;

-- 4. CRIAR TABELA DE BACKUP DOS TRIGGERS EXISTENTES
CREATE TABLE IF NOT EXISTS backup_triggers_antes_integracao AS
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('reports', 'pagamentos_receber', 'notas_fiscais');

-- 5. CRIAR TABELA DE BACKUP DAS VIEWS EXISTENTES
CREATE TABLE IF NOT EXISTS backup_views_antes_integracao AS
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE '%pagamento%';

-- 6. VERIFICAR SE OS BACKUPS FORAM CRIADOS
SELECT '=== VERIFICAÇÃO DOS BACKUPS CRIADOS ===' as info;

SELECT 
    'backup_reports_antes_integracao' as tabela_backup,
    COUNT(*) as registros_backup
FROM backup_reports_antes_integracao
UNION ALL
SELECT 
    'backup_pagamentos_receber_antes_integracao' as tabela_backup,
    COUNT(*) as registros_backup
FROM backup_pagamentos_receber_antes_integracao
UNION ALL
SELECT 
    'backup_notas_fiscais_antes_integracao' as tabela_backup,
    COUNT(*) as registros_backup
FROM backup_notas_fiscais_antes_integracao
UNION ALL
SELECT 
    'backup_triggers_antes_integracao' as tabela_backup,
    COUNT(*) as registros_backup
FROM backup_triggers_antes_integracao
UNION ALL
SELECT 
    'backup_views_antes_integracao' as tabela_backup,
    COUNT(*) as registros_backup
FROM backup_views_antes_integracao;

-- 7. CRIAR SCRIPT DE ROLLBACK (para uso em emergência)
-- Este será salvo em arquivo separado para uso manual se necessário

SELECT '=== BACKUP PREVENTIVO CONCLUÍDO ===' as info;
SELECT 'Todos os dados foram copiados para tabelas de backup' as status;
SELECT 'Em caso de problema, use o script de rollback' as observacao;
