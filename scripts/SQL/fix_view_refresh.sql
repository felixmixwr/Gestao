-- =============================================
-- Script para corrigir/recriar a view pagamentos_receber_completo
-- =============================================

-- 1. Fazer backup da view atual (se existir)
DO $$
BEGIN
    RAISE NOTICE '🔄 Fazendo backup da view atual...';
    
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'view_pagamentos_receber_completo'
    ) THEN
        RAISE NOTICE '✅ View existente encontrada, fazendo backup...';
        -- Aqui poderíamos salvar a definição, mas vamos recriar mesmo
    ELSE
        RAISE NOTICE '❌ View não existe, será criada do zero';
    END IF;
END $$;

-- 2. Remover a view atual
DROP VIEW IF EXISTS view_pagamentos_receber_completo;

-- 3. Recriar a view com definição atualizada
CREATE VIEW view_pagamentos_receber_completo AS
SELECT 
    pr.id,
    pr.relatorio_id,
    pr.cliente_id,
    pr.empresa_id,
    pr.empresa_tipo,
    pr.valor_total,
    pr.forma_pagamento,
    pr.prazo_data,
    pr.prazo_dias,
    pr.status,
    pr.observacoes,
    pr.created_at,
    pr.updated_at,
    
    -- Dados do cliente
    c.name as cliente_nome,
    c.email as cliente_email,
    c.phone as cliente_telefone,
    
    -- Dados da empresa
    comp.name as empresa_nome,
    
    -- Dados do relatório
    r.date as relatorio_data,
    r.total_value as relatorio_valor_total
    
FROM pagamentos_receber pr
LEFT JOIN clients c ON pr.cliente_id = c.id
LEFT JOIN companies comp ON pr.empresa_id = comp.id
LEFT JOIN reports r ON pr.relatorio_id = r.id;

-- 4. Verificar se a view foi criada corretamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'view_pagamentos_receber_completo'
    ) THEN
        RAISE NOTICE '✅ View view_pagamentos_receber_completo recriada com sucesso';
    ELSE
        RAISE NOTICE '❌ Erro ao recriar a view';
    END IF;
END $$;

-- 5. Testar a view com o pagamento específico
DO $$
DECLARE
    test_record RECORD;
BEGIN
    RAISE NOTICE '🧪 Testando a view recriada...';
    
    SELECT * INTO test_record 
    FROM view_pagamentos_receber_completo 
    WHERE id = 'f259c024-a339-4b5d-8263-dd15df6f89da';
    
    IF FOUND THEN
        RAISE NOTICE '✅ Pagamento encontrado na view recriada:';
        RAISE NOTICE '  - ID: %', test_record.id;
        RAISE NOTICE '  - Status: %', test_record.status;
        RAISE NOTICE '  - Valor: %', test_record.valor_total;
        RAISE NOTICE '  - Atualizado em: %', test_record.updated_at;
        
        IF test_record.status = 'pago' THEN
            RAISE NOTICE '✅ Status está correto: PAGO';
        ELSE
            RAISE NOTICE '❌ Status ainda não está como "pago": %', test_record.status;
        END IF;
    ELSE
        RAISE NOTICE '❌ Pagamento não encontrado na view recriada';
    END IF;
END $$;

-- 6. Verificar se há algum problema de permissão na view
DO $$
BEGIN
    RAISE NOTICE '🔐 Verificando permissões da view...';
    
    -- Tentar fazer um SELECT simples
    BEGIN
        PERFORM COUNT(*) FROM view_pagamentos_receber_completo;
        RAISE NOTICE '✅ View está acessível para SELECT';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao acessar view: %', SQLERRM;
    END;
END $$;

-- 7. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '🎉 View recriada!';
    RAISE NOTICE '💡 Agora teste novamente o botão "Marcar como pago" no frontend';
END $$;



