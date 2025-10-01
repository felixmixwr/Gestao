// Script para forçar registro de push notifications
// Execute este script no console do navegador

console.log('🚀 FORÇANDO REGISTRO DE PUSH NOTIFICATIONS')
console.log('=' .repeat(50))

async function forcePushRegistration() {
  try {
    // 1. Verificar se as APIs estão disponíveis
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker não suportado')
    }
    
    if (!('PushManager' in window)) {
      throw new Error('Push Manager não suportado')
    }
    
    console.log('✅ APIs disponíveis')
    
    // 2. Registrar Service Worker
    console.log('📝 Registrando Service Worker...')
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('✅ Service Worker registrado:', registration.scope)
    
    // 3. Aguardar o Service Worker estar ativo
    await navigator.serviceWorker.ready
    console.log('✅ Service Worker ativo')
    
    // 4. Verificar subscription existente
    let subscription = await registration.pushManager.getSubscription()
    console.log('🔍 Subscription existente:', subscription ? 'Sim' : 'Não')
    
    if (!subscription) {
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
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })
        console.log('✅ Subscription criada com VAPID')
      } catch (vapidError) {
        console.warn('⚠️ Erro com VAPID:', vapidError.message)
        
        try {
          // Tentar sem applicationServerKey
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true
          })
          console.log('✅ Subscription criada sem VAPID (GCM)')
        } catch (gcmError) {
          console.error('❌ Erro também com GCM:', gcmError.message)
          throw gcmError
        }
      }
    }
    
    // 5. Mostrar detalhes da subscription
    console.log('📊 Detalhes da subscription:')
    console.log('- Endpoint:', subscription.endpoint)
    console.log('- Keys:', subscription.getKey('p256dh') ? 'P256DH presente' : 'P256DH ausente')
    console.log('- Auth:', subscription.getKey('auth') ? 'Auth presente' : 'Auth ausente')
    
    // 6. Converter para formato JSON
    const subscriptionJson = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))) : null,
        auth: subscription.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))) : null
      }
    }
    
    console.log('📋 Subscription JSON:')
    console.log(JSON.stringify(subscriptionJson, null, 2))
    
    // 7. Testar notificação local
    console.log('🧪 Testando notificação local...')
    await registration.showNotification('Teste de Notificação', {
      body: 'Se você está vendo isso, as notificações estão funcionando!',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'test-notification'
    })
    
    console.log('🎉 REGISTRO CONCLUÍDO COM SUCESSO!')
    console.log('📱 Agora você deve receber notificações push!')
    
    return subscriptionJson
    
  } catch (error) {
    console.error('❌ Erro no registro:', error.message)
    console.error('🔍 Detalhes:', error)
    throw error
  }
}

// Executar
forcePushRegistration().then(result => {
  console.log('✅ Resultado final:', result)
}).catch(error => {
  console.error('💥 Falha final:', error)
})
