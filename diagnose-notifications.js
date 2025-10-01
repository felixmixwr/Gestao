// Script de diagnóstico completo para notificações push
// Execute este script no console do navegador

console.log('🔍 DIAGNÓSTICO COMPLETO DE NOTIFICAÇÕES PUSH')
console.log('=' .repeat(50))

// 1. Verificar APIs disponíveis
console.log('\n📱 1. VERIFICAÇÃO DE APIs:')
console.log('- Service Worker:', 'serviceWorker' in navigator)
console.log('- Push Manager:', 'PushManager' in window)
console.log('- Notifications:', 'Notification' in window)
console.log('- Permissão atual:', Notification.permission)

// 2. Verificar Service Worker
console.log('\n🔧 2. SERVICE WORKER:')
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('- Registros ativos:', registrations.length)
  registrations.forEach((reg, index) => {
    console.log(`  ${index + 1}. Scope: ${reg.scope}`)
    console.log(`     Ativo: ${reg.active ? 'Sim' : 'Não'}`)
  })
})

// 3. Verificar Manifest
console.log('\n📄 3. MANIFEST:')
fetch('/manifest.json')
  .then(response => response.json())
  .then(manifest => {
    console.log('- Nome:', manifest.name)
    console.log('- GCM Sender ID:', manifest.gcm_sender_id)
    console.log('- Permissões:', manifest.permissions)
  })
  .catch(error => console.error('❌ Erro ao carregar manifest:', error))

// 4. Verificar VAPID Key
console.log('\n🔑 4. VAPID KEY:')
const VAPID_PUBLIC_KEY = 'BBNAVQi46g1rgjQ2nF9kkDt--WPXzFFVIhQm5D9UvAGlAfO1sCORVCnd6MFpEABZvy0PuyECaXL-WxAzuILcnpA'
console.log('- Chave:', VAPID_PUBLIC_KEY)
console.log('- Tamanho:', VAPID_PUBLIC_KEY.length)

// 5. Testar conversão VAPID
try {
  const padding = '='.repeat((4 - VAPID_PUBLIC_KEY.length % 4) % 4)
  const base64 = (VAPID_PUBLIC_KEY + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const keyArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    keyArray[i] = rawData.charCodeAt(i)
  }
  
  console.log('- Conversão: OK')
  console.log('- Tamanho array:', keyArray.length)
} catch (error) {
  console.error('- Conversão: ERRO', error.message)
}

// 6. Verificar cache
console.log('\n💾 5. CACHE:')
caches.keys().then(cacheNames => {
  console.log('- Caches encontrados:', cacheNames.length)
  cacheNames.forEach(name => console.log(`  - ${name}`))
})

// 7. Testar registro de notificação
console.log('\n🧪 6. TESTE DE REGISTRO:')
if ('serviceWorker' in navigator && 'PushManager' in window) {
  navigator.serviceWorker.ready.then(registration => {
    console.log('- Service Worker pronto: OK')
    
    registration.pushManager.getSubscription().then(subscription => {
      if (subscription) {
        console.log('- Subscription existente: OK')
        console.log('- Endpoint:', subscription.endpoint.substring(0, 50) + '...')
      } else {
        console.log('- Subscription existente: NENHUMA')
        console.log('🔄 Tentando criar nova subscription...')
        
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
        
        // Tentar criar subscription
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        }).then(newSubscription => {
          console.log('✅ Nova subscription criada com sucesso!')
          console.log('- Endpoint:', newSubscription.endpoint.substring(0, 50) + '...')
        }).catch(error => {
          console.error('❌ Erro ao criar subscription:', error.message)
          
          // Tentar sem applicationServerKey
          console.log('🔄 Tentando sem applicationServerKey...')
          registration.pushManager.subscribe({
            userVisibleOnly: true
          }).then(gcmSubscription => {
            console.log('✅ Subscription GCM criada com sucesso!')
            console.log('- Endpoint:', gcmSubscription.endpoint.substring(0, 50) + '...')
          }).catch(gcmError => {
            console.error('❌ Erro também com GCM:', gcmError.message)
          })
        })
      }
    })
  })
} else {
  console.error('❌ APIs necessárias não disponíveis')
}

console.log('\n🎯 DIAGNÓSTICO CONCLUÍDO!')
console.log('Verifique os resultados acima para identificar problemas.')
