import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  ArrowLeft
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PlannerAPI, UserTask, UserCalendarEvent, TaskCategory } from '../../lib/planner-api'
import { useToast } from '../../lib/toast-hooks'
import { TaskDetailsModal } from '../../components/planner/TaskDetailsModal'
import { EventDetailsModal } from '../../components/planner/EventDetailsModal'

// Função para obter os dias do mês
const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const days = []
  
  // Adicionar dias vazios do mês anterior
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  
  // Adicionar dias do mês atual
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day))
  }
  
  return days
}

// Função para formatar data
const formatDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Função para verificar se é hoje
const isToday = (date: Date) => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

// Função para obter cor da categoria
const getCategoryColor = (category?: TaskCategory) => {
  if (!category) return 'bg-gray-100 text-gray-800 border-gray-200'
  
  const colorMap: Record<string, string> = {
    'green': 'bg-green-50 text-green-800 border-green-200',
    'red': 'bg-red-50 text-red-800 border-red-200',
    'blue': 'bg-blue-50 text-blue-800 border-blue-200',
    'orange': 'bg-orange-50 text-orange-800 border-orange-200',
    'yellow': 'bg-yellow-50 text-yellow-800 border-yellow-200',
    'teal': 'bg-teal-50 text-teal-800 border-teal-200',
    'brown': 'bg-amber-50 text-amber-800 border-amber-200',
    'gray': 'bg-gray-50 text-gray-800 border-gray-200',
    'black': 'bg-gray-800 text-white border-gray-600',
    'indigo': 'bg-indigo-50 text-indigo-800 border-indigo-200'
  }
  
  return colorMap[category.color] || 'bg-gray-50 text-gray-800 border-gray-200'
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

export default function PlannerCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<UserTask[]>([])
  const [events, setEvents] = useState<UserCalendarEvent[]>([])
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const { addToast } = useToast()
  const navigate = useNavigate()

  // Carregar dados do calendário
  const loadCalendarData = async () => {
    try {
      setLoading(true)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const startDate = new Date(year, month, 1).toISOString()
      const endDate = new Date(year, month + 1, 0).toISOString()
      
      const data = await PlannerAPI.getCalendarData(startDate, endDate)
      setTasks(data.tasks)
      setEvents(data.events)
      
      // Carregar categorias
      const categoriesData = await PlannerAPI.getDashboardData()
      setCategories(categoriesData.categories)
    } catch (error) {
      console.error('Erro ao carregar dados do calendário:', error)
      addToast({
        message: 'Erro ao carregar dados do calendário',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCalendarData()
  }, [currentDate])

  // Navegação do calendário
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToCurrentMonth = () => {
    setCurrentDate(new Date())
  }

  // Abrir modal de detalhes da tarefa
  const openTaskModal = (taskId: string) => {
    setSelectedTaskId(taskId)
    setIsTaskModalOpen(true)
  }

  // Abrir modal de detalhes do evento
  const openEventModal = (eventId: string) => {
    setSelectedEventId(eventId)
    setIsEventModalOpen(true)
  }

  // Fechar modal de tarefa
  const closeTaskModal = () => {
    setSelectedTaskId(null)
    setIsTaskModalOpen(false)
  }

  // Fechar modal de evento
  const closeEventModal = () => {
    setSelectedEventId(null)
    setIsEventModalOpen(false)
  }

  // Recarregar dados quando tarefa for atualizada
  const handleTaskUpdated = () => {
    loadCalendarData()
  }

  // Recarregar dados quando tarefa for deletada
  const handleTaskDeleted = () => {
    loadCalendarData()
    closeTaskModal()
  }

  // Recarregar dados quando evento for deletado
  const handleEventDeleted = () => {
    loadCalendarData()
    closeEventModal()
  }

  // Obter itens para um dia específico
  const getItemsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    
    const dayTasks = tasks.filter(task => {
      if (!task.due_date) return false
      return task.due_date.split('T')[0] === dateStr
    })
    
    const dayEvents = events.filter(event => {
      return event.start_date.split('T')[0] === dateStr
    })
    
    return { tasks: dayTasks, events: dayEvents }
  }

  const days = getDaysInMonth(currentDate)
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/planner">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendário Pessoal</h1>
              <p className="text-gray-600 mt-1">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={goToPreviousMonth}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={goToCurrentMonth}
              variant="outline"
              size="sm"
              className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              📅 Hoje
            </Button>
            
            <Button
              onClick={goToNextMonth}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={() => navigate('/planner/nova-tarefa')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        </div>

        {/* Calendário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendário Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Carregando calendário...</div>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {/* Cabeçalho dos dias da semana */}
                {dayNames.map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50 rounded">
                    {day}
                  </div>
                ))}
                
                {/* Dias do calendário */}
                {days.map((date, index) => {
                  if (!date) {
                    return <div key={index} className="p-3 h-32"></div>
                  }
                  
                  const { tasks: dayTasks, events: dayEvents } = getItemsForDate(date)
                  const isCurrentDay = isToday(date)
                  
                  return (
                    <div
                      key={index}
                      className={`p-2 h-32 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 ${
                        isCurrentDay ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                      onClick={() => navigate('/planner/nova-tarefa')}
                    >
                      {/* Número do dia */}
                      <div className={`text-sm font-medium mb-1 ${
                        isCurrentDay ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {date.getDate()}
                      </div>
                      
                      {/* Itens do dia */}
                      <div className="space-y-1">
                        {/* Tarefas */}
                        {dayTasks.slice(0, 2).map(task => (
                          <div
                            key={task.id}
                            className={`text-xs p-1 rounded truncate border cursor-pointer hover:shadow-sm transition-shadow ${getCategoryColor(task.category)}`}
                            title={`${task.title} - Clique para ver detalhes`}
                            onClick={(e) => {
                              e.stopPropagation()
                              openTaskModal(task.id)
                            }}
                          >
                            <div className="flex items-center gap-1">
                              {task.status === 'completed' ? (
                                <span className="text-green-600">✓</span>
                              ) : (
                                <span className="text-gray-400">○</span>
                              )}
                              <span className={task.status === 'completed' ? 'line-through opacity-75' : ''}>
                                {task.title}
                              </span>
                            </div>
                          </div>
                        ))}
                        
                        {/* Eventos */}
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate border cursor-pointer hover:shadow-sm transition-shadow ${getCategoryColor(event.category)}`}
                            title={`${event.title} - Clique para ver detalhes`}
                            onClick={(e) => {
                              e.stopPropagation()
                              openEventModal(event.id)
                            }}
                          >
                            📅 {event.title}
                          </div>
                        ))}
                        
                        {/* Indicador de mais itens */}
                        {(dayTasks.length + dayEvents.length) > 4 && (
                          <div className="text-xs text-gray-500">
                            +{(dayTasks.length + dayEvents.length) - 4} mais
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo do mês */}
        {!loading && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Tarefas</p>
                    <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Eventos</p>
                    <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Categorias</p>
                    <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Detalhes da Tarefa */}
        <TaskDetailsModal
          isOpen={isTaskModalOpen}
          onClose={closeTaskModal}
          taskId={selectedTaskId}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />

        {/* Modal de Detalhes do Evento */}
        <EventDetailsModal
          isOpen={isEventModalOpen}
          onClose={closeEventModal}
          eventId={selectedEventId}
          onEventDeleted={handleEventDeleted}
        />
      </div>
    </Layout>
  )
}