-- =============================================
-- VERIFICAR ESTRUTURA DAS TABELAS DE NOTAS FISCAIS
-- =============================================
-- Este script verifica qual tabela existe e sua estrutura

-- 1. VERIFICAR QUAIS TABELAS EXISTEM
SELECT '=== VERIFICANDO TABELAS DE NOTAS FISCAIS ===' as info;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%nota%' OR table_name LIKE '%note%')
ORDER BY table_name;

-- 2. VERIFICAR ESTRUTURA DA TABELA 'notes' (se existir)
SELECT '=== ESTRUTURA DA TABELA notes ===' as info;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR ESTRUTURA DA TABELA 'notas_fiscais' (se existir)
SELECT '=== ESTRUTURA DA TABELA notas_fiscais ===' as info;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICAR DADOS NAS TABELAS
SELECT '=== DADOS NA TABELA notes ===' as info;

SELECT COUNT(*) as total_registros FROM notes;

-- Verificar se existe tabela notas_fiscais
SELECT '=== DADOS NA TABELA notas_fiscais ===' as info;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notas_fiscais' AND table_schema = 'public')
        THEN (SELECT COUNT(*)::text FROM notas_fiscais)
        ELSE 'Tabela não existe'
    END as total_registros;

-- 5. MOSTRAR ESTRUTURA CORRETA PARA A VIEW
SELECT '=== ESTRUTURA CORRETA PARA A VIEW ===' as info;

-- Se existe tabela 'notes', usar essa estrutura:
SELECT 
    'Usar tabela "notes" com campos:' as info,
    'nf.id, nf.nf_number as numero_nota, nf.nf_date as nf_data_emissao, nf.nf_due_date as nf_data_vencimento, nf.nf_value as nf_valor, nf.report_id as relatorio_id' as campos_corretos;

-- 6. TESTAR JOIN CORRETO
SELECT '=== TESTANDO JOIN CORRETO ===' as info;

-- Teste com tabela 'notes'
SELECT 
    r.id as relatorio_id,
    r.report_number,
    nf.id as nota_fiscal_id,
    nf.nf_number as numero_nota,
    nf.nf_date as nf_data_emissao,
    nf.nf_value as nf_valor
FROM reports r
LEFT JOIN notes nf ON r.id = nf.report_id
LIMIT 5;

SELECT '=== VERIFICAÇÃO CONCLUÍDA ===' as info;
