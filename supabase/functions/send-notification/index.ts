import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.6'

// Configurar timezone para America/Sao_Paulo
Deno.env.set('TZ', 'America/Sao_Paulo')

// VAPID Keys - substitua pelas suas chaves
const VAPID_PUBLIC_KEY = 'BDt2hT6Ec-UakV-tAoO7ka2TrwcSXopaQzqXokawxm4xtPbj8YenBDYUcI2XOmtleMb8y732w25PLD3lzUekoHI'
const VAPID_PRIVATE_KEY = 'RB7G3TF1XYtizmaQa1lVCmx2dbNoEb3hrg3LukmYFqc'
const VAPID_EMAIL = 'mailto:admin@worldrental.com'

// Configurar webpush
webpush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  data?: any
}

interface SendNotificationRequest {
  user_id?: string
  notification_type: 'maintenance' | 'diesel' | 'investment' | 'general'
  title: string
  body: string
  data?: any
  send_to_all?: boolean
}

serve(async (req) => {
  try {
    // Verificar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { 
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse do body da requisição
    const { 
      user_id, 
      notification_type, 
      title, 
      body, 
      data, 
      send_to_all = false 
    }: SendNotificationRequest = await req.json()

    if (!title || !body || !notification_type) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: title, body, notification_type' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    let users: any[] = []

    if (send_to_all) {
      // Buscar todos os usuários com notificações ativadas
      const { data: allUsers, error: allUsersError } = await supabaseClient
        .from('users')
        .select('id, push_token, notification_preferences')
        .eq('notification_enabled', true)
        .not('push_token', 'is', null)

      if (allUsersError) {
        throw allUsersError
      }

      users = allUsers || []
    } else if (user_id) {
      // Buscar usuário específico
      const { data: user, error: userError } = await supabaseClient
        .from('users')
        .select('id, push_token, notification_preferences')
        .eq('id', user_id)
        .eq('notification_enabled', true)
        .not('push_token', 'is', null)
        .single()

      if (userError) {
        throw userError
      }

      if (user) {
        users = [user]
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Deve fornecer user_id ou send_to_all=true' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (users.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Nenhum usuário encontrado com notificações ativadas',
          sent: 0 
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Preparar payload da notificação
    const payload: NotificationPayload = {
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `worldrental-${notification_type}`,
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Abrir App',
          icon: '/icon-72x72.png'
        },
        {
          action: 'close',
          title: 'Fechar',
          icon: '/icon-72x72.png'
        }
      ],
      data: {
        type: notification_type,
        timestamp: new Date().toISOString(),
        timezone: 'America/Sao_Paulo',
        ...data
      }
    }

    const results = []
    let successCount = 0
    let errorCount = 0

    // Enviar notificação para cada usuário
    for (const user of users) {
      try {
        // Verificar se o usuário quer receber este tipo de notificação
        const preferences = user.notification_preferences || {}
        const notificationKey = `${notification_type}_enabled`
        
        if (preferences[notificationKey] === false) {
          console.log(`Usuário ${user.id} desabilitou notificações do tipo ${notification_type}`)
          continue
        }

        // Parse do token de push
        const subscription = JSON.parse(user.push_token)
        
        // Enviar notificação
        await webpush.sendNotification(subscription, JSON.stringify(payload))
        
        // Log da notificação enviada
        const { error: logError } = await supabaseClient
          .from('notification_logs')
          .insert({
            user_id: user.id,
            notification_type,
            title,
            body,
            data: payload.data,
            delivered: true
          })

        if (logError) {
          console.error('Erro ao salvar log:', logError)
        }

        successCount++
        results.push({
          user_id: user.id,
          status: 'success'
        })

        console.log(`Notificação enviada para usuário ${user.id}`)
      } catch (error) {
        errorCount++
        console.error(`Erro ao enviar notificação para usuário ${user.id}:`, error)

        // Log do erro
        const { error: logError } = await supabaseClient
          .from('notification_logs')
          .insert({
            user_id: user.id,
            notification_type,
            title,
            body,
            data: payload.data,
            delivered: false,
            error_message: error.message
          })

        if (logError) {
          console.error('Erro ao salvar log de erro:', logError)
        }

        results.push({
          user_id: user.id,
          status: 'error',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Notificações processadas',
        sent: successCount,
        errors: errorCount,
        total_users: users.length,
        results
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erro na função send-notification:', error)
    
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

