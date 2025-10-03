-- =============================================
-- CORRIGIR DADOS DE TESTE DO MÓDULO FINANCEIRO
-- =============================================
-- Este script corrige os dados de teste usando IDs reais das tabelas

-- 1. VERIFICAR ESTRUTURA DAS TABELAS PRINCIPAIS
SELECT '=== VERIFICANDO ESTRUTURA DAS TABELAS ===' as info;

SELECT 
    'companies' as tabela,
    COUNT(*) as total_registros,
    MIN(created_at) as primeiro_criado,
    MAX(created_at) as ultimo_criado
FROM companies

UNION ALL

SELECT 
    'pumps' as tabela,
    COUNT(*) as total_registros,
    MIN(created_at) as primeiro_criado,
    MAX(created_at) as ultimo_criado
FROM pumps

UNION ALL

SELECT 
    'expenses' as tabela,
    COUNT(*) as total_registros,
    MIN(created_at) as primeiro_criado,
    MAX(created_at) as ultimo_criado
FROM expenses;

-- 2. VERIFICAR DADOS EXISTENTES
SELECT '=== DADOS EXISTENTES ===' as info;

SELECT 
    'Empresas' as tipo,
    id,
    name as nome
FROM companies
ORDER BY name;

SELECT 
    'Bombas' as tipo,
    p.id,
    p.prefix as nome,
    p.model as modelo,
    c.name as empresa
FROM pumps p
JOIN companies c ON p.owner_company_id = c.id
ORDER BY p.prefix;

-- 3. CRIAR DADOS DE TESTE CORRETOS
SELECT '=== CRIANDO DADOS DE TESTE CORRETOS ===' as info;

-- Verificar se há empresas e bombas para criar despesas
DO $$
DECLARE
    empresa_id UUID;
    bomba_id UUID;
    total_empresas INTEGER;
    total_bombas INTEGER;
BEGIN
    -- Verificar quantas empresas existem
    SELECT COUNT(*) INTO total_empresas FROM companies;
    SELECT COUNT(*) INTO total_bombas FROM pumps;
    
    RAISE NOTICE 'Total de empresas: %', total_empresas;
    RAISE NOTICE 'Total de bombas: %', total_bombas;
    
    -- Se não há empresas, criar uma empresa de teste
    IF total_empresas = 0 THEN
        INSERT INTO companies (name) VALUES ('Felix Mix Teste') RETURNING id INTO empresa_id;
        RAISE NOTICE 'Empresa de teste criada: %', empresa_id;
    ELSE
        -- Pegar a primeira empresa
        SELECT id INTO empresa_id FROM companies LIMIT 1;
        RAISE NOTICE 'Usando empresa existente: %', empresa_id;
    END IF;
    
    -- Se não há bombas, criar uma bomba de teste
    IF total_bombas = 0 THEN
        INSERT INTO pumps (prefix, model, status, owner_company_id) 
        VALUES ('TEST-001', 'Modelo Teste', 'Disponível', empresa_id) 
        RETURNING id INTO bomba_id;
        RAISE NOTICE 'Bomba de teste criada: %', bomba_id;
    ELSE
        -- Pegar a primeira bomba
        SELECT id INTO bomba_id FROM pumps LIMIT 1;
        RAISE NOTICE 'Usando bomba existente: %', bomba_id;
    END IF;
    
    -- Verificar se já existem despesas
    IF NOT EXISTS (SELECT 1 FROM expenses LIMIT 1) THEN
        -- Criar despesas de teste usando IDs reais
        INSERT INTO expenses (
            descricao, categoria, valor, tipo_custo, data_despesa, 
            pump_id, company_id, status, observacoes
        ) VALUES 
        (
            'Abastecimento de diesel - Teste', 
            'Diesel', 
            500.00, 
            'variável', 
            CURRENT_DATE - INTERVAL '5 days',
            bomba_id,
            empresa_id,
            'pago',
            'Abastecimento de teste para demonstração'
        ),
        (
            'Manutenção preventiva - Teste', 
            'Manutenção', 
            1200.00, 
            'fixo', 
            CURRENT_DATE - INTERVAL '3 days',
            bomba_id,
            empresa_id,
            'pago',
            'Manutenção de teste'
        ),
        (
            'Salário operador - Teste', 
            'Mão de obra', 
            2500.00, 
            'fixo', 
            CURRENT_DATE - INTERVAL '1 day',
            bomba_id,
            empresa_id,
            'pago',
            'Salário de teste'
        ),
        (
            'Imposto ICMS - Teste', 
            'Imposto', 
            800.00, 
            'fixo', 
            CURRENT_DATE,
            bomba_id,
            empresa_id,
            'pendente',
            'Imposto de teste'
        ),
        (
            'Material de limpeza - Teste', 
            'Outros', 
            150.00, 
            'variável', 
            CURRENT_DATE - INTERVAL '2 days',
            bomba_id,
            empresa_id,
            'pago',
            'Material de teste'
        );
        
        RAISE NOTICE 'Despesas de teste criadas com sucesso!';
    ELSE
        RAISE NOTICE 'Despesas já existem, não criando dados de teste';
    END IF;
END $$;

-- 4. VERIFICAR RESULTADO FINAL
SELECT '=== RESULTADO FINAL ===' as info;

SELECT 
    'Total de empresas' as metric,
    COUNT(*) as valor
FROM companies

UNION ALL

SELECT 
    'Total de bombas' as metric,
    COUNT(*) as valor
FROM pumps

UNION ALL

SELECT 
    'Total de despesas' as metric,
    COUNT(*) as valor
FROM expenses

UNION ALL

SELECT 
    'Valor total das despesas' as metric,
    COALESCE(SUM(valor), 0) as valor
FROM expenses;

-- 5. VERIFICAR DESPESAS CRIADAS
SELECT '=== DESPESAS CRIADAS ===' as info;

SELECT 
    e.descricao,
    e.categoria,
    e.valor,
    e.tipo_custo,
    e.status,
    e.data_despesa,
    p.prefix as bomba_nome,
    c.name as empresa_nome
FROM expenses e
JOIN pumps p ON e.pump_id = p.id
JOIN companies c ON e.company_id = c.id
ORDER BY e.created_at DESC;

-- 6. VERIFICAR ESTATÍSTICAS POR CATEGORIA
SELECT '=== ESTATÍSTICAS POR CATEGORIA ===' as info;

SELECT 
    categoria,
    COUNT(*) as quantidade,
    SUM(valor) as valor_total,
    ROUND(AVG(valor), 2) as valor_medio
FROM expenses
GROUP BY categoria
ORDER BY valor_total DESC;

-- 7. VERIFICAR ESTATÍSTICAS POR STATUS
SELECT '=== ESTATÍSTICAS POR STATUS ===' as info;

SELECT 
    status,
    COUNT(*) as quantidade,
    SUM(valor) as valor_total,
    ROUND(AVG(valor), 2) as valor_medio
FROM expenses
GROUP BY status
ORDER BY valor_total DESC;

SELECT '=== DADOS DE TESTE CRIADOS COM SUCESSO ===' as info;
