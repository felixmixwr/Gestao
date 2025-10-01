// Script para registrar push notification manualmente
// Execute este script no console do navegador

console.log('🚀 REGISTRO MANUAL DE PUSH NOTIFICATION')
console.log('=' .repeat(50))

async function registerPushManual() {
  try {
    // 1. Verificar permissão
    console.log('📱 Verificando permissão...')
    let permission = Notification.permission
    console.log('Permissão atual:', permission)
    
    if (permission === 'default') {
      console.log('🔔 Solicitando permissão...')
      permission = await Notification.requestPermission()
      console.log('Nova permissão:', permission)
    }
    
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada pelo usuário')
    }
    
    // 2. Registrar Service Worker
    console.log('📝 Registrando Service Worker...')
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('✅ Service Worker registrado:', registration.scope)
    
    // 3. Aguardar o Service Worker estar ativo
    console.log('⏳ Aguardando Service Worker ficar ativo...')
    await navigator.serviceWorker.ready
    console.log('✅ Service Worker ativo')
    
    // 4. Verificar se PushManager está disponível
    if (!registration.pushManager) {
      throw new Error('PushManager não está disponível neste navegador')
    }
    
    console.log('✅ PushManager disponível')
    
    // 5. Verificar subscription existente
    let subscription = await registration.pushManager.getSubscription()
    console.log('Subscription existente:', subscription ? 'Sim' : 'Não')
    
    if (subscription) {
      console.log('📊 Subscription existente:')
      console.log('- Endpoint:', subscription.endpoint.substring(0, 50) + '...')
      console.log('- P256DH:', subscription.getKey('p256dh') ? 'Presente' : 'Ausente')
      console.log('- Auth:', subscription.getKey('auth') ? 'Presente' : 'Ausente')
    } else {
      console.log('🔄 Criando nova subscription...')
      
      // VAPID Key
      const VAPID_PUBLIC_KEY = 'BBNAVQi46g1rgjQ2nF9kkDt--WPXzFFVIhQm5D9UvAGlAfO1sCORVCnd6MFpEABZvy0PuyECaXL-WxAzuILcnpA'
      
      // Função para converter VAPID
      function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
        const rawData = atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
      }
      
      try {
        // Tentar criar subscription com VAPID
        console.log('🔑 Tentando com VAPID key...')
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })
        console.log('✅ Subscription criada com VAPID!')
        
      } catch (vapidError) {
        console.warn('⚠️ Erro com VAPID:', vapidError.message)
        
        try {
          // Tentar sem applicationServerKey
          console.log('🔄 Tentando sem VAPID (GCM)...')
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true
          })
          console.log('✅ Subscription criada com GCM!')
          
        } catch (gcmError) {
          console.error('❌ Erro com GCM também:', gcmError.message)
          throw gcmError
        }
      }
    }
    
    // 6. Converter subscription para JSON
    const subscriptionJson = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))) : null,
        auth: subscription.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))) : null
      }
    }
    
    console.log('📋 Subscription JSON:')
    console.log(JSON.stringify(subscriptionJson, null, 2))
    
    // 7. Salvar no Supabase
    console.log('💾 Salvando subscription no Supabase...')
    
    // Supabase client (você precisa ter o supabase disponível no window)
    if (window.supabase) {
      try {
        // Buscar usuário atual
        const { data: { user }, error: userError } = await window.supabase.auth.getUser()
        
        if (userError) {
          throw new Error('Erro ao buscar usuário: ' + userError.message)
        }
        
        if (!user) {
          throw new Error('Usuário não autenticado')
        }
        
        console.log('👤 Usuário autenticado:', user.id)
        
        // Desativar tokens antigos
        await window.supabase
          .from('user_push_tokens')
          .update({ is_active: false })
          .eq('user_id', user.id)
        
        // Inserir novo token
        const { error: insertError } = await window.supabase
          .from('user_push_tokens')
          .insert({
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh: subscriptionJson.keys.p256dh,
            auth: subscriptionJson.keys.auth,
            is_active: true
          })
        
        if (insertError) {
          throw new Error('Erro ao salvar token: ' + insertError.message)
        }
        
        console.log('✅ Token salvo no banco de dados!')
        
      } catch (supabaseError) {
        console.error('❌ Erro ao salvar no Supabase:', supabaseError.message)
        console.log('📋 Use este JSON para salvar manualmente:')
        console.log(JSON.stringify(subscriptionJson, null, 2))
      }
    } else {
      console.warn('⚠️ Supabase client não disponível no window')
      console.log('📋 Use este JSON para salvar manualmente:')
      console.log(JSON.stringify(subscriptionJson, null, 2))
    }
    
    // 8. Testar notificação
    console.log('🧪 Testando notificação...')
    await registration.showNotification('Push Notification Teste', {
      body: 'Se você está vendo isso, o push está funcionando!',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'manual-test'
    })
    
    console.log('✅ Notificação de teste enviada!')
    
    return subscriptionJson
    
  } catch (error) {
    console.error('❌ Erro no registro manual:', error.message)
    console.error('🔍 Detalhes:', error)
    throw error
  }
}

// Executar
registerPushManual().then(result => {
  console.log('🎉 REGISTRO MANUAL CONCLUÍDO!')
  console.log('📱 Resultado:', result)
}).catch(error => {
  console.error('💥 Falha no registro manual:', error)
})
