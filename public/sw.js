// Service Worker para notificações push
const CACHE_NAME = 'felix-mix-v1'
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
]

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto')
        return cache.addAll(urlsToCache)
      })
  )
})

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se encontrado, senão faz a requisição
        return response || fetch(event.request)
      })
  )
})

// Configuração de notificações push
self.addEventListener('push', (event) => {
  console.log('Push event recebido:', event)

  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = {
        title: 'Felix Mix',
        body: event.data.text() || 'Nova notificação',
        icon: '/icons/notification.png',
        badge: '/icons/badge.png',
        url: '/'
      }
    }
  }

  const options = {
    body: data.body || 'Nova notificação',
    icon: data.icon || '/icons/notification.png',
    badge: data.badge || '/icons/badge.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icons/open.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/close.png'
      }
    ],
    requireInteraction: true,
    silent: false
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Felix Mix', options)
  )
})

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event)

  event.notification.close()

  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/'
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Verifica se já existe uma janela aberta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        
        // Se não há janela aberta, abre uma nova
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
    )
  }
})

// Background sync para notificações offline
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag)
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Aqui você pode implementar lógica para sincronizar notificações
      // quando o dispositivo voltar a ter conexão
      Promise.resolve()
    )
  }
})

// Mensagens do cliente principal
self.addEventListener('message', (event) => {
  console.log('Mensagem recebida no service worker:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
