-- =============================================
-- TESTAR SINCRONIZAÇÃO NOTAS FISCAIS → PAGAMENTOS A RECEBER
-- =============================================
-- Este script testa a sincronização automática

-- 1. VERIFICAR ESTADO ATUAL
SELECT '=== ESTADO ATUAL DAS NOTAS FISCAIS E PAGAMENTOS ===' as info;

SELECT 
    'Notas Fiscais' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN data_emissao IS NOT NULL THEN 1 END) as com_data_emissao,
    COUNT(CASE WHEN data_vencimento IS NOT NULL THEN 1 END) as com_data_vencimento
FROM notas_fiscais

UNION ALL

SELECT 
    'Pagamentos sem forma' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN forma_pagamento = 'sem_forma' THEN 1 END) as sem_forma,
    COUNT(CASE WHEN forma_pagamento = 'boleto' THEN 1 END) as com_boleto
FROM pagamentos_receber;

-- 2. VERIFICAR RELATÓRIOS COM NOTAS FISCAIS E PAGAMENTOS
SELECT '=== RELATÓRIOS COM NOTAS FISCAIS E PAGAMENTOS ===' as info;

SELECT 
    r.id as relatorio_id,
    r.report_number,
    r.date as data_relatorio,
    r.total_value,
    nf.numero_nota,
    nf.data_emissao,
    nf.data_vencimento,
    pr.id as pagamento_id,
    pr.forma_pagamento,
    pr.prazo_data,
    CASE 
        WHEN pr.forma_pagamento = 'boleto' AND pr.prazo_data = nf.data_vencimento 
        THEN 'SINCRONIZADO' 
        ELSE 'NÃO SINCRONIZADO' 
    END as status_sincronizacao
FROM reports r
JOIN notas_fiscais nf ON r.id = nf.relatorio_id
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
ORDER BY r.date DESC
LIMIT 10;

-- 3. SIMULAR CRIAÇÃO DE NOVA NOTA FISCAL
SELECT '=== SIMULANDO CRIAÇÃO DE NOVA NOTA FISCAL ===' as info;

-- Encontrar um relatório sem nota fiscal para testar
SELECT 
    r.id as relatorio_id,
    r.report_number,
    r.date,
    r.total_value,
    pr.id as pagamento_id,
    pr.forma_pagamento,
    pr.prazo_data
FROM reports r
LEFT JOIN notas_fiscais nf ON r.id = nf.relatorio_id
LEFT JOIN pagamentos_receber pr ON r.id = pr.relatorio_id
WHERE nf.id IS NULL 
AND pr.id IS NOT NULL 
AND pr.forma_pagamento = 'sem_forma'
ORDER BY r.date DESC
LIMIT 5;

-- 4. TESTAR A FUNÇÃO DE SINCRONIZAÇÃO MANUALMENTE
SELECT '=== TESTANDO FUNÇÃO DE SINCRONIZAÇÃO ===' as info;

-- Exemplo de como testar com um relatório específico
-- Substitua 'RELATORIO_ID_AQUI' pelo ID real de um relatório
/*
SELECT * FROM testar_sincronizacao_nota_fiscal('RELATORIO_ID_AQUI');
*/

-- 5. VERIFICAR TRIGGERS ATIVOS
SELECT '=== VERIFICANDO TRIGGERS ATIVOS ===' as info;

SELECT 
    schemaname,
    tablename,
    triggername,
    triggerdef
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'notas_fiscais'
AND n.nspname = 'public';

-- 6. VERIFICAR LOGS DE SINCRONIZAÇÃO
SELECT '=== VERIFICANDO LOGS RECENTES ===' as info;

-- Verificar se há mensagens de log recentes
-- (Esta consulta pode não retornar resultados se os logs não estiverem configurados)
SELECT 
    'Logs de sincronização não disponíveis neste ambiente' as info;

-- 7. TESTAR ATUALIZAÇÃO MANUAL DE UMA NOTA FISCAL
SELECT '=== TESTANDO ATUALIZAÇÃO MANUAL ===' as info;

-- Encontrar uma nota fiscal para testar atualização
SELECT 
    nf.id,
    nf.relatorio_id,
    nf.numero_nota,
    nf.data_emissao,
    nf.data_vencimento,
    pr.forma_pagamento,
    pr.prazo_data
FROM notas_fiscais nf
LEFT JOIN pagamentos_receber pr ON nf.relatorio_id = pr.relatorio_id
ORDER BY nf.created_at DESC
LIMIT 3;

-- 8. VERIFICAR INTEGRIDADE DOS DADOS
SELECT '=== VERIFICANDO INTEGRIDADE ===' as info;

-- Verificar se há inconsistências
SELECT 
    'Inconsistências encontradas:' as tipo,
    COUNT(*) as quantidade
FROM notas_fiscais nf
JOIN pagamentos_receber pr ON nf.relatorio_id = pr.relatorio_id
WHERE pr.forma_pagamento = 'boleto' 
AND pr.prazo_data != nf.data_vencimento

UNION ALL

SELECT 
    'Pagamentos sem sincronização:' as tipo,
    COUNT(*) as quantidade
FROM notas_receber pr
JOIN notas_fiscais nf ON pr.relatorio_id = nf.relatorio_id
WHERE pr.forma_pagamento = 'sem_forma';

-- 9. RESUMO FINAL
SELECT '=== RESUMO FINAL ===' as info;

SELECT 
    'Total de notas fiscais' as metric,
    COUNT(*) as valor
FROM notas_fiscais

UNION ALL

SELECT 
    'Pagamentos com boleto' as metric,
    COUNT(*) as valor
FROM pagamentos_receber
WHERE forma_pagamento = 'boleto'

UNION ALL

SELECT 
    'Pagamentos sem forma' as metric,
    COUNT(*) as valor
FROM pagamentos_receber
WHERE forma_pagamento = 'sem_forma'

UNION ALL

SELECT 
    'Relatórios com notas fiscais' as metric,
    COUNT(DISTINCT relatorio_id) as valor
FROM notas_fiscais;

SELECT '=== TESTE CONCLUÍDO ===' as info;
