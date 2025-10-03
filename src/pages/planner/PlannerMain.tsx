import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { 
  Calendar, 
  CalendarDays,
  FileText,
  Clock,
  GraduationCap,
  Settings,
  Plus,
  ChevronRight,
  NotebookPen,
  RefreshCw
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

export default function PlannerMain() {
  const [upcomingTasks, setUpcomingTasks] = useState<UserTask[]>([])
  const [recentNotes, setRecentNotes] = useState<UserNote[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<UserCalendarEvent[]>([])
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  // Carregar dados do dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const data = await PlannerAPI.getDashboardData()
      setUpcomingTasks(data.upcomingTasks)
      setRecentNotes(data.recentNotes)
      setUpcomingEvents(data.upcomingEvents)
      setCategories(data.categories)
    } catch (error) {
      console.error('Erro ao carregar dados do planner:', error)
      addToast({
        message: 'Erro ao carregar dados do planner',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Opções de navegação do planner
  const plannerOptions = [
    {
      name: 'Calendário',
      description: 'Visualize seus compromissos em formato de calendário',
      href: '/planner/calendario',
      icon: <Calendar className="h-8 w-8 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      stats: upcomingTasks.length + upcomingEvents.length
    },
    {
      name: 'Dia',
      description: 'Foque no que precisa fazer hoje',
      href: '/planner/dia',
      icon: <CalendarDays className="h-8 w-8 text-green-600" />,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      stats: upcomingTasks.filter(task => {
        if (!task.due_date) return false
        const today = new Date()
        const taskDate = new Date(task.due_date)
        return taskDate.toDateString() === today.toDateString()
      }).length
    },
    {
      name: 'Agenda',
      description: 'Lista de todas as suas tarefas e anotações',
      href: '/planner/agenda',
      icon: <FileText className="h-8 w-8 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      stats: upcomingTasks.length
    },
    {
      name: 'Horário',
      description: 'Organize seu tempo por horários',
      href: '/planner/horario',
      icon: <Clock className="h-8 w-8 text-orange-600" />,
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      stats: upcomingEvents.length
    },
    {
      name: 'Aulas',
      description: 'Gerencie suas aulas e estudos',
      href: '/planner/aulas',
      icon: <GraduationCap className="h-8 w-8 text-indigo-600" />,
      color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
      stats: 0
    },
    {
      name: 'Anos',
      description: 'Visão anual dos seus objetivos',
      href: '/planner/anos',
      icon: <Calendar className="h-8 w-8 text-teal-600" />,
      color: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
      stats: 0
    }
  ]

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <NotebookPen className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organização Pessoal</h1>
              <p className="text-gray-600 mt-1">
                Gerencie seus compromissos, tarefas e anotações de forma organizada
              </p>
            </div>
          </div>
        </div>

        {/* Resumo Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Próxima Tarefa */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próxima Tarefa</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold">Carregando...</div>
              ) : upcomingTasks.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${getCategoryIndicatorColor(upcomingTasks[0].category)}`}
                    />
                    <h3 className="font-semibold text-sm truncate">{upcomingTasks[0].title}</h3>
                  </div>
                  {upcomingTasks[0].due_date && (
                    <p className="text-xs text-gray-600">
                      {formatDate(upcomingTasks[0].due_date)}
                      {upcomingTasks[0].due_time && ` às ${formatTime(upcomingTasks[0].due_time)}`}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Nenhuma tarefa próxima</div>
              )}
            </CardContent>
          </Card>

          {/* Próxima Anotação */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Anotação</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold">Carregando...</div>
              ) : recentNotes.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm truncate">{recentNotes[0].title}</h3>
                  <p className="text-xs text-gray-600">
                    {formatDate(recentNotes[0].created_at)}
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Nenhuma anotação recente</div>
              )}
            </CardContent>
          </Card>

          {/* Próximo Evento */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximo Evento</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold">Carregando...</div>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm truncate">{upcomingEvents[0].title}</h3>
                  <p className="text-xs text-gray-600">
                    {formatDate(upcomingEvents[0].start_date)}
                    {upcomingEvents[0].start_date && !upcomingEvents[0].all_day && 
                      ` às ${formatTime(upcomingEvents[0].start_date.split('T')[1]?.substring(0, 5) || '')}`
                    }
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Nenhum evento próximo</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Opções de Navegação */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Escolha onde quer organizar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plannerOptions.map((option, index) => (
              <Link key={index} to={option.href}>
                <Card className={`transition-all duration-200 cursor-pointer ${option.color}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-white rounded-lg">
                        {option.icon}
                      </div>
                      {option.stats > 0 && (
                        <Badge variant="secondary" className="bg-white/80">
                          {option.stats}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{option.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        Acessar
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/planner/nova-tarefa">
              <Button className="bg-[#2762ea] hover:bg-[#1e4fd1] text-white border-0">
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </Link>
            <Link to="/planner/agenda">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Nova Anotação
              </Button>
            </Link>
            <Link to="/planner/configuracoes">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </Link>
            <Link to="/planner/configuracoes#sync">
              <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar NF
              </Button>
            </Link>
          </div>
        </div>

        {/* Categorias Disponíveis */}
        {categories.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Categorias Disponíveis</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge 
                  key={category.id} 
                  variant="outline" 
                  className={`${getCategoryColor(category)} flex items-center gap-2`}
                >
                  <div 
                    className={`w-2 h-2 rounded-full ${getCategoryIndicatorColor(category)}`}
                  />
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
