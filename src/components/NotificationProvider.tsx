import React, { useEffect } from 'react'
import { notificationService } from '../services/notificationService'

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  useEffect(() => {
    // Inicializar o serviço de notificações
    const initializeNotifications = async () => {
      try {
        await notificationService.initialize()
        console.log('Sistema de notificações inicializado')
      } catch (error) {
        console.error('Erro ao inicializar notificações:', error)
      }
    }

    initializeNotifications()

    // Cleanup ao desmontar
    return () => {
      console.log('NotificationProvider desmontado')
    }
  }, [])

  return <>{children}</>
}


