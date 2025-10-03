-- =============================================
-- PLANNER PESSOAL - WorldRental Felix Mix
-- Sistema de organização pessoal por usuário
-- =============================================

-- =============================================
-- 1. TABELAS DO PLANNER PESSOAL
-- =============================================

-- Tabela de categorias de tarefas (baseada na imagem do Power Planner)
CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de tarefas pessoais do usuário
CREATE TABLE IF NOT EXISTS user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  due_time TIME,
  category_id UUID REFERENCES task_categories(id),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly', 'yearly'
  recurrence_interval INTEGER DEFAULT 1, -- a cada quantos dias/semanas/meses
  recurrence_end_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de anotações pessoais do usuário
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES task_categories(id),
  is_pinned BOOLEAN DEFAULT FALSE,
  tags TEXT[], -- array de tags para organização
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de eventos do calendário pessoal
CREATE TABLE IF NOT EXISTS user_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT FALSE,
  category_id UUID REFERENCES task_categories(id),
  location TEXT,
  reminder_minutes INTEGER, -- minutos antes do evento para lembrete
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. HABILITAR ROW LEVEL SECURITY
-- =============================================

ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. POLÍTICAS RLS - ISOLAMENTO POR USUÁRIO
-- =============================================

-- Categorias: todos os usuários podem ver, mas apenas admins podem modificar
CREATE POLICY "Task categories are viewable by everyone" ON task_categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage task categories" ON task_categories
  FOR ALL USING (auth.role() = 'admin');

-- Tarefas: usuários só podem ver e gerenciar suas próprias tarefas
CREATE POLICY "Users can view own tasks" ON user_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON user_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON user_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON user_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Anotações: usuários só podem ver e gerenciar suas próprias anotações
CREATE POLICY "Users can view own notes" ON user_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON user_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON user_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON user_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Eventos do calendário: usuários só podem ver e gerenciar seus próprios eventos
CREATE POLICY "Users can view own calendar events" ON user_calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events" ON user_calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events" ON user_calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar events" ON user_calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 4. TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE TRIGGER update_task_categories_updated_at BEFORE UPDATE ON task_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tasks_updated_at BEFORE UPDATE ON user_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notes_updated_at BEFORE UPDATE ON user_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_calendar_events_updated_at BEFORE UPDATE ON user_calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. DADOS INICIAIS - CATEGORIAS
-- =============================================

-- Inserir categorias baseadas na imagem do Power Planner
INSERT INTO task_categories (name, color, description) VALUES
  ('ADMINISTRAÇÃO', 'green', 'Tarefas administrativas e burocráticas'),
  ('ATRASO - FÉLIX MIX', 'red', 'Tarefas atrasadas relacionadas à Félix Mix'),
  ('ATRASO - WORLD RENTAL', 'red', 'Tarefas atrasadas relacionadas à World Rental'),
  ('COM URGÊNCIA', 'red', 'Tarefas urgentes que precisam de atenção imediata'),
  ('CONSTRUTORA WR', 'gray', 'Tarefas relacionadas à construtora World Rental'),
  ('CUSTO DIVIDIDO', 'teal', 'Tarefas com custos compartilhados'),
  ('FÉLIX MIX', 'blue', 'Tarefas específicas da Félix Mix'),
  ('FERIADO', 'brown', 'Feriados e datas especiais'),
  ('OFICINA', 'black', 'Tarefas relacionadas à oficina'),
  ('TERCEIRIZADOS', 'yellow', 'Tarefas de terceirizados'),
  ('WORLD RENTAL', 'orange', 'Tarefas específicas da World Rental'),
  ('Sem classe', 'indigo', 'Tarefas sem categoria específica')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 6. ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para user_tasks
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_due_date ON user_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_category ON user_tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_priority ON user_tasks(priority);

-- Índices para user_notes
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_created_at ON user_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_user_notes_category ON user_notes(category_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_pinned ON user_notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_user_notes_tags ON user_notes USING GIN(tags);

-- Índices para user_calendar_events
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_id ON user_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_start_date ON user_calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_category ON user_calendar_events(category_id);

-- Índices para task_categories
CREATE INDEX IF NOT EXISTS idx_task_categories_name ON task_categories(name);
CREATE INDEX IF NOT EXISTS idx_task_categories_color ON task_categories(color);

-- =============================================
-- 7. FUNÇÕES ÚTEIS
-- =============================================

-- Função para buscar próximas tarefas do usuário
CREATE OR REPLACE FUNCTION get_user_upcoming_tasks(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  due_date TIMESTAMPTZ,
  due_time TIME,
  category_name TEXT,
  category_color TEXT,
  priority TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.due_date,
    t.due_time,
    tc.name as category_name,
    tc.color as category_color,
    t.priority,
    t.status
  FROM user_tasks t
  LEFT JOIN task_categories tc ON t.category_id = tc.id
  WHERE t.user_id = p_user_id
    AND t.status IN ('pending', 'in_progress')
    AND (t.due_date IS NULL OR t.due_date >= NOW())
  ORDER BY 
    CASE t.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    t.due_date ASC NULLS LAST,
    t.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Função para buscar próximas anotações do usuário
CREATE OR REPLACE FUNCTION get_user_recent_notes(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category_name TEXT,
  category_color TEXT,
  is_pinned BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.content,
    tc.name as category_name,
    tc.color as category_color,
    n.is_pinned,
    n.created_at
  FROM user_notes n
  LEFT JOIN task_categories tc ON n.category_id = tc.id
  WHERE n.user_id = p_user_id
  ORDER BY n.is_pinned DESC, n.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Função para buscar próximos eventos do calendário
CREATE OR REPLACE FUNCTION get_user_upcoming_events(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN,
  category_name TEXT,
  category_color TEXT,
  location TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.start_date,
    e.end_date,
    e.all_day,
    tc.name as category_name,
    tc.color as category_color,
    e.location
  FROM user_calendar_events e
  LEFT JOIN task_categories tc ON e.category_id = tc.id
  WHERE e.user_id = p_user_id
    AND e.start_date >= NOW()
  ORDER BY e.start_date ASC
  LIMIT p_limit;
END;
$$;

-- =============================================
-- INSTRUÇÕES DE USO
-- =============================================

/*
INSTRUÇÕES PARA APLICAR O PLANNER PESSOAL:

1. Execute este script no SQL Editor do Supabase
2. As categorias serão criadas automaticamente
3. Cada usuário terá acesso apenas aos seus próprios dados
4. Use as funções get_user_upcoming_tasks, get_user_recent_notes e get_user_upcoming_events
   para buscar dados no dashboard

ESTRUTURA DAS TABELAS:
- task_categories: Categorias de tarefas (compartilhadas entre usuários)
- user_tasks: Tarefas pessoais de cada usuário
- user_notes: Anotações pessoais de cada usuário  
- user_calendar_events: Eventos do calendário pessoal

SEGURANÇA:
- RLS habilitado em todas as tabelas
- Usuários só acessam seus próprios dados
- Categorias são compartilhadas (apenas leitura)
*/
