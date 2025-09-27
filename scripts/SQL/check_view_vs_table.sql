-- =============================================
-- Script para comparar dados da tabela vs view
-- =============================================

-- 1. Verificar o pagamento específico na TABELA pagamentos_receber
DO $$
DECLARE
    table_record RECORD;
BEGIN
    RAISE NOTICE '🔍 Verificando na TABELA pagamentos_receber:';
    
    SELECT * INTO table_record 
    FROM pagamentos_receber 
    WHERE id = 'f259c024-a339-4b5d-8263-dd15df6f89da';
    
    IF FOUND THEN
        RAISE NOTICE '✅ Encontrado na TABELA:';
        RAISE NOTICE '  - ID: %', table_record.id;
        RAISE NOTICE '  - Status: %', table_record.status;
        RAISE NOTICE '  - Valor: %', table_record.valor_total;
        RAISE NOTICE '  - Atualizado em: %', table_record.updated_at;
        RAISE NOTICE '  - Observações: %', table_record.observacoes;
    ELSE
        RAISE NOTICE '❌ NÃO encontrado na TABELA pagamentos_receber';
    END IF;
END $$;

-- 2. Verificar o pagamento específico na VIEW view_pagamentos_receber_completo
DO $$
DECLARE
    view_record RECORD;
BEGIN
    RAISE NOTICE '🔍 Verificando na VIEW view_pagamentos_receber_completo:';
    
    SELECT * INTO view_record 
    FROM view_pagamentos_receber_completo 
    WHERE id = 'f259c024-a339-4b5d-8263-dd15df6f89da';
    
    IF FOUND THEN
        RAISE NOTICE '✅ Encontrado na VIEW:';
        RAISE NOTICE '  - ID: %', view_record.id;
        RAISE NOTICE '  - Status: %', view_record.status;
        RAISE NOTICE '  - Valor: %', view_record.valor_total;
        RAISE NOTICE '  - Atualizado em: %', view_record.updated_at;
        RAISE NOTICE '  - Observações: %', view_record.observacoes;
    ELSE
        RAISE NOTICE '❌ NÃO encontrado na VIEW view_pagamentos_receber_completo';
    END IF;
END $$;

-- 3. Comparar timestamps para ver se há diferença
DO $$
DECLARE
    table_updated TIMESTAMP;
    view_updated TIMESTAMP;
BEGIN
    RAISE NOTICE '🕐 Comparando timestamps:';
    
    SELECT updated_at INTO table_updated 
    FROM pagamentos_receber 
    WHERE id = 'f259c024-a339-4b5d-8263-dd15df6f89da';
    
    SELECT updated_at INTO view_updated 
    FROM view_pagamentos_receber_completo 
    WHERE id = 'f259c024-a339-4b5d-8263-dd15df6f89da';
    
    IF table_updated IS NOT NULL AND view_updated IS NOT NULL THEN
        RAISE NOTICE '  - Tabela atualizada em: %', table_updated;
        RAISE NOTICE '  - View atualizada em: %', view_updated;
        
        IF table_updated = view_updated THEN
            RAISE NOTICE '✅ Timestamps são iguais';
        ELSE
            RAISE NOTICE '❌ Timestamps são DIFERENTES!';
            RAISE NOTICE '  - Diferença: %', ABS(EXTRACT(EPOCH FROM (table_updated - view_updated)));
        END IF;
    END IF;
END $$;

-- 4. Verificar se a view está sendo atualizada corretamente
DO $$
DECLARE
    view_definition TEXT;
BEGIN
    RAISE NOTICE '🔍 Verificando definição da view:';
    
    SELECT definition INTO view_definition
    FROM pg_views 
    WHERE viewname = 'view_pagamentos_receber_completo';
    
    IF view_definition IS NOT NULL THEN
        RAISE NOTICE '✅ View existe e tem definição';
        RAISE NOTICE '📋 Primeiros 200 caracteres da definição:';
        RAISE NOTICE '%', LEFT(view_definition, 200);
    ELSE
        RAISE NOTICE '❌ View não encontrada ou sem definição';
    END IF;
END $$;

-- 5. Forçar refresh da view (se possível)
DO $$
BEGIN
    RAISE NOTICE '🔄 Tentando forçar refresh da view...';
    
    -- Tentar recriar a view (isso força um refresh)
    BEGIN
        -- Primeiro, vamos ver se conseguimos fazer um SELECT simples
        PERFORM 1 FROM view_pagamentos_receber_completo WHERE id = 'f259c024-a339-4b5d-8263-dd15df6f89da';
        RAISE NOTICE '✅ View está acessível';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao acessar view: %', SQLERRM;
    END;
END $$;

-- 6. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '🎉 Verificação concluída!';
    RAISE NOTICE '💡 Se os dados são diferentes entre tabela e view, pode ser necessário recriar a view';
END $$;


