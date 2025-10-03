import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { 
  Calendar,
  Plus,
  ArrowLeft,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PlannerAPI, UserTask, UserCalendarEvent, TaskCategory } from '../../lib/planner-api'
import { useToast } from '../../lib/toast-hooks'

// Função para obter estatísticas do ano
const getYearStats = (tasks: UserTask[], events: UserCalendarEvent[], year: number) => {
  const yearTasks = tasks.filter(task => {
    if (!task.due_date) return false
    const taskYear = new Date(task.due_date).getFullYear()
    return taskYear === year
  })
  
  const yearEvents = events.filter(event => {
    const eventYear = new Date(event.start_date).getFullYear()
    return eventYear === year
  })
  
  const completedTasks = yearTasks.filter(task => task.status === 'completed')
  const pendingTasks = yearTasks.filter(task => task.status !== 'completed')
  
  return {
    totalTasks: yearTasks.length,
    completedTasks: completedTasks.length,
    pendingTasks: pendingTasks.length,
    totalEvents: yearEvents.length,
    completionRate: yearTasks.length > 0 ? (completedTasks.length / yearTasks.length) * 100 : 0
  }
}

export default function PlannerAnos() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [tasks, setTasks] = useState<UserTask[]>([])
  const [events, setEvents] = useState<UserCalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()
  const navigate = useNavigate()

  // Carregar dados do ano
  const loadYearData = async () => {
    try {
      setLoading(true)
      const startDate = new Date(selectedYear, 0, 1).toISOString()
      const endDate = new Date(selectedYear, 11, 31).toISOString()
      
      const data = await PlannerAPI.getCalendarData(startDate, endDate)
      setTasks(data.tasks)
      setEvents(data.events)
    } catch (error) {
      console.error('Erro ao carregar dados do ano:', error)
      addToast({
        message: 'Erro ao carregar dados do ano',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadYearData()
  }, [selectedYear])

  // Gerar lista de anos (últimos 5 anos + próximos 2)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.push(i)
    }
    return years
  }

  const yearStats = getYearStats(tasks, events, selectedYear)
  const yearOptions = generateYearOptions()

  // Estatísticas por mês
  const getMonthlyStats = () => {
    const monthlyStats = []
    for (let month = 0; month < 12; month++) {
      const monthTasks = tasks.filter(task => {
        if (!task.due_date) return false
        const taskDate = new Date(task.due_date)
        return taskDate.getMonth() === month
      })
      
      const monthEvents = events.filter(event => {
        const eventDate = new Date(event.start_date)
        return eventDate.getMonth() === month
      })
      
      const completedMonthTasks = monthTasks.filter(task => task.status === 'completed')
      
      monthlyStats.push({
        month,
        monthName: new Date(selectedYear, month, 1).toLocaleDateString('pt-BR', { month: 'long' }),
        tasks: monthTasks.length,
        completedTasks: completedMonthTasks.length,
        events: monthEvents.length,
        completionRate: monthTasks.length > 0 ? (completedMonthTasks.length / monthTasks.length) * 100 : 0
      })
    }
    return monthlyStats
  }

  const monthlyStats = getMonthlyStats()

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
              <h1 className="text-2xl font-bold text-gray-900">Visão Anual</h1>
              <p className="text-gray-600 mt-1">
                Visão anual dos seus objetivos e metas
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            
            <Button
              onClick={() => navigate('/planner/nova-tarefa')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">Carregando dados do ano...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumo do Ano */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Tarefas</p>
                      <p className="text-2xl font-bold text-gray-900">{yearStats.totalTasks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tarefas Concluídas</p>
                      <p className="text-2xl font-bold text-gray-900">{yearStats.completedTasks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tarefas Pendentes</p>
                      <p className="text-2xl font-bold text-gray-900">{yearStats.pendingTasks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {yearStats.completionRate.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas Mensais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Estatísticas Mensais - {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {monthlyStats.map((month) => (
                    <div
                      key={month.month}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 capitalize">
                          {month.monthName}
                        </h4>
                        <Badge 
                          variant="outline"
                          className={
                            month.completionRate >= 80 ? 'bg-green-100 text-green-800' :
                            month.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {month.completionRate.toFixed(0)}%
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tarefas:</span>
                          <span className="font-medium">{month.tasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Concluídas:</span>
                          <span className="font-medium text-green-600">{month.completedTasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Eventos:</span>
                          <span className="font-medium text-blue-600">{month.events}</span>
                        </div>
                      </div>
                      
                      {/* Barra de progresso */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              month.completionRate >= 80 ? 'bg-green-500' :
                              month.completionRate >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(month.completionRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metas do Ano */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Metas e Objetivos do Ano
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    Defina suas metas e objetivos para {selectedYear}
                  </p>
                  <Button
                    onClick={() => navigate('/planner/nova-tarefa')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Definir Meta
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dicas de Planejamento Anual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  Dicas de Planejamento Anual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">🎯 Definição de Metas</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Defina metas SMART (Específicas, Mensuráveis, Atingíveis, Relevantes, Temporais)</li>
                      <li>• Divida metas grandes em objetivos menores</li>
                      <li>• Estabeleça prazos realistas</li>
                      <li>• Revise e ajuste metas regularmente</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">📊 Acompanhamento</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Monitore o progresso mensalmente</li>
                      <li>• Celebre pequenas conquistas</li>
                      <li>• Ajuste estratégias quando necessário</li>
                      <li>• Mantenha um diário de progresso</li>
                    </ul>
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
