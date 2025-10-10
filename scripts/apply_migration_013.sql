-- Script para aplicar Migration 013
-- Executa a migration que adiciona campos de controle de bombeamento

\echo 'Aplicando Migration 013: Campos de Controle de Bombeamento...'

\i ../db/migrations/013_add_programacao_bombeamento_fields.sql

\echo 'Migration 013 aplicada com sucesso!'
\echo ''
\echo 'Campos adicionados à tabela programacao:'
\echo '- telefone (TEXT): Telefone do cliente'
\echo '- status_bombeamento (TEXT): Status do bombeamento (confirmado/cancelado)'
\echo '- report_id (UUID): Vinculação com relatório criado'
\echo '- motivo_cancelamento (TEXT): Motivo quando cancelado'

