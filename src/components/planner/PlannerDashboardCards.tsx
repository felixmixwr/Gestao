import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Calendar, 
  Clock, 
  FileText, 
  ChevronRight,
  Plus,
  Pin
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PlannerAPI, UserTask, UserNote, UserCalendarEvent, TaskCategory } from '../../lib/planner-api'
import { useToast } from '../../lib/toast-hooks'

// Função para formatar data
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Função para formatar hora
const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':')
  return `${hours}:${minutes}`
}

// Função para obter cor da categoria
const getCategoryColor = (category?: TaskCategory) => {
  if (!category) return 'bg-gray-100 text-gray-800'
  
  const colorMap: Record<string, string> = {
    'green': 'bg-green-100 text-green-800 border-green-200',
    'red': 'bg-red-100 text-red-800 border-red-200',
    'blue': 'bg-blue-100 text-blue-800 border-blue-200',
    'orange': 'bg-orange-100 text-orange-800 border-orange-200',
    'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'teal': 'bg-teal-100 text-teal-800 border-teal-200',
    'brown': 'bg-amber-100 text-amber-800 border-amber-200',
    'gray': 'bg-gray-100 text-gray-800 border-gray-200',
    'black': 'bg-gray-800 text-white border-gray-600',
    'indigo': 'bg-indigo-100 text-indigo-800 border-indigo-200'
  }
  
  return colorMap[category.color] || 'bg-gray-100 text-gray-800 border-gray-200'
}

// Função para obter cor do indicador da categoria
const getCategoryIndicatorColor = (category?: TaskCategory) => {
  if (!category) return 'bg-gray-500'
  
  const colorMap: Record<string, string> = {
    'green': 'bg-green-500',
    'red': 'bg-red-500',
    'blue': 'bg-blue-500',
    'orange': 'bg-orange-500',
    'yellow': 'bg-yellow-500',
    'teal': 'bg-teal-500',
    'brown': 'bg-amber-500',
    'gray': 'bg-gray-500',
    'black': 'bg-gray-800',
    'indigo': 'bg-indigo-500'
  }
  
  return colorMap[category.color] || 'bg-gray-500'
}

// Função para obter prioridade
const getPriorityColor = (priority: string) => {
  const priorityMap: Record<string, string> = {
    'low': 'bg-gray-100 text-gray-800',
    'medium': 'bg-blue-100 text-blue-800',
    'high': 'bg-orange-100 text-orange-800',
    'urgent': 'bg-red-100 text-red-800'
  }
  
  return priorityMap[priority] || 'bg-gray-100 text-gray-800'
}

// Função para obter texto da prioridade
const getPriorityText = (priority: string) => {
  const priorityMap: Record<string, string> = {
    'low': 'Baixa',
    'medium': 'Média',
    'high': 'Alta',
    'urgent': 'Urgente'
  }
  
  return priorityMap[priority] || 'Média'
}

// Card de Próximo Compromisso
export function NextTaskCard() {
  const [nextTask, setNextTask] = useState<UserTask | null>(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    const loadNextTask = async () => {
      try {
        setLoading(true)
        const tasks = await PlannerAPI.getDashboardData()
        const upcomingTasks = tasks.upcomingTasks
        
        if (upcomingTasks.length > 0) {
          setNextTask(upcomingTasks[0])
        }
      } catch (error) {
        console.error('Erro ao carregar próxima tarefa:', error)
        addToast({
          message: 'Erro ao carregar próxima tarefa',
          type: 'error'
        })
      } finally {
        setLoading(false)
      }
    }

    loadNextTask()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximo Compromisso</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  if (!nextTask) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximo Compromisso</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">Nenhum compromisso próximo</p>
            <Link to="/planner/nova-tarefa">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Tarefa
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Próximo Compromisso</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Indicador de categoria */}
          <div className="flex items-center gap-2">
            <div 
              className={`w-3 h-3 rounded-full ${getCategoryIndicatorColor(nextTask.category)}`}
            />
            {nextTask.category && (
              <Badge variant="outline" className={getCategoryColor(nextTask.category)}>
                {nextTask.category.name}
              </Badge>
            )}
          </div>
          
          {/* Título da tarefa */}
          <div>
            <h3 className="font-semibold text-lg truncate">{nextTask.title}</h3>
            {nextTask.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{nextTask.description}</p>
            )}
          </div>
          
          {/* Data e hora */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {nextTask.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(nextTask.due_date)}</span>
              </div>
            )}
            {nextTask.due_time && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(nextTask.due_time)}</span>
              </div>
            )}
          </div>
          
          {/* Prioridade */}
          <div className="flex items-center justify-between">
            <Badge className={getPriorityColor(nextTask.priority)}>
              {getPriorityText(nextTask.priority)}
            </Badge>
            
            <Link to="/planner/calendario">
              <Button variant="ghost" size="sm">
                Ver Calendário
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Card de Próxima Anotação
export function NextNoteCard() {
  const [nextNote, setNextNote] = useState<UserNote | null>(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    const loadNextNote = async () => {
      try {
        setLoading(true)
        const notes = await PlannerAPI.getDashboardData()
        const recentNotes = notes.recentNotes
        
        if (recentNotes.length > 0) {
          setNextNote(recentNotes[0])
        }
      } catch (error) {
        console.error('Erro ao carregar próxima anotação:', error)
        addToast({
          message: 'Erro ao carregar próxima anotação',
          type: 'error'
        })
      } finally {
        setLoading(false)
      }
    }

    loadNextNote()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próxima Anotação</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  if (!nextNote) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próxima Anotação</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">Nenhuma anotação recente</p>
            <Link to="/planner/agenda">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Criar Anotação
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Próxima Anotação</CardTitle>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Indicador de categoria e pin */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {nextNote.category && (
                <>
                  <div 
                    className={`w-3 h-3 rounded-full ${getCategoryIndicatorColor(nextNote.category)}`}
                  />
                  <Badge variant="outline" className={getCategoryColor(nextNote.category)}>
                    {nextNote.category.name}
                  </Badge>
                </>
              )}
            </div>
            
            {nextNote.is_pinned && (
              <Pin className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          
          {/* Título da anotação */}
          <div>
            <h3 className="font-semibold text-lg truncate">{nextNote.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-3">{nextNote.content}</p>
          </div>
          
          {/* Data de criação */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Criada em {formatDate(nextNote.created_at)}</span>
          </div>
          
          {/* Tags */}
          {nextNote.tags && nextNote.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {nextNote.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {nextNote.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{nextNote.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          {/* Botão para ver agenda */}
          <div className="flex justify-end">
            <Link to="/planner/agenda">
              <Button variant="ghost" size="sm">
                Ver Agenda
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Card de Tarefas Pendentes
export function PendingTasksCard() {
  const [pendingTasks, setPendingTasks] = useState<UserTask[]>([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    const loadPendingTasks = async () => {
      try {
        setLoading(true)
        const tasks = await PlannerAPI.getDashboardData()
        const upcomingTasks = tasks.upcomingTasks
        
        // Filtrar apenas tarefas pendentes
        const pending = upcomingTasks.filter(task => 
          task.status === 'pending' || task.status === 'in_progress'
        )
        
        setPendingTasks(pending.slice(0, 3)) // Mostrar apenas as 3 primeiras
      } catch (error) {
        console.error('Erro ao carregar tarefas pendentes:', error)
        addToast({
          message: 'Erro ao carregar tarefas pendentes',
          type: 'error'
        })
      } finally {
        setLoading(false)
      }
    }

    loadPendingTasks()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {pendingTasks.length === 0 ? (
          <div className="text-center py-4">
            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">Nenhuma tarefa pendente</p>
            <Link to="/planner/nova-tarefa">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Tarefa
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div 
                    className={`w-2 h-2 rounded-full ${getCategoryIndicatorColor(task.category)}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-gray-500">
                        {formatDate(task.due_date)}
                        {task.due_time && ` às ${formatTime(task.due_time)}`}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className={getPriorityColor(task.priority)}>
                  {getPriorityText(task.priority)}
                </Badge>
              </div>
            ))}
            
            <div className="flex justify-end pt-2">
              <Link to="/planner/agenda">
                <Button variant="ghost" size="sm">
                  Ver Todas
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Componente principal que exporta todos os cards
export function PlannerDashboardCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NextTaskCard />
      <NextNoteCard />
      <PendingTasksCard />
    </div>
  )
}
