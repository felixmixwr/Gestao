-- Script para testar se os status estão funcionando com as cores corretas
-- Execute este script para verificar os status dos relatórios

-- 1. Verificar quantos relatórios existem por status
SELECT 
    status,
    COUNT(*) as quantidade,
    CASE 
        WHEN status = 'ENVIADO_FINANCEIRO' THEN '🔴 Enviado ao Financeiro (Vermelho)'
        WHEN status = 'RECEBIDO_FINANCEIRO' THEN '🟣 Recebido pelo Financeiro (Roxo/Índigo)'
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
        WHEN 'NOTA_EMITIDA' THEN 3
        WHEN 'AGUARDANDO_PAGAMENTO' THEN 4
        WHEN 'PAGO' THEN 5
        ELSE 6
    END;

-- 2. Mostrar alguns relatórios para teste visual
SELECT 
    id,
    report_number,
    status,
    CASE 
        WHEN status = 'ENVIADO_FINANCEIRO' THEN 'bg-red-500 (Vermelho)'
        WHEN status = 'RECEBIDO_FINANCEIRO' THEN 'bg-indigo-500 (Roxo/Índigo)'
        WHEN status = 'NOTA_EMITIDA' THEN 'bg-blue-500 (Azul)'
        WHEN status = 'AGUARDANDO_PAGAMENTO' THEN 'bg-yellow-500 (Amarelo)'
        WHEN status = 'PAGO' THEN 'bg-green-500 (Verde)'
        ELSE 'bg-gray-500 (Cinza)'
    END as classe_css_aplicada,
    created_at
FROM reports 
ORDER BY id ASC 
LIMIT 10;

-- 3. Testar criação de relatório com status RECEBIDO_FINANCEIRO para verificar a cor roxa
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
    '#TEST-COLOR-001',
    CURRENT_DATE,
    (SELECT id FROM clients LIMIT 1),
    'Teste Cor Roxa',
    (SELECT id FROM pumps LIMIT 1),
    'TEST',
    50,
    750.00,
    (SELECT id FROM companies LIMIT 1),
    'RECEBIDO_FINANCEIRO'
);

-- 4. Verificar se o relatório de teste foi criado
SELECT 
    id,
    report_number,
    status,
    'Deve aparecer com cor ROXA/ÍNDIGO' as observacao
FROM reports 
WHERE report_number = '#TEST-COLOR-001';

-- 5. Limpar dados de teste
DELETE FROM reports WHERE report_number = '#TEST-COLOR-001';

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Teste de cores dos status concluído!';
    RAISE NOTICE '🎨 Cores configuradas:';
    RAISE NOTICE '   🔴 ENVIADO_FINANCEIRO: Vermelho (#ef4444)';
    RAISE NOTICE '   🟣 RECEBIDO_FINANCEIRO: Roxo/Índigo (#6366f1)';
    RAISE NOTICE '   🔵 NOTA_EMITIDA: Azul (#3b82f6)';
    RAISE NOTICE '   🟡 AGUARDANDO_PAGAMENTO: Amarelo (#eab308)';
    RAISE NOTICE '   🟢 PAGO: Verde (#22c55e)';
END $$;
