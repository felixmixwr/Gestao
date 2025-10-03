-- =============================================
-- VERIFICAR E CORRIGIR MÓDULO FINANCEIRO
-- =============================================
-- Este script verifica e corrige problemas no módulo financeiro

-- 1. VERIFICAR SE A TABELA EXPENSES EXISTE
SELECT '=== VERIFICANDO TABELA EXPENSES ===' as info;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'expenses' 
            AND table_schema = 'public'
        ) 
        THEN '✅ Tabela expenses EXISTE'
        ELSE '❌ Tabela expenses NÃO EXISTE'
    END as status_expenses;

-- 2. VERIFICAR ESTRUTURA DA TABELA EXPENSES (se existir)
SELECT '=== ESTRUTURA DA TABELA EXPENSES ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR DADOS NA TABELA EXPENSES
SELECT '=== DADOS NA TABELA EXPENSES ===' as info;

SELECT 
    COUNT(*) as total_expenses,
    COUNT(CASE WHEN status = 'pago' THEN 1 END) as expenses_pagas,
    COUNT(CASE WHEN status = 'pendente' THEN 1 END) as expenses_pendentes,
    COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as expenses_canceladas
FROM expenses;

-- 4. VERIFICAR VIEWS RELACIONADAS AO FINANCEIRO
SELECT '=== VERIFICANDO VIEWS FINANCEIRAS ===' as info;

SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname LIKE '%financial%' 
   OR viewname LIKE '%expense%'
   OR viewname LIKE '%faturamento%'
ORDER BY viewname;

-- 5. VERIFICAR SE HÁ DADOS DE TESTE
SELECT '=== VERIFICANDO DADOS DE TESTE ===' as info;

SELECT 
    'Total de empresas' as tipo,
    COUNT(*) as quantidade
FROM companies

UNION ALL

SELECT 
    'Total de bombas' as tipo,
    COUNT(*) as quantidade
FROM pumps

UNION ALL

SELECT 
    'Total de despesas' as tipo,
    COUNT(*) as quantidade
FROM expenses;

-- 6. CRIAR DADOS DE TESTE SE NECESSÁRIO
SELECT '=== CRIANDO DADOS DE TESTE ===' as info;

-- Verificar se há empresas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM companies LIMIT 1) THEN
        INSERT INTO companies (id, name) VALUES 
        ('550e8400-e29b-41d4-a716-446655440000', 'Felix Mix'),
        ('550e8400-e29b-41d4-a716-446655440001', 'World Rental');
        RAISE NOTICE 'Empresas de teste criadas';
    ELSE
        RAISE NOTICE 'Empresas já existem';
    END IF;
END $$;

-- Verificar se há bombas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pumps LIMIT 1) THEN
        INSERT INTO pumps (id, name, model, status, company_id) VALUES 
        ('660e8400-e29b-41d4-a716-446655440000', 'WM-001', 'Modelo A', 'active', '550e8400-e29b-41d4-a716-446655440000'),
        ('660e8400-e29b-41d4-a716-446655440001', 'WM-002', 'Modelo B', 'active', '550e8400-e29b-41d4-a716-446655440000'),
        ('660e8400-e29b-41d4-a716-446655440002', 'WR-001', 'Modelo C', 'active', '550e8400-e29b-41d4-a716-446655440001');
        RAISE NOTICE 'Bombas de teste criadas';
    ELSE
        RAISE NOTICE 'Bombas já existem';
    END IF;
END $$;

-- Verificar se há despesas de teste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM expenses LIMIT 1) THEN
        INSERT INTO expenses (
            descricao, categoria, valor, tipo_custo, data_despesa, 
            pump_id, company_id, status, observacoes
        ) VALUES 
        (
            'Abastecimento de diesel para bomba WM-001', 
            'Diesel', 
            500.00, 
            'variável', 
            CURRENT_DATE - INTERVAL '5 days',
            '660e8400-e29b-41d4-a716-446655440000',
            '550e8400-e29b-41d4-a716-446655440000',
            'pago',
            'Abastecimento realizado no posto da BR'
        ),
        (
            'Manutenção preventiva bomba WM-002', 
            'Manutenção', 
            1200.00, 
            'fixo', 
            CURRENT_DATE - INTERVAL '3 days',
            '660e8400-e29b-41d4-a716-446655440001',
            '550e8400-e29b-41d4-a716-446655440000',
            'pago',
            'Troca de óleo e filtros'
        ),
        (
            'Salário operador João Silva', 
            'Mão de obra', 
            2500.00, 
            'fixo', 
            CURRENT_DATE - INTERVAL '1 day',
            '660e8400-e29b-41d4-a716-446655440000',
            '550e8400-e29b-41d4-a716-446655440000',
            'pago',
            'Salário mensal janeiro 2025'
        ),
        (
            'Imposto ICMS', 
            'Imposto', 
            800.00, 
            'fixo', 
            CURRENT_DATE,
            '660e8400-e29b-41d4-a716-446655440001',
            '550e8400-e29b-41d4-a716-446655440001',
            'pendente',
            'Imposto sobre serviços'
        ),
        (
            'Material de limpeza', 
            'Outros', 
            150.00, 
            'variável', 
            CURRENT_DATE - INTERVAL '2 days',
            '660e8400-e29b-41d4-a716-446655440002',
            '550e8400-e29b-41d4-a716-446655440001',
            'pago',
            'Produtos de limpeza para equipamentos'
        );
        RAISE NOTICE 'Despesas de teste criadas';
    ELSE
        RAISE NOTICE 'Despesas já existem';
    END IF;
END $$;

-- 7. VERIFICAR ESTATÍSTICAS FINANCEIRAS
SELECT '=== ESTATÍSTICAS FINANCEIRAS ===' as info;

SELECT 
    'Total de despesas' as metric,
    COUNT(*) as valor
FROM expenses

UNION ALL

SELECT 
    'Valor total das despesas' as metric,
    COALESCE(SUM(valor), 0) as valor
FROM expenses

UNION ALL

SELECT 
    'Despesas pagas' as metric,
    COUNT(*) as valor
FROM expenses
WHERE status = 'pago'

UNION ALL

SELECT 
    'Despesas pendentes' as metric,
    COUNT(*) as valor
FROM expenses
WHERE status = 'pendente'

UNION ALL

SELECT 
    'Valor despesas pagas' as metric,
    COALESCE(SUM(valor), 0) as valor
FROM expenses
WHERE status = 'pago'

UNION ALL

SELECT 
    'Valor despesas pendentes' as metric,
    COALESCE(SUM(valor), 0) as valor
FROM expenses
WHERE status = 'pendente';

-- 8. VERIFICAR DESPESAS POR CATEGORIA
SELECT '=== DESPESAS POR CATEGORIA ===' as info;

SELECT 
    categoria,
    COUNT(*) as quantidade,
    SUM(valor) as valor_total,
    ROUND(AVG(valor), 2) as valor_medio
FROM expenses
GROUP BY categoria
ORDER BY valor_total DESC;

-- 9. VERIFICAR DESPESAS POR BOMBA
SELECT '=== DESPESAS POR BOMBA ===' as info;

SELECT 
    p.name as bomba_nome,
    p.model as bomba_modelo,
    c.name as empresa_nome,
    COUNT(e.id) as quantidade_despesas,
    SUM(e.valor) as valor_total
FROM expenses e
JOIN pumps p ON e.pump_id = p.id
JOIN companies c ON e.company_id = c.id
GROUP BY p.id, p.name, p.model, c.name
ORDER BY valor_total DESC;

-- 10. VERIFICAR DESPESAS POR EMPRESA
SELECT '=== DESPESAS POR EMPRESA ===' as info;

SELECT 
    c.name as empresa_nome,
    COUNT(e.id) as quantidade_despesas,
    SUM(e.valor) as valor_total,
    ROUND(AVG(e.valor), 2) as valor_medio
FROM expenses e
JOIN companies c ON e.company_id = c.id
GROUP BY c.id, c.name
ORDER BY valor_total DESC;

-- 11. VERIFICAR DESPESAS POR TIPO DE CUSTO
SELECT '=== DESPESAS POR TIPO DE CUSTO ===' as info;

SELECT 
    tipo_custo,
    COUNT(*) as quantidade,
    SUM(valor) as valor_total,
    ROUND(AVG(valor), 2) as valor_medio
FROM expenses
GROUP BY tipo_custo
ORDER BY valor_total DESC;

-- 12. VERIFICAR DESPESAS POR STATUS
SELECT '=== DESPESAS POR STATUS ===' as info;

SELECT 
    status,
    COUNT(*) as quantidade,
    SUM(valor) as valor_total,
    ROUND(AVG(valor), 2) as valor_medio
FROM expenses
GROUP BY status
ORDER BY valor_total DESC;

-- 13. VERIFICAR DESPESAS RECENTES
SELECT '=== DESPESAS RECENTES ===' as info;

SELECT 
    e.descricao,
    e.categoria,
    e.valor,
    e.tipo_custo,
    e.status,
    e.data_despesa,
    p.name as bomba_nome,
    c.name as empresa_nome
FROM expenses e
JOIN pumps p ON e.pump_id = p.id
JOIN companies c ON e.company_id = c.id
ORDER BY e.created_at DESC
LIMIT 10;

SELECT '=== VERIFICAÇÃO COMPLETA ===' as info;
