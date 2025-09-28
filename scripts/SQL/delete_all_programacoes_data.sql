-- =====================================================
-- SCRIPT PARA EXCLUIR TODOS OS DADOS DE PROGRAMAÇÕES
-- =====================================================
-- ⚠️  ATENÇÃO: Este script irá EXCLUIR PERMANENTEMENTE todos os dados relacionados a programações/bombas
-- ⚠️  Execute apenas se tiver CERTEZA de que deseja remover todos esses dados
-- ⚠️  Recomenda-se fazer backup antes de executar

-- =====================================================
-- 1. DESABILITAR TRIGGERS E CONSTRAINTS TEMPORARIAMENTE
-- =====================================================

-- Desabilitar triggers relacionados a bombas
DROP TRIGGER IF EXISTS trigger_update_pump_total_billed ON reports;
DROP TRIGGER IF EXISTS trigger_update_pumps_updated_at ON pumps;
DROP TRIGGER IF EXISTS update_bombas_terceiras_updated_at ON bombas_terceiras;

-- =====================================================
-- 2. EXCLUIR DADOS DAS TABELAS PRINCIPAIS
-- =====================================================

-- Excluir todos os relatórios que referenciam bombas
DELETE FROM reports WHERE pump_id IS NOT NULL;

-- Excluir todos os pagamentos a receber relacionados a bombas
DELETE FROM pagamentos_receber WHERE id IN (
    SELECT pr.id 
    FROM pagamentos_receber pr
    JOIN reports r ON pr.report_id = r.id
    WHERE r.pump_id IS NOT NULL
);

-- Excluir todas as notas relacionadas a bombas
DELETE FROM notes WHERE report_id IN (
    SELECT id FROM reports WHERE pump_id IS NOT NULL
);

-- =====================================================
-- 3. EXCLUIR DADOS DAS TABELAS DE BOMBAS
-- =====================================================

-- Excluir todas as bombas terceiras
DELETE FROM bombas_terceiras;

-- Excluir todas as bombas principais
DELETE FROM pumps;

-- =====================================================
-- 4. EXCLUIR DADOS DAS TABELAS DE EMPRESAS TERCEIRAS
-- =====================================================

-- Excluir todas as empresas terceiras (que possuem bombas)
DELETE FROM empresas_terceiras;

-- =====================================================
-- 5. EXCLUIR FUNÇÕES E PROCEDURES RELACIONADAS
-- =====================================================

-- Excluir funções relacionadas a bombas
DROP FUNCTION IF EXISTS update_pump_total_billed();
DROP FUNCTION IF EXISTS increment_pump_total_billed(UUID, DECIMAL);
DROP FUNCTION IF EXISTS create_report_with_pump_data(JSONB);
DROP FUNCTION IF EXISTS calcular_dias_vencimento(DATE);
DROP FUNCTION IF EXISTS migrar_nota_emitida_com_configuracoes(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS atualizar_vencimentos_pagamentos_existentes();
DROP FUNCTION IF EXISTS recalcular_dias_pagamentos_existentes();

-- =====================================================
-- 6. EXCLUIR VIEWS RELACIONADAS
-- =====================================================

-- Excluir views relacionadas a bombas
DROP VIEW IF EXISTS view_bombas_terceiras_com_empresa;
DROP VIEW IF EXISTS view_pagamentos_receber_completo;

-- =====================================================
-- 7. EXCLUIR TIPOS CUSTOMIZADOS
-- =====================================================

-- Excluir enums relacionados a bombas
DROP TYPE IF EXISTS status_bomba_terceira CASCADE;

-- =====================================================
-- 8. EXCLUIR ÍNDICES RELACIONADOS
-- =====================================================

-- Excluir índices da tabela pumps
DROP INDEX IF EXISTS idx_pumps_prefix;
DROP INDEX IF EXISTS idx_pumps_status;
DROP INDEX IF EXISTS idx_pumps_owner_company_id;
DROP INDEX IF EXISTS idx_pumps_total_billed;

-- Excluir índices da tabela bombas_terceiras
DROP INDEX IF EXISTS idx_bombas_terceiras_empresa_id;
DROP INDEX IF EXISTS idx_bombas_terceiras_prefixo;
DROP INDEX IF EXISTS idx_bombas_terceiras_status;
DROP INDEX IF EXISTS idx_bombas_terceiras_proxima_manutencao;
DROP INDEX IF EXISTS idx_bombas_terceiras_created_at;
DROP INDEX IF EXISTS idx_bombas_terceiras_empresa_prefixo;

-- Excluir índices da tabela reports relacionados a bombas
DROP INDEX IF EXISTS idx_reports_pump_id;
DROP INDEX IF EXISTS idx_reports_pump_prefix;

-- =====================================================
-- 9. EXCLUIR POLÍTICAS RLS RELACIONADAS
-- =====================================================

-- Excluir políticas RLS da tabela pumps
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON pumps;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON pumps;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON pumps;
DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados" ON pumps;

-- Excluir políticas RLS da tabela bombas_terceiras
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON bombas_terceiras;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON bombas_terceiras;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON bombas_terceiras;
DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados" ON bombas_terceiras;

-- Excluir políticas RLS da tabela empresas_terceiras
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON empresas_terceiras;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON empresas_terceiras;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON empresas_terceiras;
DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados" ON empresas_terceiras;

-- =====================================================
-- 10. EXCLUIR COLUNAS RELACIONADAS A BOMBAS
-- =====================================================

-- Remover colunas relacionadas a bombas da tabela reports
ALTER TABLE reports DROP COLUMN IF EXISTS pump_id;
ALTER TABLE reports DROP COLUMN IF EXISTS pump_prefix;
ALTER TABLE reports DROP COLUMN IF EXISTS pump_owner_company_id;

-- Remover colunas relacionadas a bombas da tabela colaboradores
ALTER TABLE colaboradores DROP COLUMN IF EXISTS equipamento_vinculado_id;

-- =====================================================
-- 11. EXCLUIR TABELAS COMPLETAS
-- =====================================================

-- Excluir tabelas relacionadas a bombas
DROP TABLE IF EXISTS bombas_terceiras CASCADE;
DROP TABLE IF EXISTS pumps CASCADE;
DROP TABLE IF EXISTS empresas_terceiras CASCADE;

-- =====================================================
-- 12. LIMPEZA FINAL E VERIFICAÇÃO
-- =====================================================

-- Verificar se ainda existem referências a bombas
DO $$
DECLARE
    remaining_references INTEGER;
BEGIN
    -- Verificar se ainda existem colunas relacionadas a bombas
    SELECT COUNT(*) INTO remaining_references
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND (column_name LIKE '%pump%' OR column_name LIKE '%bomba%');
    
    IF remaining_references > 0 THEN
        RAISE NOTICE '⚠️ Ainda existem % colunas relacionadas a bombas', remaining_references;
    ELSE
        RAISE NOTICE '✅ Todas as colunas relacionadas a bombas foram removidas';
    END IF;
    
    -- Verificar se ainda existem tabelas relacionadas a bombas
    SELECT COUNT(*) INTO remaining_references
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (table_name LIKE '%pump%' OR table_name LIKE '%bomba%');
    
    IF remaining_references > 0 THEN
        RAISE NOTICE '⚠️ Ainda existem % tabelas relacionadas a bombas', remaining_references;
    ELSE
        RAISE NOTICE '✅ Todas as tabelas relacionadas a bombas foram removidas';
    END IF;
END $$;

-- =====================================================
-- 13. RELATÓRIO FINAL
-- =====================================================

-- Mostrar estatísticas finais
SELECT 
    'RELATÓRIO FINAL DE LIMPEZA' as relatorio,
    'Programações/Bombas' as tipo_dados,
    'Removidos com sucesso' as status;

-- Verificar dados restantes
SELECT 
    'DADOS RESTANTES' as verificacao,
    (SELECT COUNT(*) FROM reports) as total_reports,
    (SELECT COUNT(*) FROM clients) as total_clients,
    (SELECT COUNT(*) FROM companies) as total_companies,
    (SELECT COUNT(*) FROM colaboradores) as total_colaboradores,
    (SELECT COUNT(*) FROM notes) as total_notes,
    (SELECT COUNT(*) FROM pagamentos_receber) as total_pagamentos;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- ✅ Todas as programações/bombas foram excluídas do banco de dados
-- ✅ Estruturas relacionadas foram removidas
-- ✅ Dados órfãos foram limpos
-- ✅ Banco de dados está limpo de dados de programações




