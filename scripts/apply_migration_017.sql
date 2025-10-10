-- Script para aplicar Migration 017
-- Corrige constraint de FK entre programacao e reports

\echo '======================================'
\echo 'Aplicando Migration 017'
\echo 'Corrigindo constraint programacao_report_id_fkey'
\echo '======================================'
\echo ''

-- Aplicar migration
\i db/migrations/017_fix_programacao_report_fkey.sql

\echo ''
\echo '======================================'
\echo 'Migration 017 aplicada com sucesso!'
\echo '======================================'
\echo ''

-- Verificar constraint
\echo 'Verificando constraint:'
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_name = 'programacao_report_id_fkey';

