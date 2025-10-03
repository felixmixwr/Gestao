import { supabase } from './supabase'

/**
 * Verifica se as tabelas do planner existem e têm a estrutura correta
 */
export async function verificarTabelasPlanner(): Promise<void> {
  try {
    console.log('🔍 Verificando tabelas do planner...')

    // Verificar tabela task_categories
    console.log('📋 Verificando tabela task_categories...')
    const { data: categories, error: categoriesError } = await supabase
      .from('task_categories')
      .select('*')
      .limit(1)

    if (categoriesError) {
      console.error('❌ Erro ao acessar task_categories:', categoriesError)
      
      if (categoriesError.code === '42P01') {
        console.log('💡 Tabela task_categories não existe. Criando...')
        await criarTabelaTaskCategories()
      } else {
        throw new Error(`Erro na tabela task_categories: ${categoriesError.message}`)
      }
    } else {
      console.log('✅ Tabela task_categories existe')
    }

    // Verificar tabela user_calendar_events
    console.log('📅 Verificando tabela user_calendar_events...')
    const { data: events, error: eventsError } = await supabase
      .from('user_calendar_events')
      .select('*')
      .limit(1)

    if (eventsError) {
      console.error('❌ Erro ao acessar user_calendar_events:', eventsError)
      
      if (eventsError.code === '42P01') {
        console.log('💡 Tabela user_calendar_events não existe. Criando...')
        await criarTabelaUserCalendarEvents()
      } else {
        throw new Error(`Erro na tabela user_calendar_events: ${eventsError.message}`)
      }
    } else {
      console.log('✅ Tabela user_calendar_events existe')
    }

    console.log('🎉 Todas as tabelas do planner estão funcionando!')

  } catch (error) {
    console.error('❌ Erro ao verificar tabelas do planner:', error)
    throw error
  }
}

/**
 * Cria a tabela task_categories se não existir
 */
async function criarTabelaTaskCategories(): Promise<void> {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS task_categories (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Allow authenticated users to manage task categories" ON task_categories
        FOR ALL USING (auth.role() = 'authenticated');
    `
  })

  if (error) {
    console.error('❌ Erro ao criar tabela task_categories:', error)
    throw new Error(`Falha ao criar tabela task_categories: ${error.message}`)
  }

  console.log('✅ Tabela task_categories criada com sucesso')
}

/**
 * Cria a tabela user_calendar_events se não existir
 */
async function criarTabelaUserCalendarEvents(): Promise<void> {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
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

      ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Users can manage their own calendar events" ON user_calendar_events
        FOR ALL USING (auth.uid() = user_id);
    `
  })

  if (error) {
    console.error('❌ Erro ao criar tabela user_calendar_events:', error)
    throw new Error(`Falha ao criar tabela user_calendar_events: ${error.message}`)
  }

  console.log('✅ Tabela user_calendar_events criada com sucesso')
}

