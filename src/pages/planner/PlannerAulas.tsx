import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { 
  GraduationCap,
  Plus,
  ArrowLeft,
  Clock,
  MapPin,
  BookOpen,
  Users,
  Calendar
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PlannerAPI, UserTask, UserCalendarEvent, TaskCategory } from '../../lib/planner-api'
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

export default function PlannerAulas() {
  const [tasks, setTasks] = useState<UserTask[]>([])
  const [events, setEvents] = useState<UserCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()
  const navigate = useNavigate()

  // Carregar dados das aulas
  const loadAulasData = async () => {
    try {
      setLoading(true)
      const data = await PlannerAPI.getDashboardData()
      
      // Filtrar apenas itens relacionados a aulas/estudos
      const aulasTasks = data.upcomingTasks.filter(task => 
        task.category?.name?.toLowerCase().includes('aula') ||
        task.title.toLowerCase().includes('aula') ||
        task.title.toLowerCase().includes('estudo') ||
        task.title.toLowerCase().includes('curso') ||
        task.description?.toLowerCase().includes('aula') ||
        task.description?.toLowerCase().includes('estudo')
      )
      
      const aulasEvents = data.upcomingEvents.filter(event =>
        event.category?.name?.toLowerCase().includes('aula') ||
        event.title.toLowerCase().includes('aula') ||
        event.title.toLowerCase().includes('estudo') ||
        event.title.toLowerCase().includes('curso') ||
        event.description?.toLowerCase().includes('aula') ||
        event.description?.toLowerCase().includes('estudo')
      )
      
      setTasks(aulasTasks)
      setEvents(aulasEvents)
    } catch (error) {
      console.error('Erro ao carregar dados das aulas:', error)
      addToast({
        message: 'Erro ao carregar dados das aulas',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAulasData()
  }, [])

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
              <h1 className="text-2xl font-bold text-gray-900">Aulas</h1>
              <p className="text-gray-600 mt-1">
                Gerencie suas aulas e estudos
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => navigate('/planner/nova-tarefa')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Aula
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">Carregando aulas...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tarefas de Aula */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  Tarefas de Estudo ({tasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhuma tarefa de estudo cadastrada</p>
                    <Button
                      onClick={() => navigate('/planner/nova-tarefa')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Tarefa de Estudo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-gray-900">
                                {task.title}
                              </h3>
                              
                              {task.category && (
                                <Badge 
                                  variant="outline" 
                                  className={`${getCategoryColor(task.category)} flex items-center gap-1`}
                                >
                                  {task.category.name}
                                </Badge>
                              )}
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {task.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(task.due_date)}</span>
                                </div>
                              )}
                              
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

            {/* Eventos de Aula */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Eventos de Aula ({events.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhum evento de aula cadastrado</p>
                    <Button
                      onClick={() => navigate('/planner/nova-tarefa')}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Evento de Aula
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
                            <Users className="h-5 w-5 text-green-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-gray-900">
                                {event.title}
                              </h3>
                              
                              {event.category && (
                                <Badge 
                                  variant="outline" 
                                  className={`${getCategoryColor(event.category)} flex items-center gap-1`}
                                >
                                  {event.category.name}
                                </Badge>
                              )}
                            </div>
                            
                            {event.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {event.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {event.start_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(event.start_date)}</span>
                                </div>
                              )}
                              
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
                                  <MapPin className="h-3 w-3" />
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

        {/* Resumo das Aulas */}
        {!loading && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tarefas de Estudo</p>
                    <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Eventos de Aula</p>
                    <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Aulas</p>
                    <p className="text-2xl font-bold text-gray-900">{tasks.length + events.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dicas de Estudo */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Dicas de Organização de Estudos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">📚 Planejamento</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Defina horários fixos para estudar</li>
                  <li>• Crie metas diárias e semanais</li>
                  <li>• Use a técnica Pomodoro (25min estudo + 5min pausa)</li>
                  <li>• Revise o conteúdo regularmente</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">🎯 Organização</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Separe materiais por matéria</li>
                  <li>• Mantenha um ambiente de estudo limpo</li>
                  <li>• Use cores diferentes para cada disciplina</li>
                  <li>• Faça resumos e mapas mentais</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
