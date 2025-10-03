import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { 
  FileText,
  Plus,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle,
  Circle,
  Pin,
  Calendar,
  Clock
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PlannerAPI, UserTask, UserNote, TaskCategory } from '../../lib/planner-api'
import { useToast } from '../../lib/toast-hooks'
import { TaskDetailsModal } from '../../components/planner/TaskDetailsModal'

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

export default function PlannerAgenda() {
  const [tasks, setTasks] = useState<UserTask[]>([])
  const [notes, setNotes] = useState<UserNote[]>([])
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [viewMode, setViewMode] = useState<'all' | 'tasks' | 'notes'>('all')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const { addToast } = useToast()
  const navigate = useNavigate()

  // Carregar dados da agenda
  const loadAgendaData = async () => {
    try {
      setLoading(true)
      const data = await PlannerAPI.getDashboardData()
      setTasks(data.upcomingTasks)
      setNotes(data.recentNotes)
      setCategories(data.categories)
    } catch (error) {
      console.error('Erro ao carregar dados da agenda:', error)
      addToast({
        message: 'Erro ao carregar dados da agenda',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAgendaData()
  }, [])

  // Filtrar itens
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = !selectedCategory || task.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || note.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Marcar tarefa como concluída
  const toggleTaskComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const newStatus = task.status === 'completed' ? 'pending' : 'completed'
      await PlannerAPI.updateTask(taskId, { status: newStatus })
      
      // Recarregar dados
      loadAgendaData()
      
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
    loadAgendaData()
  }

  // Recarregar dados quando tarefa for deletada
  const handleTaskDeleted = () => {
    loadAgendaData()
    closeTaskModal()
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
              <p className="text-gray-600 mt-1">
                Lista de todas as suas tarefas e anotações
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => navigate('/planner/nova-tarefa')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar tarefas e anotações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtro por categoria */}
              <div className="md:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modo de visualização */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('all')}
                >
                  Todos
                </Button>
                <Button
                  variant={viewMode === 'tasks' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('tasks')}
                >
                  Tarefas
                </Button>
                <Button
                  variant={viewMode === 'notes' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('notes')}
                >
                  Anotações
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">Carregando agenda...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tarefas */}
            {(viewMode === 'all' || viewMode === 'tasks') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Tarefas ({filteredTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">
                        {searchTerm || selectedCategory ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa cadastrada'}
                      </p>
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
                      {filteredTasks.map((task) => (
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
            )}

            {/* Anotações */}
            {(viewMode === 'all' || viewMode === 'notes') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Anotações ({filteredNotes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredNotes.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">
                        {searchTerm || selectedCategory ? 'Nenhuma anotação encontrada' : 'Nenhuma anotação cadastrada'}
                      </p>
                      <Button
                        onClick={() => navigate('/planner/nova-tarefa')}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Anotação
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {note.is_pinned ? (
                                <Pin className="h-5 w-5 text-yellow-600" />
                              ) : (
                                <FileText className="h-5 w-5 text-purple-600" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-gray-900">
                                  {note.title}
                                </h3>
                                
                                {note.category && (
                                  <Badge 
                                    variant="outline" 
                                    className={`${getCategoryColor(note.category)} flex items-center gap-1`}
                                  >
                                    <div 
                                      className={`w-2 h-2 rounded-full ${getCategoryIndicatorColor(note.category)}`}
                                    />
                                    {note.category.name}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                                {note.content}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Criada em {formatDate(note.created_at)}</span>
                                </div>
                                
                                {note.tags && note.tags.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span>🏷️</span>
                                    <span>{note.tags.slice(0, 3).join(', ')}</span>
                                    {note.tags.length > 3 && <span>+{note.tags.length - 3}</span>}
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
            )}
          </div>
        )}

        {/* Resumo da Agenda */}
        {!loading && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Anotações</p>
                    <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Pin className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Anotações Fixadas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {notes.filter(n => n.is_pinned).length}
                    </p>
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
