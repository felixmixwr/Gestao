// Abordagem alternativa para push notifications
// Execute este script no console do navegador

console.log('🔄 ABORDAGEM ALTERNATIVA PARA PUSH NOTIFICATIONS')
console.log('=' .repeat(50))

async function alternativePushSetup() {
  try {
    // 1. Verificar permissão
    let permission = Notification.permission
    console.log('📱 Permissão atual:', permission)
    
    if (permission === 'default') {
      console.log('🔔 Solicitando permissão...')
      permission = await Notification.requestPermission()
      console.log('📱 Nova permissão:', permission)
    }
    
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação negada')
    }
    
    // 2. Registrar Service Worker simples
    console.log('📝 Registrando Service Worker...')
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('✅ Service Worker registrado')
    
    // 3. Aguardar ativação
    await navigator.serviceWorker.ready
    console.log('✅ Service Worker ativo')
    
    // 4. Verificar se PushManager está disponível
    if (!registration.pushManager) {
      throw new Error('PushManager não disponível')
    }
    
    console.log('✅ PushManager disponível')
    
    // 5. Tentar diferentes abordagens para subscription
    let subscription = null
    
    // Abordagem 1: VAPID
    try {
      console.log('🔄 Tentativa 1: VAPID Key...')
      const VAPID_PUBLIC_KEY = 'BBNAVQi46g1rgjQ2nF9kkDt--WPXzFFVIhQm5D9UvAGlAfO1sCORVCnd6MFpEABZvy0PuyECaXL-WxAzuILcnpA'
      
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
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
      console.log('✅ Sucesso com VAPID!')
      
    } catch (vapidError) {
      console.warn('⚠️ Falha com VAPID:', vapidError.message)
      
      // Abordagem 2: GCM simples
      try {
        console.log('🔄 Tentativa 2: GCM simples...')
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true
        })
        console.log('✅ Sucesso com GCM!')
        
      } catch (gcmError) {
        console.warn('⚠️ Falha com GCM:', gcmError.message)
        
        // Abordagem 3: Verificar subscription existente
        try {
          console.log('🔄 Tentativa 3: Subscription existente...')
          subscription = await registration.pushManager.getSubscription()
          
          if (subscription) {
            console.log('✅ Usando subscription existente!')
          } else {
            throw new Error('Nenhuma subscription disponível')
          }
          
        } catch (existingError) {
          console.error('❌ Todas as abordagens falharam:', existingError.message)
          throw existingError
        }
      }
    }
    
    if (subscription) {
      console.log('🎉 SUBSCRIPTION CRIADA COM SUCESSO!')
      console.log('📊 Detalhes:')
      console.log('- Endpoint:', subscription.endpoint.substring(0, 50) + '...')
      console.log('- P256DH:', subscription.getKey('p256dh') ? 'Presente' : 'Ausente')
      console.log('- Auth:', subscription.getKey('auth') ? 'Presente' : 'Ausente')
      
      // Testar notificação
      console.log('🧪 Testando notificação...')
      await registration.showNotification('Teste Push', {
        body: 'Notificação de teste funcionando!',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png'
      })
      
      console.log('✅ NOTIFICAÇÃO TESTE ENVIADA!')
      
      return subscription
    } else {
      throw new Error('Não foi possível criar subscription')
    }
    
  } catch (error) {
    console.error('❌ Erro na configuração alternativa:', error.message)
    console.error('🔍 Detalhes:', error)
    throw error
  }
}

// Executar
alternativePushSetup().then(result => {
  console.log('🎉 CONFIGURAÇÃO ALTERNATIVA CONCLUÍDA!')
  console.log('📱 Resultado:', result)
}).catch(error => {
  console.error('💥 Falha na configuração alternativa:', error)
})
