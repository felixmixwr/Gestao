import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Verifica se o navegador suporta notificações
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  // Solicita permissão para notificações
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notificações push não são suportadas neste navegador')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      return false
    }
  }, [isSupported])

  // Registra subscription para push notifications
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Permissão não concedida ou navegador não suporta push notifications')
      return false
    }

    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY
      })

      const subscriptionData: PushSubscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!)
        }
      }

      setSubscription(subscriptionData)

      // Salva subscription no Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            subscription: subscriptionData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('Erro ao salvar subscription:', error)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Erro ao registrar push subscription:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, permission])

  // Remove subscription
  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false

    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const pushSubscription = await registration.pushManager.getSubscription()
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe()
      }

      // Remove do Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
      }

      setSubscription(null)
      return true
    } catch (error) {
      console.error('Erro ao remover subscription:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [subscription])

  // Envia notificação local (para testes)
  const sendLocalNotification = useCallback((payload: NotificationPayload) => {
    if (permission !== 'granted') return

    const notification = new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/notification.png',
      badge: payload.badge || '/icons/badge.png',
      data: payload.data,
      requireInteraction: true
    })

    notification.onclick = () => {
      window.focus()
      if (payload.url) {
        window.location.href = payload.url
      }
      notification.close()
    }
  }, [permission])

  // Inicializa o sistema de notificações
  const initializeNotifications = useCallback(async () => {
    if (!isSupported) return false

    const hasPermission = await requestPermission()
    if (!hasPermission) return false

    return await subscribeToPush()
  }, [isSupported, requestPermission, subscribeToPush])

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendLocalNotification,
    initializeNotifications
  }
}

// Função auxiliar para converter ArrayBuffer para Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
