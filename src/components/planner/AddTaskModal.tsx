import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Checkbox } from '../../components/ui/checkbox'
import { CalendarIcon, Clock } from 'lucide-react'
import { UserTasksAPI, CreateTaskData, TaskCategory } from '../../lib/planner-api'
import { useToast } from '../../lib/toast-hooks'

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskAdded: () => void
  selectedDate?: Date | null
  categories: TaskCategory[]
}

export function AddTaskModal({ 
  isOpen, 
  onClose, 
  onTaskAdded, 
  selectedDate, 
  categories 
}: AddTaskModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: '',
    due_date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    due_time: '',
    category_id: '',
    priority: 'medium',
    is_recurring: false,
    recurrence_pattern: '',
    recurrence_interval: 1,
    recurrence_end_date: ''
  })
  const { addToast } = useToast()

  // Resetar formulário quando o modal abrir
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        due_date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
        due_time: '',
        category_id: '',
        priority: 'medium',
        is_recurring: false,
        recurrence_pattern: '',
        recurrence_interval: 1,
        recurrence_end_date: ''
      })
    }
  }, [isOpen, selectedDate])

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
      
      onTaskAdded()
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">ADICIONAR TAREFA</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="title">Nome</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Digite o nome da tarefa"
              required
            />
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Data</Label>
            <div className="relative">
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
              />
              <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Categoria de Peso */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria de peso</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => handleInputChange('category_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Não atribuído" />
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

          {/* Prazo de Entrega */}
          <div className="space-y-2">
            <Label htmlFor="due_time">Prazo de entrega</Label>
            <div className="relative">
              <Input
                id="due_time"
                type="time"
                value={formData.due_time}
                onChange={(e) => handleInputChange('due_time', e.target.value)}
                placeholder="10:00"
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
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Detalhes */}
          <div className="space-y-2">
            <Label htmlFor="description">Detalhes</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Adicione detalhes sobre a tarefa..."
              rows={3}
            />
          </div>

          {/* Repete? */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_recurring"
              checked={formData.is_recurring}
              onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
            />
            <Label htmlFor="is_recurring">Repete?</Label>
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

              <div className="space-y-2">
                <Label htmlFor="recurrence_end_date">Data de término</Label>
                <Input
                  id="recurrence_end_date"
                  type="date"
                  value={formData.recurrence_end_date}
                  onChange={(e) => handleInputChange('recurrence_end_date', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Criando...' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
