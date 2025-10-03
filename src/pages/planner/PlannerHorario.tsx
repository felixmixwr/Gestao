import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { 
  Clock,
  Plus,
  ArrowLeft,
  Calendar,
  MapPin
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PlannerAPI, UserTask, UserCalendarEvent, TaskCategory } from '../../lib/planner-api'
import { useToast } from '../../lib/toast-hooks'

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

// Gerar horários do dia (24 horas)
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 0; hour < 24; hour++) {
    slots.push({
      hour,
      time: `${hour.toString().padStart(2, '0')}:00`,
      displayTime: `${hour.toString().padStart(2, '0')}:00`
    })
  }
  return slots
}

export default function PlannerHorario() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [tasks, setTasks] = useState<UserTask[]>([])
  const [events, setEvents] = useState<UserCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
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
      console.error('Erro ao carregar dados do horário:', error)
      addToast({
        message: 'Erro ao carregar dados do horário',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDayData()
  }, [selectedDate])

  // Obter itens para um horário específico
  const getItemsForTime = (hour: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`
    
    const timeTasks = tasks.filter(task => {
      if (!task.due_time) return false
      const taskHour = parseInt(task.due_time.split(':')[0])
      return taskHour === hour
    })
    
    const timeEvents = events.filter(event => {
      if (event.all_day) return false
      const eventHour = parseInt(event.start_date.split('T')[1]?.split(':')[0] || '0')
      return eventHour === hour
    })
    
    return { tasks: timeTasks, events: timeEvents }
  }

  const timeSlots = generateTimeSlots()
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
              <h1 className="text-2xl font-bold text-gray-900">Horário</h1>
              <p className="text-gray-600 mt-1">
                Organize seu tempo por horários
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
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
            <div className="text-gray-500">Carregando horários...</div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Cronograma do Dia
                {isToday && (
                  <Badge className="bg-blue-100 text-blue-800">
                    Hoje
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {timeSlots.map((slot) => {
                  const { tasks: timeTasks, events: timeEvents } = getItemsForTime(slot.hour)
                  const hasItems = timeTasks.length > 0 || timeEvents.length > 0
                  const isCurrentHour = isToday && new Date().getHours() === slot.hour
                  
                  return (
                    <div
                      key={slot.hour}
                      className={`flex border-l-4 ${
                        isCurrentHour ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      } ${hasItems ? 'bg-gray-50' : ''}`}
                    >
                      {/* Horário */}
                      <div className={`w-20 p-3 text-sm font-medium ${
                        isCurrentHour ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {slot.displayTime}
                      </div>
                      
                      {/* Itens do horário */}
                      <div className="flex-1 p-3">
                        {hasItems ? (
                          <div className="space-y-2">
                            {/* Tarefas */}
                            {timeTasks.map((task) => (
                              <div
                                key={task.id}
                                className={`p-3 rounded-lg border ${getCategoryColor(task.category)}`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm">{task.title}</h4>
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
                                  <p className="text-xs text-gray-600">{task.description}</p>
                                )}
                              </div>
                            ))}
                            
                            {/* Eventos */}
                            {timeEvents.map((event) => (
                              <div
                                key={event.id}
                                className={`p-3 rounded-lg border ${getCategoryColor(event.category)}`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar className="h-4 w-4" />
                                  <h4 className="font-medium text-sm">{event.title}</h4>
                                  {event.category && (
                                    <Badge 
                                      variant="outline" 
                                      className={`${getCategoryColor(event.category)} flex items-center gap-1`}
                                    >
                                      <div 
                                        className={`w-2 h-2 rounded-full ${getCategoryIndicatorColor(event.category)}`}
                                      />
                                      {event.category.name}
                                    </Badge>
                                  )}
                                </div>
                                {event.description && (
                                  <p className="text-xs text-gray-600">{event.description}</p>
                                )}
                                {event.location && (
                                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                    <MapPin className="h-3 w-3" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm">
                            {isCurrentHour ? 'Hora atual - sem compromissos' : 'Sem compromissos'}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo do Dia */}
        {!loading && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tarefas Agendadas</p>
                    <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Eventos Agendados</p>
                    <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Horários Ocupados</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {timeSlots.filter(slot => {
                        const { tasks, events } = getItemsForTime(slot.hour)
                        return tasks.length > 0 || events.length > 0
                      }).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
