import { supabase } from './supabase'

// =============================================
// TIPOS E INTERFACES
// =============================================

export interface TaskCategory {
  id: string
  name: string
  color: string
  description?: string
  created_at: string
  updated_at: string
}

export interface UserTask {
  id: string
  user_id: string
  title: string
  description?: string
  due_date?: string
  due_time?: string
  category_id?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_recurring: boolean
  recurrence_pattern?: string
  recurrence_interval?: number
  recurrence_end_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
  // Relacionamentos
  category?: TaskCategory
}

export interface UserNote {
  id: string
  user_id: string
  title: string
  content: string
  category_id?: string
  is_pinned: boolean
  tags?: string[]
  created_at: string
  updated_at: string
  // Relacionamentos
  category?: TaskCategory
}

export interface UserCalendarEvent {
  id: string
  user_id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  all_day: boolean
  category_id?: string
  location?: string
  reminder_minutes?: number
  is_recurring: boolean
  recurrence_pattern?: string
  recurrence_interval?: number
  recurrence_end_date?: string
  created_at: string
  updated_at: string
  // Relacionamentos
  category?: TaskCategory
}

export interface CreateTaskData {
  title: string
  description?: string
  due_date?: string
  due_time?: string
  category_id?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  is_recurring?: boolean
  recurrence_pattern?: string
  recurrence_interval?: number
  recurrence_end_date?: string
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  completed_at?: string
}

export interface CreateNoteData {
  title: string
  content: string
  category_id?: string
  is_pinned?: boolean
  tags?: string[]
}

export interface UpdateNoteData extends Partial<CreateNoteData> {}

export interface CreateEventData {
  title: string
  description?: string
  start_date: string
  end_date?: string
  all_day?: boolean
  category_id?: string
  location?: string
  reminder_minutes?: number
  is_recurring?: boolean
  recurrence_pattern?: string
  recurrence_interval?: number
  recurrence_end_date?: string
}

export interface UpdateEventData extends Partial<CreateEventData> {}

// =============================================
// API DE CATEGORIAS
// =============================================

export class TaskCategoriesAPI {
  static async getAll(): Promise<TaskCategory[]> {
    const { data, error } = await supabase
      .from('task_categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      throw new Error('Erro ao buscar categorias de tarefas')
    }

    return data || []
  }

  static async getById(id: string): Promise<TaskCategory | null> {
    const { data, error } = await supabase
      .from('task_categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar categoria:', error)
      return null
    }

    return data
  }

  static async create(categoryData: { name: string; color: string; description?: string }): Promise<TaskCategory> {
    const { data, error } = await supabase
      .from('task_categories')
      .insert(categoryData)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar categoria:', error)
      throw new Error(`Erro ao criar categoria: ${error.message}`)
    }

    return data
  }

  static async update(id: string, categoryData: { name?: string; color?: string; description?: string }): Promise<TaskCategory> {
    const { data, error } = await supabase
      .from('task_categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar categoria:', error)
      throw new Error('Erro ao atualizar categoria')
    }

    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('task_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar categoria:', error)
      throw new Error('Erro ao deletar categoria')
    }
  }
}

// =============================================
// API DE TAREFAS
// =============================================

export class UserTasksAPI {
  static async getAll(filters?: {
    status?: string[]
    category_id?: string
    priority?: string
    due_date_from?: string
    due_date_to?: string
  }): Promise<UserTask[]> {
    let query = supabase
      .from('user_tasks')
      .select(`
        *,
        category:task_categories(*)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }

    if (filters?.due_date_from) {
      query = query.gte('due_date', filters.due_date_from)
    }

    if (filters?.due_date_to) {
      query = query.lte('due_date', filters.due_date_to)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar tarefas:', error)
      throw new Error('Erro ao buscar tarefas do usuário')
    }

    return data || []
  }

  static async getById(id: string): Promise<UserTask | null> {
    const { data, error } = await supabase
      .from('user_tasks')
      .select(`
        *,
        category:task_categories(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar tarefa:', error)
      return null
    }

    return data
  }

  static async create(taskData: CreateTaskData): Promise<UserTask> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .from('user_tasks')
      .insert({
        ...taskData,
        user_id: user.id
      })
      .select(`
        *,
        category:task_categories(*)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar tarefa:', error)
      throw new Error('Erro ao criar tarefa')
    }

    return data
  }

  static async update(id: string, taskData: UpdateTaskData): Promise<UserTask> {
    const { data, error } = await supabase
      .from('user_tasks')
      .update(taskData)
      .eq('id', id)
      .select(`
        *,
        category:task_categories(*)
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar tarefa:', error)
      throw new Error('Erro ao atualizar tarefa')
    }

    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar tarefa:', error)
      throw new Error('Erro ao deletar tarefa')
    }
  }

  static async markAsCompleted(id: string): Promise<UserTask> {
    return this.update(id, {
      status: 'completed',
      completed_at: new Date().toISOString()
    })
  }

  static async getUpcoming(limit: number = 5): Promise<UserTask[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .rpc('get_user_upcoming_tasks', {
        p_user_id: user.id,
        p_limit: limit
      })

    if (error) {
      console.error('Erro ao buscar próximas tarefas:', error)
      throw new Error('Erro ao buscar próximas tarefas')
    }

    return data || []
  }

  static async getByDateRange(startDate: string, endDate: string): Promise<UserTask[]> {
    return this.getAll({
      due_date_from: startDate,
      due_date_to: endDate
    })
  }
}

// =============================================
// API DE ANOTAÇÕES
// =============================================

export class UserNotesAPI {
  static async getAll(filters?: {
    category_id?: string
    is_pinned?: boolean
    tags?: string[]
  }): Promise<UserNote[]> {
    let query = supabase
      .from('user_notes')
      .select(`
        *,
        category:task_categories(*)
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters?.is_pinned !== undefined) {
      query = query.eq('is_pinned', filters.is_pinned)
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar anotações:', error)
      throw new Error('Erro ao buscar anotações do usuário')
    }

    return data || []
  }

  static async getById(id: string): Promise<UserNote | null> {
    const { data, error } = await supabase
      .from('user_notes')
      .select(`
        *,
        category:task_categories(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar anotação:', error)
      return null
    }

    return data
  }

  static async create(noteData: CreateNoteData): Promise<UserNote> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .from('user_notes')
      .insert({
        ...noteData,
        user_id: user.id
      })
      .select(`
        *,
        category:task_categories(*)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar anotação:', error)
      throw new Error('Erro ao criar anotação')
    }

    return data
  }

  static async update(id: string, noteData: UpdateNoteData): Promise<UserNote> {
    const { data, error } = await supabase
      .from('user_notes')
      .update(noteData)
      .eq('id', id)
      .select(`
        *,
        category:task_categories(*)
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar anotação:', error)
      throw new Error('Erro ao atualizar anotação')
    }

    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_notes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar anotação:', error)
      throw new Error('Erro ao deletar anotação')
    }
  }

  static async togglePin(id: string): Promise<UserNote> {
    const note = await this.getById(id)
    if (!note) {
      throw new Error('Anotação não encontrada')
    }

    return this.update(id, { is_pinned: !note.is_pinned })
  }

  static async getRecent(limit: number = 5): Promise<UserNote[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .rpc('get_user_recent_notes', {
        p_user_id: user.id,
        p_limit: limit
      })

    if (error) {
      console.error('Erro ao buscar anotações recentes:', error)
      throw new Error('Erro ao buscar anotações recentes')
    }

    return data || []
  }

  static async search(query: string): Promise<UserNote[]> {
    const { data, error } = await supabase
      .from('user_notes')
      .select(`
        *,
        category:task_categories(*)
      `)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar anotações:', error)
      throw new Error('Erro ao buscar anotações')
    }

    return data || []
  }
}

// =============================================
// API DE EVENTOS DO CALENDÁRIO
// =============================================

export class UserCalendarEventsAPI {
  static async getAll(filters?: {
    start_date_from?: string
    start_date_to?: string
    category_id?: string
  }): Promise<UserCalendarEvent[]> {
    let query = supabase
      .from('user_calendar_events')
      .select(`
        *,
        category:task_categories(*)
      `)
      .order('start_date', { ascending: true })

    if (filters?.start_date_from) {
      query = query.gte('start_date', filters.start_date_from)
    }

    if (filters?.start_date_to) {
      query = query.lte('start_date', filters.start_date_to)
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar eventos:', error)
      throw new Error('Erro ao buscar eventos do calendário')
    }

    return data || []
  }

  static async getById(id: string): Promise<UserCalendarEvent | null> {
    const { data, error } = await supabase
      .from('user_calendar_events')
      .select(`
        *,
        category:task_categories(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar evento:', error)
      return null
    }

    return data
  }

  static async create(eventData: CreateEventData): Promise<UserCalendarEvent> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    // Log dos dados antes da inserção
    const insertData = {
      ...eventData,
      user_id: user.id
    }
    console.log('🔍 Dados que serão inseridos:', insertData)
    console.log('🔍 Chaves dos dados:', Object.keys(insertData))

    const { data, error } = await supabase
      .from('user_calendar_events')
      .insert(insertData)
      .select(`
        *,
        category:task_categories(*)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar evento:', error)
      console.error('Dados do evento:', eventData)
      throw new Error(`Erro ao criar evento do calendário: ${error.message}`)
    }

    return data
  }

  static async update(id: string, eventData: UpdateEventData): Promise<UserCalendarEvent> {
    const { data, error } = await supabase
      .from('user_calendar_events')
      .update(eventData)
      .eq('id', id)
      .select(`
        *,
        category:task_categories(*)
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar evento:', error)
      throw new Error('Erro ao atualizar evento do calendário')
    }

    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_calendar_events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar evento:', error)
      throw new Error('Erro ao deletar evento do calendário')
    }
  }

  static async getUpcoming(limit: number = 5): Promise<UserCalendarEvent[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .rpc('get_user_upcoming_events', {
        p_user_id: user.id,
        p_limit: limit
      })

    if (error) {
      console.error('Erro ao buscar próximos eventos:', error)
      throw new Error('Erro ao buscar próximos eventos')
    }

    return data || []
  }

  static async getByDateRange(startDate: string, endDate: string): Promise<UserCalendarEvent[]> {
    return this.getAll({
      start_date_from: startDate,
      start_date_to: endDate
    })
  }
}

// =============================================
// API PRINCIPAL DO PLANNER
// =============================================

export class PlannerAPI {
  static async getDashboardData() {
    try {
      const [upcomingTasks, recentNotes, upcomingEvents, categories] = await Promise.all([
        UserTasksAPI.getUpcoming(5),
        UserNotesAPI.getRecent(5),
        UserCalendarEventsAPI.getUpcoming(5),
        TaskCategoriesAPI.getAll()
      ])

      return {
        upcomingTasks,
        recentNotes,
        upcomingEvents,
        categories
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard do planner:', error)
      throw new Error('Erro ao carregar dados do planner')
    }
  }

  static async getCalendarData(startDate: string, endDate: string) {
    try {
      const [tasks, events] = await Promise.all([
        UserTasksAPI.getByDateRange(startDate, endDate),
        UserCalendarEventsAPI.getByDateRange(startDate, endDate)
      ])

      return {
        tasks,
        events
      }
    } catch (error) {
      console.error('Erro ao buscar dados do calendário:', error)
      throw new Error('Erro ao carregar dados do calendário')
    }
  }

  // Métodos de conveniência para tarefas
  static async updateTask(id: string, taskData: UpdateTaskData): Promise<UserTask> {
    return UserTasksAPI.update(id, taskData)
  }

  static async createTask(taskData: CreateTaskData): Promise<UserTask> {
    return UserTasksAPI.create(taskData)
  }

  static async deleteTask(id: string): Promise<void> {
    return UserTasksAPI.delete(id)
  }

  static async getTasks(filters?: {
    status?: string[]
    category_id?: string
    priority?: string
    due_date_from?: string
    due_date_to?: string
  }): Promise<UserTask[]> {
    return UserTasksAPI.getAll(filters)
  }

  // Métodos de conveniência para categorias
  static async createCategory(categoryData: { name: string; color: string; description?: string }): Promise<TaskCategory> {
    return TaskCategoriesAPI.create(categoryData)
  }

  static async updateCategory(id: string, categoryData: { name?: string; color?: string; description?: string }): Promise<TaskCategory> {
    return TaskCategoriesAPI.update(id, categoryData)
  }

  static async deleteCategory(id: string): Promise<void> {
    return TaskCategoriesAPI.delete(id)
  }

  static async getCategories(): Promise<TaskCategory[]> {
    return TaskCategoriesAPI.getAll()
  }

  // Métodos de conveniência para eventos
  static async createEvent(eventData: CreateEventData): Promise<UserCalendarEvent> {
    return UserCalendarEventsAPI.create(eventData)
  }

  static async updateEvent(id: string, eventData: UpdateEventData): Promise<UserCalendarEvent> {
    return UserCalendarEventsAPI.update(id, eventData)
  }

  static async deleteEvent(id: string): Promise<void> {
    return UserCalendarEventsAPI.delete(id)
  }

  static async getEvents(filters?: {
    start_date_from?: string
    start_date_to?: string
    category_id?: string
  }): Promise<UserCalendarEvent[]> {
    return UserCalendarEventsAPI.getAll(filters)
  }

  static async getEvent(id: string): Promise<UserCalendarEvent> {
    return UserCalendarEventsAPI.getById(id)
  }
}
