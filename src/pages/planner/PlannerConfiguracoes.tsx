import React, { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Switch } from '../../components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { 
  Settings,
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Palette,
  Bell,
  Clock,
  Globe,
  User,
  Save,
  RefreshCw
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PlannerAPI, TaskCategory } from '../../lib/planner-api'
import { useToast } from '../../lib/toast-hooks'
import { NotasFiscaisSyncManager } from '../../components/NotasFiscaisSyncManager'

// Cores disponíveis para categorias
const AVAILABLE_COLORS = [
  { value: 'green', label: 'Verde', class: 'bg-green-500' },
  { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
  { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
  { value: 'orange', label: 'Laranja', class: 'bg-orange-500' },
  { value: 'yellow', label: 'Amarelo', class: 'bg-yellow-500' },
  { value: 'teal', label: 'Azul-esverdeado', class: 'bg-teal-500' },
  { value: 'brown', label: 'Marrom', class: 'bg-amber-500' },
  { value: 'gray', label: 'Cinza', class: 'bg-gray-500' },
  { value: 'black', label: 'Preto', class: 'bg-gray-800' },
  { value: 'indigo', label: 'Índigo', class: 'bg-indigo-500' }
]

export default function PlannerConfiguracoes() {
  const [categories, setCategories] = useState<TaskCategory[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('blue')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Configurações do usuário
  const [settings, setSettings] = useState({
    notifications: true,
    emailReminders: false,
    defaultView: 'dia',
    timezone: 'America/Sao_Paulo',
    weekStartsOn: 'monday',
    workingHours: {
      start: '08:00',
      end: '18:00'
    }
  })

  const { addToast } = useToast()
  const navigate = useNavigate()

  // Carregar configurações
  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await PlannerAPI.getDashboardData()
      setCategories(data.categories)
      
      // Carregar configurações do usuário (simulado por enquanto)
      // TODO: Implementar API para configurações do usuário
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      addToast({
        message: 'Erro ao carregar configurações',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  // Adicionar nova categoria
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      addToast({
        message: 'Nome da categoria é obrigatório',
        type: 'error'
      })
      return
    }

    try {
      setSaving(true)
      const newCategory = await PlannerAPI.createCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor
      })
      
      setCategories(prev => [...prev, newCategory])
      setNewCategoryName('')
      setNewCategoryColor('blue')
      
      addToast({
        message: 'Categoria criada com sucesso!',
        type: 'success'
      })
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      addToast({
        message: 'Erro ao criar categoria',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  // Editar categoria
  const handleEditCategory = async (categoryId: string, newName: string, newColor: string) => {
    try {
      setSaving(true)
      await PlannerAPI.updateCategory(categoryId, {
        name: newName,
        color: newColor
      })
      
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, name: newName, color: newColor }
          : cat
      ))
      setEditingCategory(null)
      
      addToast({
        message: 'Categoria atualizada com sucesso!',
        type: 'success'
      })
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error)
      addToast({
        message: 'Erro ao atualizar categoria',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  // Deletar categoria
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta categoria?')) {
      return
    }

    try {
      setSaving(true)
      await PlannerAPI.deleteCategory(categoryId)
      
      setCategories(prev => prev.filter(cat => cat.id !== categoryId))
      
      addToast({
        message: 'Categoria deletada com sucesso!',
        type: 'success'
      })
    } catch (error) {
      console.error('Erro ao deletar categoria:', error)
      addToast({
        message: 'Erro ao deletar categoria',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  // Salvar configurações
  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      // TODO: Implementar API para salvar configurações
      addToast({
        message: 'Configurações salvas com sucesso!',
        type: 'success'
      })
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      addToast({
        message: 'Erro ao salvar configurações',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
              <p className="text-gray-600 mt-1">
                Personalize sua experiência no planner
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">Carregando configurações...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Configurações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultView">Visualização Padrão</Label>
                    <Select 
                      value={settings.defaultView} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, defaultView: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dia">Dia</SelectItem>
                        <SelectItem value="calendario">Calendário</SelectItem>
                        <SelectItem value="agenda">Agenda</SelectItem>
                        <SelectItem value="horario">Horário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weekStartsOn">Início da Semana</Label>
                    <Select 
                      value={settings.weekStartsOn} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, weekStartsOn: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sunday">Domingo</SelectItem>
                        <SelectItem value="monday">Segunda-feira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select 
                      value={settings.timezone} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                        <SelectItem value="America/New_York">Nova York (UTC-5)</SelectItem>
                        <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações</Label>
                      <p className="text-sm text-gray-500">Receber notificações de lembretes</p>
                    </div>
                    <Switch
                      checked={settings.notifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Lembretes por Email</Label>
                      <p className="text-sm text-gray-500">Receber lembretes por email</p>
                    </div>
                    <Switch
                      checked={settings.emailReminders}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailReminders: checked }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workingStart">Início do Horário de Trabalho</Label>
                    <Input
                      id="workingStart"
                      type="time"
                      value={settings.workingHours.start}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, start: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workingEnd">Fim do Horário de Trabalho</Label>
                    <Input
                      id="workingEnd"
                      type="time"
                      value={settings.workingHours.end}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, end: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sincronização com Notas Fiscais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Sincronização com Notas Fiscais
                </CardTitle>
                <CardDescription>
                  Sincronize suas notas fiscais existentes com o planner para criar eventos automáticos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotasFiscaisSyncManager />
              </CardContent>
            </Card>

            {/* Gerenciamento de Categorias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Categorias de Tarefas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Adicionar Nova Categoria */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium mb-4">Adicionar Nova Categoria</h3>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Nome da categoria"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                    </div>
                    <div className="w-48">
                      <Select value={newCategoryColor} onValueChange={setNewCategoryColor}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_COLORS.map(color => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${color.class}`} />
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleAddCategory}
                      disabled={saving || !newCategoryName.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Lista de Categorias */}
                <div className="space-y-3">
                  <h3 className="font-medium">Categorias Existentes</h3>
                  {categories.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Nenhuma categoria criada ainda
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categories.map(category => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-white"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${
                              AVAILABLE_COLORS.find(c => c.value === category.color)?.class || 'bg-gray-500'
                            }`} />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingCategory(category.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Notificação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações Push</Label>
                      <p className="text-sm text-gray-500">Receber notificações no navegador</p>
                    </div>
                    <Switch
                      checked={settings.notifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Lembretes por Email</Label>
                      <p className="text-sm text-gray-500">Receber lembretes importantes por email</p>
                    </div>
                    <Switch
                      checked={settings.emailReminders}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailReminders: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Som de Notificação</Label>
                      <p className="text-sm text-gray-500">Tocar som ao receber notificações</p>
                    </div>
                    <Switch defaultChecked />
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
