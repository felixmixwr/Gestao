-- Script para aplicar Migration 014
-- Corrige ambiguidade na função create_bombing_report

\echo 'Aplicando Migration 014: Corrigir ambiguidade em create_bombing_report...'

\i ../db/migrations/014_fix_create_bombing_report_ambiguity.sql

\echo 'Migration 014 aplicada com sucesso!'
\echo ''
\echo 'Correções aplicadas:'
\echo '- Variável report_number renomeada para new_report_number'
\echo '- Qualificada coluna reports.report_number para evitar ambiguidade'
\echo '- Status padrão alterado para ENVIADO_FINANCEIRO'
\echo ''
\echo 'A função create_bombing_report agora funciona corretamente!'

