-- =============================================
-- MIGRAR RELATÓRIOS PAGO PARA PAGAMENTOS_RECEBER
-- =============================================
-- Este script cria pagamentos na tabela pagamentos_receber para relatórios que estão PAGO

-- 1. INSERIR PAGAMENTOS PARA RELATÓRIOS PAGO QUE NÃO TÊM PAGAMENTO
INSERT INTO pagamentos_receber (
    relatorio_id,
    cliente_id,
    empresa_id,
    empresa_tipo,
    valor_total,
    forma_pagamento,
    prazo_data,
    prazo_dias,
    status,
    observacoes,
    created_at,
    updated_at
)
SELECT 
    r.id as relatorio_id,
    r.client_id as cliente_id,
    r.company_id as empresa_id,
    'interna' as empresa_tipo,
    r.total_value as valor_total,
    'a_vista'::forma_pagamento as forma_pagamento,
    r.date as prazo_data, -- Usar data do relatório como data de pagamento
    0 as prazo_dias,
    'pago'::status_pagamento as status,
    'Migrado automaticamente - Relatório já estava PAGO' as observacoes,
    r.created_at as created_at,
    r.updated_at as updated_at
FROM reports r
WHERE r.status = 'PAGO'
AND NOT EXISTS (
    SELECT 1 FROM pagamentos_receber pr 
    WHERE pr.relatorio_id = r.id
);

-- 2. VERIFICAR RESULTADO DA MIGRAÇÃO
SELECT '=== MIGRAÇÃO CONCLUÍDA ===' as info;

SELECT 
    'Pagamentos criados para relatórios PAGO' as acao,
    COUNT(*) as quantidade
FROM pagamentos_receber pr
JOIN reports r ON pr.relatorio_id = r.id
WHERE pr.observacoes LIKE '%Migrado automaticamente%';

-- 3. VERIFICAR KPIs APÓS MIGRAÇÃO
SELECT '=== KPIs APÓS MIGRAÇÃO ===' as info;

SELECT 
    pagamentos_pagos,
    valor_pago,
    total_pagamentos,
    valor_total_pagamentos
FROM view_kpis_financeiros_unificados;

-- 4. VERIFICAR DADOS FINAIS
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

-- Contar por status na tabela pagamentos_receber
SELECT 
    'Tabela pagamentos_receber' as fonte,
    status,
    COUNT(*) as quantidade,
    SUM(valor_total) as valor_total
FROM pagamentos_receber
GROUP BY status
ORDER BY status;

SELECT '=== MIGRAÇÃO CONCLUÍDA COM SUCESSO ===' as info;
SELECT 'Agora os KPIs devem mostrar corretamente os pagamentos pagos' as resultado;
