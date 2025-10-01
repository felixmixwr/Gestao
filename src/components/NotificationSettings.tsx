import React, { useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { Button } from './ui/button'
import { Bell, BellOff, Settings, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface NotificationSettingsProps {
  className?: string
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className = '' }) => {
  const {
    isSupported,
    permission,
    isEnabled,
    error,
    requestPermission,
    unsubscribe,
    sendLocalNotification,
    checkStatus
  } = useNotifications()

  // Verificar status das notificações ao carregar
  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  // Mostrar erro se houver
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const handleEnableNotifications = async () => {
    const success = await requestPermission()
    if (success) {
      toast.success('Notificações ativadas com sucesso!')
    }
  }

  const handleDisableNotifications = async () => {
    const success = await unsubscribe()
    if (success) {
      toast.success('Notificações desativadas')
    }
  }

  const handleTestNotification = () => {
    sendLocalNotification({
      title: 'WorldRental - Teste',
      body: 'Esta é uma notificação de teste do sistema!',
      icon: '/icon-192x192.png',
      tag: 'test-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Abrir App'
        },
        {
          action: 'close',
          title: 'Fechar'
        }
      ]
    })
  }

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Notificações não suportadas</span>
      </div>
    )
  }

  const getPermissionText = () => {
    switch (permission) {
      case 'granted':
        return 'Permitidas'
      case 'denied':
        return 'Negadas'
      case 'default':
        return 'Não solicitadas'
      default:
        return 'Desconhecido'
    }
  }

  const getPermissionColor = () => {
    switch (permission) {
      case 'granted':
        return 'text-green-600'
      case 'denied':
        return 'text-red-600'
      case 'default':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <span className="font-medium">Notificações Push</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`text-sm ${getPermissionColor()}`}>
            {getPermissionText()}
          </span>
          {isEnabled && (
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p>Receba notificações sobre:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Novas manutenções agendadas</li>
          <li>Lembretes de manutenção preventiva</li>
          <li>Abastecimentos registrados</li>
          <li>Investimentos em bombas</li>
        </ul>
      </div>

      <div className="flex gap-2">
        {permission === 'granted' && !isEnabled && (
          <Button
            onClick={handleEnableNotifications}
            size="sm"
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Ativar Notificações
          </Button>
        )}

        {permission === 'default' && (
          <Button
            onClick={handleEnableNotifications}
            size="sm"
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Solicitar Permissão
          </Button>
        )}

        {permission === 'denied' && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <BellOff className="w-4 h-4" />
            <span>Permissão negada. Ative nas configurações do navegador.</span>
          </div>
        )}

        {isEnabled && (
          <>
            <Button
              onClick={handleTestNotification}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Testar
            </Button>
            
            <Button
              onClick={handleDisableNotifications}
              size="sm"
              variant="destructive"
              className="flex items-center gap-2"
            >
              <BellOff className="w-4 h-4" />
              Desativar
            </Button>
          </>
        )}
      </div>

      {permission === 'denied' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Como ativar notificações:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Clique no ícone de cadeado/escudo na barra de endereços</li>
                <li>Selecione "Permitir" em Notificações</li>
                <li>Recarregue a página</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


