import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  data?: any
}

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { title, body, icon, badge, url, data, userId, userGroup } = await req.json()

    // Validação básica
    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let subscriptions: PushSubscription[] = []

    if (userId) {
      // Busca subscription específica do usuário
      const { data: userSubscriptions, error } = await supabaseClient
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching user subscriptions:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch user subscriptions' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      subscriptions = userSubscriptions?.map(sub => sub.subscription) || []
    } else if (userGroup) {
      // Busca subscriptions de um grupo de usuários
      const { data: groupSubscriptions, error } = await supabaseClient
        .from('push_subscriptions')
        .select('subscription')
        .in('user_id', userGroup)

      if (error) {
        console.error('Error fetching group subscriptions:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch group subscriptions' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      subscriptions = groupSubscriptions?.map(sub => sub.subscription) || []
    } else {
      // Busca todas as subscriptions (para notificações globais)
      const { data: allSubscriptions, error } = await supabaseClient
        .from('push_subscriptions')
        .select('subscription')

      if (error) {
        console.error('Error fetching all subscriptions:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch subscriptions' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      subscriptions = allSubscriptions?.map(sub => sub.subscription) || []
    }

    if (subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepara payload da notificação
    const notificationPayload: NotificationPayload = {
      title,
      body,
      icon: icon || '/icons/notification.png',
      badge: badge || '/icons/badge.png',
      url: url || '/',
      data: data || {}
    }

    // Envia notificações para todas as subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const response = await fetch(subscription.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
            },
            body: JSON.stringify({
              notification: notificationPayload,
              to: subscription.endpoint,
            }),
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          return { success: true, subscription: subscription.endpoint }
        } catch (error) {
          console.error('Error sending notification:', error)
          return { success: false, subscription: subscription.endpoint, error: error.message }
        }
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    return new Response(
      JSON.stringify({
        message: `Notifications sent: ${successful} successful, ${failed} failed`,
        successful,
        failed,
        total: subscriptions.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
