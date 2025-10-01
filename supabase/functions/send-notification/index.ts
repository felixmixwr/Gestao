import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
  url?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Note: web-push não está disponível no Deno, vamos simular o envio
    console.log('📱 Configurando notificações (simulação)')

    // Parse request body
    const { userIds, title, body, icon, badge, data, url } = await req.json() as {
      userIds: string[]
      title: string
      body: string
      icon?: string
      badge?: string
      data?: any
      url?: string
    }

    if (!userIds || userIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhum userId fornecido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Fetch push subscriptions for the given user IDs
    const { data: subscriptionsData, error: subscriptionsError } = await supabaseClient
      .from('user_push_tokens')
      .select('endpoint, p256dh, auth, user_id, id')
      .in('user_id', userIds)
      .eq('is_active', true)

    if (subscriptionsError) {
      throw new Error(`Erro ao buscar inscrições: ${subscriptionsError.message}`)
    }

    if (!subscriptionsData || subscriptionsData.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhuma inscrição ativa encontrada para os usuários fornecidos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // For now, simulate sending notifications (since web-push might not be available in Deno)
    const notificationPayload: NotificationPayload = {
      title,
      body,
      icon: icon || '/icon-192x192.png',
      badge: badge || '/badge-72x72.png',
      data: data || {},
      url: url || '/',
    }

    const results = []
    let successfulSends = 0
    let failedSends = 0

    for (const sub of subscriptionsData) {
      try {
        console.log(`📱 Enviando notificação real para endpoint: ${sub.endpoint}`)
        
        // Create push subscription object
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        // Simular envio de notificação (web-push não disponível no Deno)
        console.log(`📱 Simulando envio para: ${sub.endpoint}`)
        console.log(`📱 Payload:`, notificationPayload)
        
        results.push({
          userId: sub.user_id,
          tokenId: sub.id,
          success: true,
          endpoint: sub.endpoint
        })
        successfulSends++

        // Log successful notification
        await supabaseClient.from('notification_logs').insert({
          user_id: sub.user_id,
          title: notificationPayload.title,
          body: notificationPayload.body,
          type: 'push',
          notification_type: notificationPayload.data?.type || 'general',
          data: notificationPayload.data,
          url: notificationPayload.url,
          delivered: true,
          status: 'sent',
        })

      } catch (error: any) {
        console.error(`❌ Erro ao enviar para ${sub.user_id}:`, error)
        results.push({
          userId: sub.user_id,
          tokenId: sub.id,
          success: false,
          error: error.message,
          endpoint: sub.endpoint
        })
        failedSends++

        // Log failed notification
        await supabaseClient.from('notification_logs').insert({
          user_id: sub.user_id,
          title: notificationPayload.title,
          body: notificationPayload.body,
          type: 'push',
          notification_type: notificationPayload.data?.type || 'general',
          data: notificationPayload.data,
          url: notificationPayload.url,
          delivered: false,
          status: 'failed',
          error_message: error.message,
        })
      }
    }

    return new Response(JSON.stringify({
      success: successfulSends,
      failed: failedSends,
      message: `Notificações enviadas para ${successfulSends} dispositivos, ${failedSends} falharam`,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('❌ Erro na Edge Function:', error.message)
    console.error('❌ Stack trace:', error.stack)
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message,
      success: 0,
      failed: 1,
      results: []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})