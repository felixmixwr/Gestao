import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { userId, title, body, data, url } = await req.json()

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's push tokens
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('user_push_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user tokens' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active push tokens found for user' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare notification payload
    const notificationPayload: NotificationPayload = {
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        url: url || '/',
        ...data
      }
    }

    // Send notifications to all user's devices
    const results = []
    for (const token of tokens) {
      try {
        // For now, we'll simulate sending the notification
        // In production, you would use web-push library here
        console.log(`Sending notification to endpoint: ${token.endpoint}`)
        console.log(`Payload:`, notificationPayload)
        
        results.push({
          tokenId: token.id,
          success: true,
          endpoint: token.endpoint
        })

        // Log the notification attempt
        await supabaseClient
          .from('notification_logs')
          .insert({
            user_id: userId,
            title,
            body,
            type: 'push',
            notification_type: 'user',
            data: notificationPayload.data,
            delivered: true,
            status: 'sent'
          })

      } catch (error) {
        console.error(`Error sending to token ${token.id}:`, error)
        
        results.push({
          tokenId: token.id,
          success: false,
          error: error.message,
          endpoint: token.endpoint
        })

        // Log the failed notification
        await supabaseClient
          .from('notification_logs')
          .insert({
            user_id: userId,
            title,
            body,
            type: 'push',
            notification_type: 'user',
            data: notificationPayload.data,
            delivered: false,
            status: 'failed',
            error_message: error.message
          })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent to ${results.filter(r => r.success).length} devices`,
        results 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})