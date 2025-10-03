-- Script para corrigir as tabelas do planner e suas políticas RLS

-- Verificar se a tabela task_categories existe
-- Se não existir, criar
CREATE TABLE IF NOT EXISTS task_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verificar se a tabela user_calendar_events existe
-- Se não existir, criar
CREATE TABLE IF NOT EXISTS user_calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  all_day BOOLEAN DEFAULT false,
  category_id UUID REFERENCES task_categories(id),
  location VARCHAR(200),
  reminder_minutes INTEGER,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50),
  recurrence_interval INTEGER,
  recurrence_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS nas tabelas
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Allow authenticated users to manage task categories" ON task_categories;
DROP POLICY IF EXISTS "Users can manage their own calendar events" ON user_calendar_events;
DROP POLICY IF EXISTS "task_categories_policy" ON task_categories;
DROP POLICY IF EXISTS "user_calendar_events_policy" ON user_calendar_events;

-- Criar políticas RLS corretas para task_categories
-- Permitir que usuários autenticados vejam todas as categorias
CREATE POLICY "task_categories_select_policy" ON task_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir que usuários autenticados insiram categorias
CREATE POLICY "task_categories_insert_policy" ON task_categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permitir que usuários autenticados atualizem categorias
CREATE POLICY "task_categories_update_policy" ON task_categories
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Permitir que usuários autenticados deletem categorias
CREATE POLICY "task_categories_delete_policy" ON task_categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Criar políticas RLS corretas para user_calendar_events
-- Permitir que usuários vejam apenas seus próprios eventos
CREATE POLICY "user_calendar_events_select_policy" ON user_calendar_events
  FOR SELECT USING (auth.uid() = user_id);

-- Permitir que usuários insiram eventos para si mesmos
CREATE POLICY "user_calendar_events_insert_policy" ON user_calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários atualizem apenas seus próprios eventos
CREATE POLICY "user_calendar_events_update_policy" ON user_calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

-- Permitir que usuários deletem apenas seus próprios eventos
CREATE POLICY "user_calendar_events_delete_policy" ON user_calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_id ON user_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_start_date ON user_calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_category_id ON user_calendar_events(category_id);
CREATE INDEX IF NOT EXISTS idx_task_categories_name ON task_categories(name);
