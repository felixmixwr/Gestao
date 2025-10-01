// Script para registrar push notification com JWT
// Execute este script no console do navegador

console.log('🚀 REGISTRO DE PUSH NOTIFICATION COM JWT')
console.log('=' .repeat(50))

async function registerPushJWT() {
  try {
    // 1. Verificar se o Supabase está disponível
    if (!window.supabase) {
      throw new Error('Supabase client não está disponível no window')
    }
    
    console.log('✅ Supabase client disponível')
    
    // 2. Verificar se o usuário está autenticado
    const { data: { user }, error: userError } = await window.supabase.auth.getUser()
    
    if (userError) {
      throw new Error('Erro ao verificar usuário: ' + userError.message)
    }
    
    if (!user) {
      throw new Error('Usuário não está autenticado. Faça login primeiro.')
    }
    
    console.log('👤 Usuário autenticado:', user.id)
    console.log('📧 Email:', user.email)
    
    // 3. Verificar permissão de notificação
    console.log('📱 Verificando permissão de notificação...')
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
    
    // 4. Registrar Service Worker
    console.log('📝 Registrando Service Worker...')
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('✅ Service Worker registrado:', registration.scope)
    
    // 5. Aguardar o Service Worker estar ativo
    console.log('⏳ Aguardando Service Worker ficar ativo...')
    await navigator.serviceWorker.ready
    console.log('✅ Service Worker ativo')
    
    // 6. Verificar subscription existente
    let subscription = await registration.pushManager.getSubscription()
    console.log('Subscription existente:', subscription ? 'Sim' : 'Não')
    
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
    
    // 7. Salvar no banco de dados
    console.log('💾 Salvando subscription no banco de dados...')
    
    // Desativar tokens antigos do usuário
    const { error: updateError } = await window.supabase
      .from('user_push_tokens')
      .update({ is_active: false })
      .eq('user_id', user.id)
    
    if (updateError) {
      console.warn('⚠️ Erro ao desativar tokens antigos:', updateError.message)
    }
    
    // Inserir novo token
    const { error: insertError } = await window.supabase
      .from('user_push_tokens')
      .insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.getKey('p256dh') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))) : null,
        auth: subscription.getKey('auth') ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))) : null,
        is_active: true
      })
    
    if (insertError) {
      throw new Error('Erro ao salvar token no banco: ' + insertError.message)
    }
    
    console.log('✅ Token salvo no banco de dados com sucesso!')
    
    // 8. Verificar se foi salvo
    const { data: savedToken, error: verifyError } = await window.supabase
      .from('user_push_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    
    if (verifyError) {
      console.warn('⚠️ Erro ao verificar token salvo:', verifyError.message)
    } else {
      console.log('✅ Token verificado no banco:', savedToken.id)
    }
    
    // 9. Testar notificação
    console.log('🧪 Testando notificação...')
    await registration.showNotification('Push Notification Teste', {
      body: 'Se você está vendo isso, o push está funcionando!',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'jwt-test'
    })
    
    console.log('✅ Notificação de teste enviada!')
    
    // 10. Testar Edge Function
    console.log('🚀 Testando Edge Function...')
    try {
      const { data: testResult, error: testError } = await window.supabase.functions.invoke('send-notification', {
        body: {
          userIds: [user.id],
          title: 'Teste via Edge Function',
          body: 'Esta notificação foi enviada via Edge Function!',
          data: { type: 'jwt_test' }
        }
      })
      
      if (testError) {
        console.warn('⚠️ Erro na Edge Function:', testError.message)
      } else {
        console.log('✅ Edge Function funcionando:', testResult)
      }
    } catch (edgeError) {
      console.warn('⚠️ Erro ao testar Edge Function:', edgeError.message)
    }
    
    console.log('🎉 REGISTRO JWT CONCLUÍDO COM SUCESSO!')
    
    return {
      userId: user.id,
      subscription: subscription.endpoint,
      saved: true
    }
    
  } catch (error) {
    console.error('❌ Erro no registro JWT:', error.message)
    console.error('🔍 Detalhes:', error)
    throw error
  }
}

// Executar
registerPushJWT().then(result => {
  console.log('🎉 RESULTADO FINAL:', result)
}).catch(error => {
  console.error('💥 Falha no registro JWT:', error)
})
