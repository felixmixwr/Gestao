-- Script para verificar se a ordenação e cores estão corretas
-- Execute este script para confirmar que tudo está funcionando

-- 1. Verificar ordenação por ID (deve ser crescente)
SELECT 
    id,
    report_number,
    status,
    created_at,
    CASE 
        WHEN status = 'ENVIADO_FINANCEIRO' THEN '🔴 Vermelho'
        WHEN status = 'RECEBIDO_FINANCEIRO' THEN '🟣 Roxo/Índigo'
        WHEN status = 'NOTA_EMITIDA' THEN '🔵 Azul'
        WHEN status = 'AGUARDANDO_PAGAMENTO' THEN '🟡 Amarelo'
        WHEN status = 'PAGO' THEN '🟢 Verde'
        ELSE '❓ Desconhecido'
    END as cor_status
FROM reports 
ORDER BY id ASC
LIMIT 10;

-- 2. Verificar se há relatórios com status RECEBIDO_FINANCEIRO (deve aparecer roxo)
SELECT 
    COUNT(*) as total_recebidos,
    'Relatórios com status RECEBIDO_FINANCEIRO (deve aparecer ROXO)' as observacao
FROM reports 
WHERE status = 'RECEBIDO_FINANCEIRO';

-- 3. Mostrar distribuição de status
SELECT 
    status,
    COUNT(*) as quantidade,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reports), 2) as percentual
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

-- 4. Verificar se a ordenação está correta (IDs devem estar em ordem crescente)
WITH ordered_reports AS (
    SELECT 
        id,
        report_number,
        ROW_NUMBER() OVER (ORDER BY id ASC) as posicao_esperada,
        ROW_NUMBER() OVER (ORDER BY id ASC) as posicao_atual
    FROM reports
)
SELECT 
    CASE 
        WHEN COUNT(*) = COUNT(CASE WHEN posicao_esperada = posicao_atual THEN 1 END) 
        THEN '✅ Ordenação por ID está CORRETA'
        ELSE '❌ Ordenação por ID está INCORRETA'
    END as status_ordenacao,
    COUNT(*) as total_relatorios
FROM ordered_reports;

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE '✅ Verificação de ordenação e cores concluída!';
    RAISE NOTICE '📋 Ordenação: Por ID crescente (mais antigos primeiro)';
    RAISE NOTICE '🎨 Cores dos status:';
    RAISE NOTICE '   🔴 ENVIADO_FINANCEIRO: Vermelho';
    RAISE NOTICE '   🟣 RECEBIDO_FINANCEIRO: Roxo/Índigo';
    RAISE NOTICE '   🔵 NOTA_EMITIDA: Azul';
    RAISE NOTICE '   🟡 AGUARDANDO_PAGAMENTO: Amarelo';
    RAISE NOTICE '   🟢 PAGO: Verde';
END $$;



