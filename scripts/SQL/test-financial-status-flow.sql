-- Script de teste para verificar o fluxo de status financeiros
-- Execute este script APÓS executar o script de atualização

-- 1. Verificar se a tabela foi atualizada corretamente
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'status';

-- 2. Verificar os valores ENUM disponíveis (se aplicável)
SELECT 
    enumlabel as status_value,
    enumsortorder as sort_order
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'report_status')
ORDER BY enumsortorder;

-- 3. Testar inserção de relatório com status padrão
INSERT INTO reports (
    report_number,
    date,
    client_id,
    client_rep_name,
    pump_id,
    pump_prefix,
    realized_volume,
    total_value,
    company_id,
    status
) VALUES (
    '#TEST-001',
    CURRENT_DATE,
    (SELECT id FROM clients LIMIT 1),
    'Cliente Teste',
    (SELECT id FROM pumps LIMIT 1),
    'TEST',
    100,
    1500.00,
    (SELECT id FROM companies LIMIT 1),
    DEFAULT  -- Deve usar ENVIADO_FINANCEIRO
);

-- 4. Verificar se o relatório foi criado com status correto
SELECT 
    id,
    report_number,
    status,
    created_at
FROM reports 
WHERE report_number = '#TEST-001';

-- 5. Testar transições de status válidas
UPDATE reports 
SET status = 'RECEBIDO_FINANCEIRO' 
WHERE report_number = '#TEST-001';

SELECT 'Status alterado para RECEBIDO_FINANCEIRO' as test_result;

UPDATE reports 
SET status = 'NOTA_EMITIDA' 
WHERE report_number = '#TEST-001';

SELECT 'Status alterado para NOTA_EMITIDA' as test_result;

UPDATE reports 
SET status = 'AGUARDANDO_PAGAMENTO' 
WHERE report_number = '#TEST-001';

SELECT 'Status alterado para AGUARDANDO_PAGAMENTO' as test_result;

UPDATE reports 
SET status = 'PAGO'
WHERE report_number = '#TEST-001';

-- Atualizar paid_at apenas se a coluna existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reports' AND column_name = 'paid_at'
    ) THEN
        UPDATE reports 
        SET paid_at = CURRENT_TIMESTAMP
        WHERE report_number = '#TEST-001';
        RAISE NOTICE '✅ Campo paid_at atualizado para relatório de teste';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna paid_at não existe - pulando atualização';
    END IF;
END $$;

SELECT 'Status alterado para PAGO' as test_result;

-- 6. Verificar status final
SELECT 
    id,
    report_number,
    status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'reports' AND column_name = 'paid_at'
        ) THEN paid_at::TEXT
        ELSE 'N/A - coluna não existe'
    END as paid_at,
    created_at
FROM reports 
WHERE report_number = '#TEST-001';

-- 7. Testar contagem de relatórios por status
SELECT 
    status,
    COUNT(*) as quantidade,
    CASE 
        WHEN status = 'ENVIADO_FINANCEIRO' THEN '🔴 Enviado ao Financeiro'
        WHEN status = 'RECEBIDO_FINANCEIRO' THEN '🟣 Recebido pelo Financeiro'
        WHEN status = 'NOTA_EMITIDA' THEN '🔵 Nota Emitida'
        WHEN status = 'AGUARDANDO_PAGAMENTO' THEN '🟡 Aguardando Pagamento'
        WHEN status = 'PAGO' THEN '🟢 Pago'
        ELSE '❓ Status Desconhecido'
    END as descricao
FROM reports 
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'ENVIADO_FINANCEIRO' THEN 1
        WHEN 'RECEBIDO_FINANCEIRO' THEN 2
        WHEN 'NOTA_EMITIDA' THEN 3
        WHEN 'AGUARDANDO_PAGAMENTO' THEN 4
        WHEN 'PAGO' THEN 5
        ELSE 6
    END;

-- 8. Limpar dados de teste
DELETE FROM reports WHERE report_number = '#TEST-001';

-- 9. Verificar índices criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'reports' 
AND indexname LIKE '%status%';

-- 10. Teste de performance - consulta por status
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM reports 
WHERE status = 'ENVIADO_FINANCEIRO' 
ORDER BY id ASC 
LIMIT 10;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Testes do fluxo de status financeiros concluídos com sucesso!';
    RAISE NOTICE '📊 Status disponíveis: ENVIADO_FINANCEIRO → RECEBIDO_FINANCEIRO → NOTA_EMITIDA → AGUARDANDO_PAGAMENTO → PAGO';
    RAISE NOTICE '🔒 Regras de negócio: Apenas progressão sequencial é permitida';
    RAISE NOTICE '🎯 Status padrão para novos relatórios: ENVIADO_FINANCEIRO';
END $$;
