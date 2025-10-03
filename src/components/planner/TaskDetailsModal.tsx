import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { 
  Calendar,
  Clock,
  Edit3,
  Trash2,
  Save,
  X,
  CheckCircle,
  Circle,
  AlertCircle,
  Flag,
  Tag,
  MapPin
} from 'lucide-react'
import { PlannerAPI, UserTask, TaskCategory } from '../../lib/planner-api'
import { useToast } from '../../lib/toast-hooks'

interface TaskDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string | null
  onTaskUpdated?: () => void
  onTaskDeleted?: () => void
}

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

// Função para obter ícone da prioridade
const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return <AlertCircle className="h-4 w-4 text-red-600" />
    case 'high':
      return <Flag className="h-4 w-4 text-orange-600" />
    case 'medium':
      return <Flag className="h-4 w-4 text-blue-600" />
    case 'low':
      return <Flag className="h-4 w-4 text-gray-600" />
    default:
      return <Flag className="h-4 w-4 text-gray-600" />
  }
}

// Função para obter cor da prioridade
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'low':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function TaskDetailsModal({ isOpen, onClose, taskId, onTaskUpdated, onTaskDeleted }: TaskDetailsModalProps) {
  const [task, setTask] = useState<UserTask | null>(null)
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    due_time: '',
    category_id: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled'
  })
  const { addToast } = useToast()

  // Carregar dados da tarefa
  const loadTaskData = async () => {
    if (!taskId) return

    try {
      setLoading(true)
      const [taskData, categoriesData] = await Promise.all([
        PlannerAPI.getTasks().then(tasks => tasks.find(t => t.id === taskId)),
        PlannerAPI.getCategories()
      ])

      if (taskData) {
        setTask(taskData)
        setFormData({
          title: taskData.title,
          description: taskData.description || '',
          due_date: taskData.due_date ? taskData.due_date.split('T')[0] : '',
          due_time: taskData.due_time || '',
          category_id: taskData.category_id || '',
          priority: taskData.priority,
          status: taskData.status
        })
      }
      setCategories(categoriesData)
    } catch (error) {
      console.error('Erro ao carregar dados da tarefa:', error)
      addToast({
        message: 'Erro ao carregar dados da tarefa',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && taskId) {
      loadTaskData()
    }
  }, [isOpen, taskId])

  // Marcar tarefa como concluída/pendente
  const toggleTaskStatus = async () => {
    if (!task) return

    try {
      setSaving(true)
      const newStatus = task.status === 'completed' ? 'pending' : 'completed'
      await PlannerAPI.updateTask(task.id, { 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined
      })
      
      setTask(prev => prev ? { ...prev, status: newStatus } : null)
      onTaskUpdated?.()
      
      addToast({
        message: newStatus === 'completed' ? 'Tarefa marcada como concluída!' : 'Tarefa desmarcada',
        type: 'success'
      })
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error)
      addToast({
        message: 'Erro ao atualizar tarefa',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  // Salvar edição da tarefa
  const handleSave = async () => {
    if (!task) return

    try {
      setSaving(true)
      const updateData = {
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date ? `${formData.due_date}T00:00:00` : undefined,
        due_time: formData.due_time,
        category_id: formData.category_id || null,
        priority: formData.priority,
        status: formData.status
      }

      const updatedTask = await PlannerAPI.updateTask(task.id, updateData)
      setTask(updatedTask)
      setEditing(false)
      onTaskUpdated?.()
      
      addToast({
        message: 'Tarefa atualizada com sucesso!',
        type: 'success'
      })
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      addToast({
        message: 'Erro ao atualizar tarefa',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  // Deletar tarefa
  const handleDelete = async () => {
    if (!task) return

    if (!confirm('Tem certeza que deseja deletar esta tarefa? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setDeleting(true)
      await PlannerAPI.deleteTask(task.id)
      onTaskDeleted?.()
      
      addToast({
        message: 'Tarefa deletada com sucesso!',
        type: 'success'
      })
      
      onClose()
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error)
      addToast({
        message: 'Erro ao deletar tarefa',
        type: 'error'
      })
    } finally {
      setDeleting(false)
    }
  }

  // Cancelar edição
  const handleCancelEdit = () => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        due_time: task.due_time || '',
        category_id: task.category_id || '',
        priority: task.priority,
        status: task.status
      })
    }
    setEditing(false)
  }

  if (!task) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {editing ? 'Editar Tarefa' : 'Detalhes da Tarefa'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Carregando...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              {editing ? (
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título da tarefa"
                />
              ) : (
                <h2 className="text-lg font-medium text-gray-900">{task.title}</h2>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              {editing ? (
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição da tarefa"
                  rows={4}
                />
              ) : (
                <div className="text-gray-700 whitespace-pre-wrap">
                  {task.description || 'Sem descrição'}
                </div>
              )}
            </div>

            {/* Status e Ações Principais */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {task.status === 'completed' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-400" />
                )}
                <div>
                  <p className="font-medium">
                    {task.status === 'completed' ? 'Concluída' : 'Pendente'}
                  </p>
                  {task.completed_at && (
                    <p className="text-sm text-gray-500">
                      Concluída em {formatDate(task.completed_at)}
                    </p>
                  )}
                </div>
              </div>
              {!editing && (
                <Button
                  onClick={toggleTaskStatus}
                  disabled={saving}
                  variant={task.status === 'completed' ? 'outline' : 'default'}
                  className={task.status === 'completed' ? '' : 'bg-green-600 hover:bg-green-700 text-white'}
                >
                  {task.status === 'completed' ? 'Desmarcar' : 'Marcar como Concluída'}
                </Button>
              )}
            </div>

            {/* Informações da Tarefa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data de Vencimento */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Vencimento
                </Label>
                {editing ? (
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                ) : (
                  <p className="text-gray-700">
                    {task.due_date ? formatDate(task.due_date) : 'Sem data definida'}
                  </p>
                )}
              </div>

              {/* Hora */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hora
                </Label>
                {editing ? (
                  <Input
                    type="time"
                    value={formData.due_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_time: e.target.value }))}
                  />
                ) : (
                  <p className="text-gray-700">
                    {task.due_time ? formatTime(task.due_time) : 'Sem hora definida'}
                  </p>
                )}
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categoria
                </Label>
                {editing ? (
                  <Select
                    value={formData.category_id || "none"}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value === "none" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getCategoryIndicatorColor(category)}`} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div>
                    {task.category ? (
                      <Badge 
                        variant="outline" 
                        className={`${getCategoryColor(task.category)} flex items-center gap-2 w-fit`}
                      >
                        <div className={`w-2 h-2 rounded-full ${getCategoryIndicatorColor(task.category)}`} />
                        {task.category.name}
                      </Badge>
                    ) : (
                      <p className="text-gray-500">Sem categoria</p>
                    )}
                  </div>
                )}
              </div>

              {/* Prioridade */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Prioridade
                </Label>
                {editing ? (
                  <Select
                    value={formData.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                      setFormData(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge 
                    variant="outline" 
                    className={`${getPriorityColor(task.priority)} flex items-center gap-2 w-fit`}
                  >
                    {getPriorityIcon(task.priority)}
                    {task.priority === 'urgent' ? 'Urgente' :
                     task.priority === 'high' ? 'Alta' :
                     task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Status (apenas na edição) */}
            {editing && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'cancelled') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Informações de Criação */}
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                <p>Criada em: {formatDate(task.created_at)}</p>
                {task.updated_at !== task.created_at && (
                  <p>Atualizada em: {formatDate(task.updated_at)}</p>
                )}
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deletando...' : 'Deletar Tarefa'}
              </Button>

              {editing && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !formData.title.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
