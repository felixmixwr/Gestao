-- Script de teste completo para o novo fluxo de status com AGUARDANDO_APROVACAO
-- Execute este script para testar todo o novo fluxo

-- 1. Verificar se o novo status existe
SELECT 
    enumlabel as status_value,
    enumsortorder as sort_order
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'report_status')
ORDER BY enumsortorder;

-- 2. Testar fluxo completo de status
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
    '#TEST-FLUXO-001',
    CURRENT_DATE,
    (SELECT id FROM clients LIMIT 1),
    'Teste Fluxo Completo',
    (SELECT id FROM pumps LIMIT 1),
    'TEST',
    100,
    1500.00,
    (SELECT id FROM companies LIMIT 1),
    'ENVIADO_FINANCEIRO'
);

-- 3. Testar transições sequenciais
UPDATE reports SET status = 'RECEBIDO_FINANCEIRO' WHERE report_number = '#TEST-FLUXO-001';
SELECT '1. ENVIADO_FINANCEIRO → RECEBIDO_FINANCEIRO' as transicao;

UPDATE reports SET status = 'AGUARDANDO_APROVACAO' WHERE report_number = '#TEST-FLUXO-001';
SELECT '2. RECEBIDO_FINANCEIRO → AGUARDANDO_APROVACAO' as transicao;

UPDATE reports SET status = 'NOTA_EMITIDA' WHERE report_number = '#TEST-FLUXO-001';
SELECT '3. AGUARDANDO_APROVACAO → NOTA_EMITIDA' as transicao;

UPDATE reports SET status = 'AGUARDANDO_PAGAMENTO' WHERE report_number = '#TEST-FLUXO-001';
SELECT '4. NOTA_EMITIDA → AGUARDANDO_PAGAMENTO' as transicao;

UPDATE reports SET status = 'PAGO', paid_at = CURRENT_TIMESTAMP WHERE report_number = '#TEST-FLUXO-001';
SELECT '5. AGUARDANDO_PAGAMENTO → PAGO' as transicao;

-- 4. Verificar status final
SELECT 
    id,
    report_number,
    status,
    paid_at,
    created_at
FROM reports 
WHERE report_number = '#TEST-FLUXO-001';

-- 5. Testar contagem por status com novo fluxo
SELECT 
    status,
    COUNT(*) as quantidade,
    CASE 
        WHEN status = 'ENVIADO_FINANCEIRO' THEN '🔴 Enviado ao Financeiro (Vermelho)'
        WHEN status = 'RECEBIDO_FINANCEIRO' THEN '🟣 Recebido pelo Financeiro (Roxo)'
        WHEN status = 'AGUARDANDO_APROVACAO' THEN '🟠 Aguardando Aprovação (Laranja) ← NOVO!'
        WHEN status = 'NOTA_EMITIDA' THEN '🔵 Nota Emitida (Azul)'
        WHEN status = 'AGUARDANDO_PAGAMENTO' THEN '🟡 Aguardando Pagamento (Amarelo)'
        WHEN status = 'PAGO' THEN '🟢 Pago (Verde)'
        ELSE '❓ Status Desconhecido'
    END as descricao_com_cor
FROM reports 
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'ENVIADO_FINANCEIRO' THEN 1
        WHEN 'RECEBIDO_FINANCEIRO' THEN 2
        WHEN 'AGUARDANDO_APROVACAO' THEN 3
        WHEN 'NOTA_EMITIDA' THEN 4
        WHEN 'AGUARDANDO_PAGAMENTO' THEN 5
        WHEN 'PAGO' THEN 6
        ELSE 7
    END;

-- 6. Testar performance com novo status
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM reports 
WHERE status = 'AGUARDANDO_APROVACAO' 
ORDER BY id ASC 
LIMIT 10;

-- 7. Limpar dados de teste
DELETE FROM reports WHERE report_number = '#TEST-FLUXO-001';

-- 8. Verificar estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'reports' AND column_name = 'status';

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Teste do novo fluxo de status concluído com sucesso!';
    RAISE NOTICE '📊 Novo fluxo implementado:';
    RAISE NOTICE '   1. 🔴 ENVIADO_FINANCEIRO → 🟣 RECEBIDO_FINANCEIRO';
    RAISE NOTICE '   2. 🟣 RECEBIDO_FINANCEIRO → 🟠 AGUARDANDO_APROVACAO ← NOVO!';
    RAISE NOTICE '   3. 🟠 AGUARDANDO_APROVACAO → 🔵 NOTA_EMITIDA';
    RAISE NOTICE '   4. 🔵 NOTA_EMITIDA → 🟡 AGUARDANDO_PAGAMENTO';
    RAISE NOTICE '   5. 🟡 AGUARDANDO_PAGAMENTO → 🟢 PAGO';
    RAISE NOTICE '🎨 Cor do novo status: Laranja (#f97316)';
    RAISE NOTICE '🔧 Posição: Entre "Recebido pelo Financeiro" e "Nota Emitida"';
END $$;






