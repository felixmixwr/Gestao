import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { 
  CalendarDays,
  Clock,
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PlannerAPI, UserTask, UserCalendarEvent, TaskCategory } from '../../lib/planner-api'
import { useToast } from '../../lib/toast-hooks'
import { TaskDetailsModal } from '../../components/planner/TaskDetailsModal'

// Função para formatar data
const formatDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
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

export default function PlannerDia() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [tasks, setTasks] = useState<UserTask[]>([])
  const [events, setEvents] = useState<UserCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const { addToast } = useToast()
  const navigate = useNavigate()

  // Carregar dados do dia
  const loadDayData = async () => {
    try {
      setLoading(true)
      const dateStr = selectedDate.toISOString().split('T')[0]
      const startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)
      
      const data = await PlannerAPI.getCalendarData(startDate.toISOString(), endDate.toISOString())
      
      // Filtrar apenas itens do dia selecionado
      const dayTasks = data.tasks.filter(task => {
        if (!task.due_date) return false
        return task.due_date.split('T')[0] === dateStr
      })
      
      const dayEvents = data.events.filter(event => {
        return event.start_date.split('T')[0] === dateStr
      })
      
      setTasks(dayTasks)
      setEvents(dayEvents)
    } catch (error) {
      console.error('Erro ao carregar dados do dia:', error)
      addToast({
        message: 'Erro ao carregar dados do dia',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDayData()
  }, [selectedDate])

  // Navegação entre dias
  const goToPreviousDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() - 1)
      return newDate
    })
  }

  const goToNextDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + 1)
      return newDate
    })
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // Abrir modal de detalhes da tarefa
  const openTaskModal = (taskId: string) => {
    setSelectedTaskId(taskId)
    setIsTaskModalOpen(true)
  }

  // Fechar modal
  const closeTaskModal = () => {
    setSelectedTaskId(null)
    setIsTaskModalOpen(false)
  }

  // Recarregar dados quando tarefa for atualizada
  const handleTaskUpdated = () => {
    loadDayData()
  }

  // Recarregar dados quando tarefa for deletada
  const handleTaskDeleted = () => {
    loadDayData()
    closeTaskModal()
  }

  // Marcar tarefa como concluída
  const toggleTaskComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const newStatus = task.status === 'completed' ? 'pending' : 'completed'
      await PlannerAPI.updateTask(taskId, { status: newStatus })
      
      // Recarregar dados
      loadDayData()
      
      addToast({
        message: newStatus === 'completed' ? 'Tarefa marcada como concluída!' : 'Tarefa desmarcada',
        type: 'success'
      })
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      addToast({
        message: 'Erro ao atualizar tarefa',
        type: 'error'
      })
    }
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

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
              <h1 className="text-2xl font-bold text-gray-900">Visão Diária</h1>
              <p className="text-gray-600 mt-1">
                {formatDate(selectedDate)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={goToPreviousDay}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={goToToday}
              variant="outline"
              size="sm"
              className={isToday ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}
            >
              📅 Hoje
            </Button>
            
            <Button
              onClick={goToNextDay}
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

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">Carregando dados do dia...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tarefas do Dia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Tarefas do Dia ({tasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhuma tarefa para hoje</p>
                    <Button
                      onClick={() => navigate('/planner/nova-tarefa')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Tarefa
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border transition-all ${
                          task.status === 'completed' 
                            ? 'bg-green-50 border-green-200 opacity-75' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleTaskComplete(task.id)}
                            className="flex-shrink-0 mt-1 hover:scale-110 transition-transform"
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400 hover:text-green-600" />
                            )}
                          </button>
                          
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => openTaskModal(task.id)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className={`font-medium ${
                                task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}>
                                {task.title}
                              </h3>
                              
                              {task.category && (
                                <Badge 
                                  variant="outline" 
                                  className={`${getCategoryColor(task.category)} flex items-center gap-1`}
                                >
                                  <div 
                                    className={`w-2 h-2 rounded-full ${getCategoryIndicatorColor(task.category)}`}
                                  />
                                  {task.category.name}
                                </Badge>
                              )}
                            </div>
                            
                            {task.description && (
                              <p className={`text-sm mb-2 ${
                                task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {task.due_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTime(task.due_time)}</span>
                                </div>
                              )}
                              
                              <Badge 
                                variant="outline" 
                                className={
                                  task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  task.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }
                              >
                                {task.priority === 'urgent' ? 'Urgente' :
                                 task.priority === 'high' ? 'Alta' :
                                 task.priority === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Eventos do Dia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  Eventos do Dia ({events.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhum evento para hoje</p>
                    <Button
                      onClick={() => navigate('/planner/nova-tarefa')}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Evento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 mb-2">
                              {event.title}
                            </h3>
                            
                            {event.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {event.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {!event.all_day && event.start_date && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {formatTime(event.start_date.split('T')[1]?.substring(0, 5) || '')}
                                  </span>
                                </div>
                              )}
                              
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <span>📍</span>
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Resumo do Dia */}
        {!loading && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tarefas Concluídas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tasks.filter(t => t.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Circle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tarefas Pendentes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tasks.filter(t => t.status !== 'completed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Eventos</p>
                    <p className="text-2xl font-bold text-gray-900">{events.length}</p>
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
      </div>
    </Layout>
  )
}
