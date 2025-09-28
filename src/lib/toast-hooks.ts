import { useContext } from 'react'
import { ToastContext } from './toast'

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Convenience functions
export const toast = {
  success: (message: string) => {
    // Esta função será implementada quando o ToastProvider estiver disponível
    console.log('Toast success:', message)
  },
  error: (message: string) => {
    // Esta função será implementada quando o ToastProvider estiver disponível
    console.log('Toast error:', message)
  },
  info: (message: string) => {
    // Esta função será implementada quando o ToastProvider estiver disponível
    console.log('Toast info:', message)
  },
  warning: (message: string) => {
    // Esta função será implementada quando o ToastProvider estiver disponível
    console.log('Toast warning:', message)
  }
}
