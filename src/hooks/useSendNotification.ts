import { useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface NotificationData {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  data?: any
}

interface SendNotificationOptions {
  userId?: string
  userGroup?: string[]
  notification: NotificationData
}

export function useSendNotification() {
  const sendNotification = useCallback(async (options: SendNotificationOptions) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: options
      })

      if (error) {
        console.error('Erro ao enviar notificação:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
      return { success: false, error: error.message }
    }
  }, [])

  // Funções específicas para diferentes tipos de notificação
  const sendProgramacaoNotification = useCallback(async (programacaoData: any) => {
    return sendNotification({
      notification: {
        title: 'Programação confirmada',
        body: `Nova programação criada para ${programacaoData.cliente || 'cliente'}`,
        icon: '/icons/calendar.png',
        url: '/programacao',
        data: { type: 'programacao', id: programacaoData.id }
      }
    })
  }, [sendNotification])

  const sendReportNotification = useCallback(async (reportData: any) => {
    return sendNotification({
      notification: {
        title: 'Relatório adicionado',
        body: `Novo relatório: ${reportData.titulo || 'Relatório sem título'}`,
        icon: '/icons/report.png',
        url: '/reports',
        data: { type: 'report', id: reportData.id }
      }
    })
  }, [sendNotification])

  const sendFinanceiroNotification = useCallback(async (financeiroData: any) => {
    return sendNotification({
      notification: {
        title: 'Atualização financeira',
        body: `Nova movimentação financeira: ${financeiroData.descricao || 'Movimentação'}`,
        icon: '/icons/money.png',
        url: '/pagamentos-receber',
        data: { type: 'financeiro', id: financeiroData.id }
      }
    })
  }, [sendNotification])

  const sendBombaNotification = useCallback(async (bombaData: any) => {
    return sendNotification({
      notification: {
        title: 'Atualização de bomba',
        body: `Status da bomba atualizado: ${bombaData.nome || 'Bomba'}`,
        icon: '/icons/pump.png',
        url: '/pumps',
        data: { type: 'bomba', id: bombaData.id }
      }
    })
  }, [sendNotification])

  return {
    sendNotification,
    sendProgramacaoNotification,
    sendReportNotification,
    sendFinanceiroNotification,
    sendBombaNotification
  }
}
