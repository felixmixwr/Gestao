import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Bell, Send, Users, User } from 'lucide-react'
import { notificationService } from '../services/notificationService'
import { toast } from 'sonner'
import { useNotifications } from '../hooks/useNotifications'

export const NotificationTestPanel: React.FC = () => {
  const [title, setTitle] = useState('Teste de Notificação')
  const [body, setBody] = useState('Esta é uma notificação de teste do sistema WorldRental!')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { isEnabled } = useNotifications()

  const handleSendToUser = async () => {
    if (!userId.trim()) {
      toast.error('Digite o ID do usuário')
      return
    }

    setLoading(true)
    try {
      await notificationService.sendPushNotification({
        userId: userId.trim(),
        title,
        body,
        data: { type: 'test', timestamp: Date.now() },
        url: '/dashboard'
      })
      toast.success('Notificação enviada com sucesso!')
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
      toast.error('Erro ao enviar notificação')
    } finally {
      setLoading(false)
    }
  }

  const handleSendToAll = async () => {
    setLoading(true)
    try {
      const result = await notificationService.sendNotificationToAllUsers(
        title,
        body,
        { type: 'test', timestamp: Date.now() },
        '/dashboard'
      )
      toast.success(`Notificação enviada para ${result.success} usuários!`)
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
      toast.error('Erro ao enviar notificação')
    } finally {
      setLoading(false)
    }
  }

  if (!isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Teste de Notificações
          </CardTitle>
          <CardDescription>
            Ative as notificações primeiro para testar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Notificações não estão ativas</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Teste de Notificações Push
        </CardTitle>
        <CardDescription>
          Teste o sistema de notificações enviando mensagens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o título da notificação"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Mensagem</Label>
          <Input
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Digite a mensagem"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="userId">ID do Usuário (opcional)</Label>
          <Input
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="UUID do usuário para teste específico"
          />
          <p className="text-xs text-gray-500">
            Deixe vazio para enviar para todos os usuários
          </p>
        </div>

        <div className="flex gap-2">
          {userId.trim() ? (
            <Button
              onClick={handleSendToUser}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              {loading ? 'Enviando...' : 'Enviar para Usuário'}
            </Button>
          ) : (
            <Button
              onClick={handleSendToAll}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              {loading ? 'Enviando...' : 'Enviar para Todos'}
            </Button>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Send className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Como funciona:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>As notificações são enviadas via Supabase Edge Functions</li>
                <li>Funciona apenas para usuários com tokens ativos</li>
                <li>As notificações aparecem mesmo com o app fechado</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
