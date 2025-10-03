import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Checkbox } from '../../components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { 
  Clock, 
  ArrowLeft,
  Save,
  Plus
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { UserTasksAPI, TaskCategoriesAPI, CreateTaskData, TaskCategory } from '../../lib/planner-api'
import { useToast } from '../../lib/toast-hooks'
import { DatePicker } from '../../components/ui/date-picker'

export default function NovaTarefa() {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: '',
    due_date: '',
    due_time: '',
    category_id: '',
    priority: 'medium',
    is_recurring: false,
    recurrence_pattern: '',
    recurrence_interval: 1,
    recurrence_end_date: ''
  })
  const { addToast } = useToast()
  const navigate = useNavigate()

  // Carregar categorias
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await TaskCategoriesAPI.getAll()
        setCategories(categoriesData)
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
        addToast({
          message: 'Erro ao carregar categorias',
          type: 'error'
        })
      }
    }

    loadCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      addToast({
        message: 'O nome da tarefa é obrigatório',
        type: 'error'
      })
      return
    }

    try {
      setLoading(true)
      
      // Preparar dados para envio
      const taskData: CreateTaskData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        priority: formData.priority,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : undefined,
        recurrence_interval: formData.is_recurring ? formData.recurrence_interval : undefined,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date 
          ? new Date(formData.recurrence_end_date).toISOString() 
          : undefined
      }

      // Adicionar data e hora se fornecidas
      if (formData.due_date) {
        const dueDateTime = new Date(formData.due_date)
        if (formData.due_time) {
          const [hours, minutes] = formData.due_time.split(':')
          dueDateTime.setHours(parseInt(hours), parseInt(minutes))
        }
        taskData.due_date = dueDateTime.toISOString()
        taskData.due_time = formData.due_time || undefined
      }

      // Adicionar categoria se selecionada
      if (formData.category_id) {
        taskData.category_id = formData.category_id
      }

      await UserTasksAPI.create(taskData)
      
      addToast({
        message: 'Tarefa criada com sucesso!',
        type: 'success'
      })
      
      // Redirecionar para o calendário
      navigate('/planner/calendario')
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      addToast({
        message: 'Erro ao criar tarefa. Tente novamente.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateTaskData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Obter cor da categoria
  const getCategoryColor = (category: TaskCategory) => {
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

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/planner">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nova Tarefa</h1>
              <p className="text-gray-600 mt-1">
                Crie uma nova tarefa para organizar seus compromissos
              </p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Tarefa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="title">Nome da Tarefa *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Digite o nome da tarefa"
                  required
                />
              </div>

              {/* Data */}
              <DatePicker
                label="Data"
                value={formData.due_date || ''}
                onChange={(value) => handleInputChange('due_date', value)}
                placeholder="Selecionar data"
              />

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleInputChange('category_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`}
                          />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Horário */}
              <div className="space-y-2">
                <Label htmlFor="due_time">Horário</Label>
                <div className="relative">
                  <Input
                    id="due_time"
                    type="time"
                    value={formData.due_time}
                    onChange={(e) => handleInputChange('due_time', e.target.value)}
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Prioridade */}
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-800">Baixa</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800">Média</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-800">Alta</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-800">Urgente</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Adicione detalhes sobre a tarefa..."
                  rows={4}
                />
              </div>

              {/* Repetição */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
                  />
                  <Label htmlFor="is_recurring">Esta tarefa se repete?</Label>
                </div>

                {/* Configurações de Repetição */}
                {formData.is_recurring && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="recurrence_pattern">Frequência</Label>
                      <Select
                        value={formData.recurrence_pattern}
                        onValueChange={(value) => handleInputChange('recurrence_pattern', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diariamente</SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                          <SelectItem value="monthly">Mensalmente</SelectItem>
                          <SelectItem value="yearly">Anualmente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recurrence_interval">A cada</Label>
                      <Input
                        id="recurrence_interval"
                        type="number"
                        min="1"
                        value={formData.recurrence_interval}
                        onChange={(e) => handleInputChange('recurrence_interval', parseInt(e.target.value))}
                      />
                    </div>

                    <DatePicker
                      label="Data de término"
                      value={formData.recurrence_end_date || ''}
                      onChange={(value) => handleInputChange('recurrence_end_date', value)}
                      placeholder="Selecionar data de término"
                    />
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-3 pt-4">
                <Link to="/planner">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Criando...' : 'Criar Tarefa'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
