import React, { useEffect, useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { supabase } from '../lib/supabase'

interface NotificationContextProps {
  notifications: { [key: string]: number }
  clearNotification: (tabName: string) => void
}

interface NotificationManagerProps {
  children: (props: NotificationContextProps) => React.ReactNode
}

export function NotificationManager({ children }: NotificationManagerProps) {
  const { initializeNotifications, isSupported } = useNotifications()
  const [notifications, setNotifications] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    // Inicializa notificações quando o componente monta
    if (isSupported) {
      initializeNotifications()
    }
  }, [isSupported, initializeNotifications])

  useEffect(() => {
    // Escuta mudanças nas tabelas para atualizar contadores de notificação
    const setupRealtimeSubscriptions = () => {
      // Subscription para programação
      const programacaoSubscription = supabase
        .channel('programacao_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'programacao'
        }, (payload) => {
          console.log('Nova programação:', payload)
          setNotifications(prev => ({
            ...prev,
            'Programação': (prev['Programação'] || 0) + 1
          }))
        })
        .subscribe()

      // Subscription para relatórios
      const reportsSubscription = supabase
        .channel('reports_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'reports'
        }, (payload) => {
          console.log('Novo relatório:', payload)
          setNotifications(prev => ({
            ...prev,
            'Relatórios': (prev['Relatórios'] || 0) + 1
          }))
        })
        .subscribe()

      // Subscription para pagamentos
      const pagamentosSubscription = supabase
        .channel('pagamentos_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'pagamentos_receber'
        }, (payload) => {
          console.log('Novo pagamento:', payload)
          setNotifications(prev => ({
            ...prev,
            'Financeiro': (prev['Financeiro'] || 0) + 1
          }))
        })
        .subscribe()

      return () => {
        programacaoSubscription.unsubscribe()
        reportsSubscription.unsubscribe()
        pagamentosSubscription.unsubscribe()
      }
    }

    const cleanup = setupRealtimeSubscriptions()
    return cleanup
  }, [])

  // Função para limpar notificações de uma aba específica
  const clearNotification = (tabName: string) => {
    setNotifications(prev => ({
      ...prev,
      [tabName]: 0
    }))
  }

  // Passa as notificações para os componentes filhos
  return (
    <div className="notification-context">
      {children({ notifications, clearNotification })}
    </div>
  )
}
