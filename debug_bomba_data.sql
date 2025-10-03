-- =============================================
-- SCRIPT PARA DEBUGAR DADOS DE BOMBAS
-- =============================================

-- 1. Verificar se existem dados na view integrada
SELECT '=== DADOS NA VIEW INTEGRADA ===' as info;
SELECT 
    COUNT(*) as total_registros,
    COUNT(bomba_prefix) as registros_com_bomba_prefix,
    COUNT(bomba_model) as registros_com_bomba_model,
    COUNT(bomba_brand) as registros_com_bomba_brand
FROM view_pagamentos_receber_integrado;

-- 2. Verificar alguns registros específicos
SELECT '=== PRIMEIROS 5 REGISTROS COM BOMBA ===' as info;
SELECT 
    id,
    report_number,
    bomba_prefix,
    bomba_model,
    bomba_brand,
    cliente_nome,
    empresa_nome
FROM view_pagamentos_receber_integrado
WHERE bomba_prefix IS NOT NULL
LIMIT 5;

-- 3. Verificar dados da tabela pumps
SELECT '=== DADOS NA TABELA PUMPS ===' as info;
SELECT 
    id,
    prefix,
    model,
    brand,
    status
FROM pumps
LIMIT 10;

-- 4. Verificar relação reports -> pumps
SELECT '=== RELAÇÃO REPORTS -> PUMPS ===' as info;
SELECT 
    r.id as report_id,
    r.report_number,
    r.pump_id,
    p.id as pump_table_id,
    p.prefix,
    p.model,
    p.brand
FROM reports r
LEFT JOIN pumps p ON r.pump_id = p.id
WHERE r.pump_id IS NOT NULL
LIMIT 10;

-- 5. Verificar se há reports sem pump_id
SELECT '=== REPORTS SEM PUMP_ID ===' as info;
SELECT 
    COUNT(*) as total_reports,
    COUNT(pump_id) as reports_com_pump_id,
    COUNT(*) - COUNT(pump_id) as reports_sem_pump_id
FROM reports;

-- 6. Verificar se há pump_id que não existem na tabela pumps
SELECT '=== PUMP_ID INVÁLIDOS ===' as info;
SELECT 
    r.id as report_id,
    r.report_number,
    r.pump_id,
    'pump_id não existe na tabela pumps' as problema
FROM reports r
LEFT JOIN pumps p ON r.pump_id = p.id
WHERE r.pump_id IS NOT NULL AND p.id IS NULL
LIMIT 10;
