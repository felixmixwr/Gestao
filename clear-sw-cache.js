// Script para limpar cache do Service Worker
// Execute este script no console do navegador

console.log('🧹 Limpando cache do Service Worker...')

// 1. Desregistrar todos os Service Workers
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  console.log(`📊 Encontrados ${registrations.length} Service Workers`)
  
  for(let registration of registrations) {
    console.log('🗑️ Desregistrando:', registration.scope)
    registration.unregister()
  }
})

// 2. Limpar todos os caches
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    console.log(`📊 Encontrados ${cacheNames.length} caches`)
    
    cacheNames.forEach(function(cacheName) {
      console.log('🗑️ Limpando cache:', cacheName)
      caches.delete(cacheName)
    })
  })
}

// 3. Recarregar a página
setTimeout(() => {
  console.log('🔄 Recarregando página...')
  window.location.reload(true)
}, 2000)

console.log('✅ Cache limpo! A página será recarregada em 2 segundos.')
