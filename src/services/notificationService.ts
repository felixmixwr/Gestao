import { supabase } from '../lib/supabase'

interface SendNotificationParams {
  userId: string
  title: string
  body: string
  data?: any
  url?: string
}

export const notificationService = {
  // Enviar notificação push para um usuário específico
  async sendPushNotification({ userId, title, body, data, url }: SendNotificationParams) {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-notification', {
        body: {
          userId,
          title,
          body,
          data,
          url
        }
      })

      if (error) {
        console.error('Erro ao enviar notificação:', error)
        throw error
      }

      return result
    } catch (error) {
      console.error('Erro no serviço de notificação:', error)
      throw error
    }
  },

  // Enviar notificação para múltiplos usuários
  async sendBulkNotification(userIds: string[], title: string, body: string, data?: any, url?: string) {
    try {
      const promises = userIds.map(userId => 
        this.sendPushNotification({ userId, title, body, data, url })
      )

      const results = await Promise.allSettled(promises)
      
      return {
        success: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        results
      }
    } catch (error) {
      console.error('Erro ao enviar notificações em lote:', error)
      throw error
    }
  },

  // Enviar notificação para todos os usuários ativos
  async sendNotificationToAllUsers(title: string, body: string, data?: any, url?: string) {
    try {
      // Buscar todos os usuários que têm tokens ativos
      const { data: tokens, error } = await supabase
        .from('user_push_tokens')
        .select('user_id')
        .eq('is_active', true)

      if (error) {
        throw error
      }

      // Extrair IDs únicos de usuários
      const userIds = [...new Set(tokens.map(token => token.user_id))]

      return await this.sendBulkNotification(userIds, title, body, data, url)
    } catch (error) {
      console.error('Erro ao enviar notificação para todos os usuários:', error)
      throw error
    }
  },

  // Obter histórico de notificações de um usuário
  async getUserNotificationHistory(userId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar histórico de notificações:', error)
      throw error
    }
  },

  // Marcar notificação como clicada
  async markNotificationAsClicked(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notification_logs')
        .update({ 
          clicked: true,
          status: 'clicked'
        })
        .eq('id', notificationId)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Erro ao marcar notificação como clicada:', error)
      throw error
    }
  }
}