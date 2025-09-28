-- =============================================
-- Script para adicionar 'sem_forma' ao enum forma_pagamento
-- =============================================

-- 1. Adicionar novo valor ao enum forma_pagamento
ALTER TYPE public.forma_pagamento ADD VALUE IF NOT EXISTS 'sem_forma';

-- 2. Verificar se foi adicionado
DO $$
BEGIN
    -- Listar todos os valores do enum
    RAISE NOTICE '📋 Valores atuais do enum forma_pagamento:';
    
    -- Verificar se 'sem_forma' foi adicionado
    IF EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'public.forma_pagamento'::regtype 
        AND enumlabel = 'sem_forma'
    ) THEN
        RAISE NOTICE '✅ Valor "sem_forma" adicionado com sucesso ao enum forma_pagamento';
    ELSE
        RAISE NOTICE '❌ Erro ao adicionar valor "sem_forma" ao enum forma_pagamento';
    END IF;
END $$;

-- 3. Listar todos os valores do enum
DO $$
DECLARE
    enum_value RECORD;
BEGIN
    RAISE NOTICE '📋 Todos os valores do enum forma_pagamento:';
    
    FOR enum_value IN 
        SELECT enumlabel, enumsortorder
        FROM pg_enum 
        WHERE enumtypid = 'public.forma_pagamento'::regtype
        ORDER BY enumsortorder
    LOOP
        RAISE NOTICE '  - %', enum_value.enumlabel;
    END LOOP;
END $$;

-- 4. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '🎉 Enum atualizado com sucesso!';
END $$;
