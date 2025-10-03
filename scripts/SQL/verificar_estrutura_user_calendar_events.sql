-- Script para verificar e corrigir a estrutura da tabela user_calendar_events

-- 1. Verificar se a tabela existe e sua estrutura
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_calendar_events' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se há dados na tabela
SELECT COUNT(*) as total_eventos FROM user_calendar_events;

-- 3. Verificar se as categorias existem
SELECT COUNT(*) as total_categorias FROM task_categories;

-- 4. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_calendar_events';

-- 5. Testar inserção simples (comentado para não inserir dados desnecessários)
/*
INSERT INTO user_calendar_events (
    user_id, 
    title, 
    description, 
    start_date, 
    end_date
) VALUES (
    auth.uid(),
    'Teste de Evento',
    'Descrição de teste',
    NOW(),
    NOW()
);
*/
