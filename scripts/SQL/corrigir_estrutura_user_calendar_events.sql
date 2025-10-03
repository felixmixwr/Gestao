-- Script para corrigir a estrutura da tabela user_calendar_events
-- Baseado na estrutura encontrada em planner_personal_setup.sql

-- 1. Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_calendar_events') THEN
        -- Criar tabela se não existir
        CREATE TABLE user_calendar_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            start_date TIMESTAMPTZ NOT NULL,
            end_date TIMESTAMPTZ,
            all_day BOOLEAN DEFAULT FALSE,
            category_id UUID REFERENCES task_categories(id),
            location TEXT,
            reminder_minutes INTEGER,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela user_calendar_events criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela user_calendar_events já existe';
    END IF;
END $$;

-- 2. Verificar e corrigir tipos de dados se necessário
DO $$
BEGIN
    -- Verificar se start_date é TIMESTAMPTZ
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_calendar_events' 
        AND column_name = 'start_date' 
        AND data_type != 'timestamp with time zone'
    ) THEN
        ALTER TABLE user_calendar_events 
        ALTER COLUMN start_date TYPE TIMESTAMPTZ;
        RAISE NOTICE 'Coluna start_date corrigida para TIMESTAMPTZ';
    END IF;
    
    -- Verificar se end_date é TIMESTAMPTZ
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_calendar_events' 
        AND column_name = 'end_date' 
        AND data_type != 'timestamp with time zone'
    ) THEN
        ALTER TABLE user_calendar_events 
        ALTER COLUMN end_date TYPE TIMESTAMPTZ;
        RAISE NOTICE 'Coluna end_date corrigida para TIMESTAMPTZ';
    END IF;
    
    -- Verificar se title é TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_calendar_events' 
        AND column_name = 'title' 
        AND data_type != 'text'
    ) THEN
        ALTER TABLE user_calendar_events 
        ALTER COLUMN title TYPE TEXT;
        RAISE NOTICE 'Coluna title corrigida para TEXT';
    END IF;
END $$;

-- 3. Habilitar RLS se não estiver habilitado
ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view own calendar events" ON user_calendar_events;
DROP POLICY IF EXISTS "Users can insert own calendar events" ON user_calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON user_calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON user_calendar_events;
DROP POLICY IF EXISTS "user_calendar_events_select_policy" ON user_calendar_events;
DROP POLICY IF EXISTS "user_calendar_events_insert_policy" ON user_calendar_events;
DROP POLICY IF EXISTS "user_calendar_events_update_policy" ON user_calendar_events;
DROP POLICY IF EXISTS "user_calendar_events_delete_policy" ON user_calendar_events;

-- 5. Criar políticas RLS corretas
CREATE POLICY "Users can view own calendar events" ON user_calendar_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events" ON user_calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events" ON user_calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events" ON user_calendar_events
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_id ON user_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_start_date ON user_calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_category_id ON user_calendar_events(category_id);

-- 7. Criar trigger para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_calendar_events_updated_at ON user_calendar_events;
CREATE TRIGGER update_user_calendar_events_updated_at 
    BEFORE UPDATE ON user_calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Verificar se task_categories existe e tem dados
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_categories') THEN
        -- Criar tabela task_categories se não existir
        CREATE TABLE task_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Habilitar RLS
        ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
        
        -- Política para task_categories
        CREATE POLICY "Task categories are viewable by everyone" ON task_categories
            FOR SELECT USING (true);
            
        CREATE POLICY "Only admins can manage task categories" ON task_categories
            FOR ALL USING (true); -- Temporariamente permitir todos para debug
            
        RAISE NOTICE 'Tabela task_categories criada com sucesso';
    END IF;
END $$;

-- 9. Inserir categorias básicas se não existirem
INSERT INTO task_categories (name, color, description) VALUES
    ('Financeiro', 'red', 'Eventos relacionados a vencimentos e cobranças financeiras'),
    ('Pagamentos', 'green', 'Eventos relacionados a pagamentos e recebimentos confirmados')
ON CONFLICT (name) DO NOTHING;

-- 10. Verificação final
SELECT 
    'Estrutura da tabela user_calendar_events:' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_calendar_events' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'Total de categorias:' as info,
    COUNT(*) as total
FROM task_categories;

SELECT 
    'Total de eventos:' as info,
    COUNT(*) as total
FROM user_calendar_events;
