import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// VAPID Public Key gerada para WorldRental
const VAPID_PUBLIC_KEY = 'BDt2hT6Ec-UakV-tAoO7ka2TrwcSXopaQzqXokawxm4xtPbj8YenBDYUcI2XOmtleMb8y732w25PLD3lzUekoHI'

interface NotificationPermission {
  permission: NotificationPermission | null
  isSupported: boolean
  isEnabled: boolean
  token: string | null
  error: string | null
}

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  data?: any
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationPermission>({
    permission: null,
    isSupported: false,
    isEnabled: false,
    token: null,
    error: null
  })

  // Verificar se notificações são suportadas
  useEffect(() => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    const permission = isSupported ? Notification.permission : null
    
    setState(prev => ({
      ...prev,
      isSupported,
      permission
    }))
  }, [])

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Notificações não são suportadas neste navegador' }))
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      
      setState(prev => ({
        ...prev,
        permission,
        error: null
      }))

      if (permission === 'granted') {
        await registerPushNotifications()
        return true
      } else {
        setState(prev => ({ 
          ...prev, 
          error: 'Permissão para notificações foi negada' 
        }))
        return false
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao solicitar permissão para notificações' 
      }))
      return false
    }
  }, [state.isSupported])

  // Registrar notificações push
  const registerPushNotifications = useCallback(async (): Promise<boolean> => {
    try {
      // Registrar service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registrado:', registration)

      // Aguardar o service worker estar ativo
      await navigator.serviceWorker.ready
      console.log('Service Worker está pronto')

      // Verificar se já existe uma subscription
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Criar nova subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })
      }

      console.log('Push subscription:', subscription)

      // Salvar token no banco de dados
      await saveTokenToDatabase(subscription)

      setState(prev => ({
        ...prev,
        token: JSON.stringify(subscription),
        isEnabled: true,
        error: null
      }))

      return true
    } catch (error) {
      console.error('Erro ao registrar push notifications:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao registrar notificações push' 
      }))
      return false
    }
  }, [])

  // Salvar token no banco de dados
  const saveTokenToDatabase = useCallback(async (subscription: PushSubscription): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Primeiro, desativar tokens antigos do usuário
      await supabase
        .from('user_push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)

      // Inserir novo token
      const { error } = await supabase
        .from('user_push_tokens')
        .insert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          is_active: true
        })

      if (error) {
        throw error
      }

      console.log('Token salvo no banco de dados')
    } catch (error) {
      console.error('Erro ao salvar token:', error)
      throw error
    }
  }, [])

  // Remover notificações
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      
      if (registration) {
        const subscription = await registration.pushManager.getSubscription()
        
        if (subscription) {
          await subscription.unsubscribe()
        }
      }

      // Desativar token no banco de dados
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase
          .from('user_push_tokens')
          .update({ is_active: false })
          .eq('user_id', user.id)
      }

      setState(prev => ({
        ...prev,
        token: null,
        isEnabled: false,
        error: null
      }))

      return true
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao cancelar notificações' 
      }))
      return false
    }
  }, [])

  // Enviar notificação local (para testes)
  const sendLocalNotification = useCallback((options: NotificationOptions): void => {
    if (state.permission === 'granted') {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/badge-72x72.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        actions: options.actions,
        data: options.data
      })
    }
  }, [state.permission])

  // Converter VAPID key para Uint8Array
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Verificar status atual
  const checkStatus = useCallback(async (): Promise<void> => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      
      if (registration) {
        const subscription = await registration.pushManager.getSubscription()
        
        setState(prev => ({
          ...prev,
          token: subscription ? JSON.stringify(subscription) : null,
          isEnabled: !!subscription
        }))
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    }
  }, [])

  return {
    ...state,
    requestPermission,
    unsubscribe,
    sendLocalNotification,
    checkStatus
  }
}