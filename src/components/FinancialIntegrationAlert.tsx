import { useState, useEffect } from 'react'
import { X, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react'
import { formatCurrency } from '../types/pump-advanced'

interface FinancialAlert {
  id: string
  type: 'expense_added' | 'maintenance_cost' | 'diesel_cost' | 'investment_cost'
  title: string
  message: string
  amount: number
  pumpId: string
  pumpPrefix: string
  timestamp: string
  read: boolean
}

interface FinancialIntegrationAlertProps {
  pumpId?: string
  onClose?: () => void
  autoHide?: boolean
}

export function FinancialIntegrationAlert({ 
  pumpId, 
  onClose, 
  autoHide = true 
}: FinancialIntegrationAlertProps) {
  const [, setAlerts] = useState<FinancialAlert[]>([])
  const [showAlert, setShowAlert] = useState(false)
  const [currentAlert, setCurrentAlert] = useState<FinancialAlert | null>(null)

  const handleClose = () => {
    if (currentAlert) {
      // Marcar como lido
      setAlerts(prev => prev.map(alert => 
        alert.id === currentAlert.id ? { ...alert, read: true } : alert
      ))
    }
    setShowAlert(false)
    setCurrentAlert(null)
    onClose?.()
  }

  useEffect(() => {
    // Simular alertas de integração financeira
    // Em uma implementação real, isso viria de um sistema de notificações
    const mockAlerts: FinancialAlert[] = [
      {
        id: '1',
        type: 'maintenance_cost',
        title: 'Custo de Manutenção Adicionado',
        message: 'Uma nova manutenção foi registrada e o custo foi automaticamente adicionado ao módulo financeiro.',
        amount: 2500.00,
        pumpId: 'pump-1',
        pumpPrefix: 'BOMBA-01',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        type: 'diesel_cost',
        title: 'Custo de Diesel Adicionado',
        message: 'Um novo abastecimento foi registrado e o custo foi automaticamente adicionado ao módulo financeiro.',
        amount: 450.00,
        pumpId: 'pump-2',
        pumpPrefix: 'BOMBA-02',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: '3',
        type: 'investment_cost',
        title: 'Investimento Adicionado',
        message: 'Um novo investimento foi registrado e o custo foi automaticamente adicionado ao módulo financeiro.',
        amount: 8500.00,
        pumpId: 'pump-3',
        pumpPrefix: 'BOMBA-03',
        timestamp: new Date().toISOString(),
        read: false
      }
    ]

    setAlerts(mockAlerts)
    
    // Mostrar o primeiro alerta não lido
    const unreadAlert = mockAlerts.find(alert => !alert.read)
    if (unreadAlert && (!pumpId || unreadAlert.pumpId === pumpId)) {
      setCurrentAlert(unreadAlert)
      setShowAlert(true)
    }
  }, [pumpId])

  useEffect(() => {
    if (showAlert && autoHide) {
      const timer = setTimeout(() => {
        handleClose()
      }, 5000) // Auto-hide após 5 segundos

      return () => clearTimeout(timer)
    }
  }, [showAlert, autoHide, handleClose])

  const handleViewInFinancial = () => {
    // Em uma implementação real, isso navegaria para o módulo financeiro
    console.log('Navegando para o módulo financeiro...')
    handleClose()
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'maintenance_cost':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case 'diesel_cost':
        return <DollarSign className="w-5 h-5 text-blue-600" />
      case 'investment_cost':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      default:
        return <DollarSign className="w-5 h-5 text-gray-600" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'maintenance_cost':
        return 'bg-orange-50 border-orange-200'
      case 'diesel_cost':
        return 'bg-blue-50 border-blue-200'
      case 'investment_cost':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getAlertTextColor = (type: string) => {
    switch (type) {
      case 'maintenance_cost':
        return 'text-orange-800'
      case 'diesel_cost':
        return 'text-blue-800'
      case 'investment_cost':
        return 'text-green-800'
      default:
        return 'text-gray-800'
    }
  }

  if (!showAlert || !currentAlert) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className={`rounded-lg border shadow-lg p-4 ${getAlertColor(currentAlert.type)}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getAlertIcon(currentAlert.type)}
            <div className="flex-1">
              <h3 className={`font-semibold text-sm ${getAlertTextColor(currentAlert.type)}`}>
                {currentAlert.title}
              </h3>
              <p className={`text-xs mt-1 ${getAlertTextColor(currentAlert.type)} opacity-90`}>
                {currentAlert.message}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`text-sm font-bold ${getAlertTextColor(currentAlert.type)}`}>
                  {formatCurrency(currentAlert.amount)}
                </span>
                <span className={`text-xs ${getAlertTextColor(currentAlert.type)} opacity-75`}>
                  {currentAlert.pumpPrefix}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleViewInFinancial}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                    currentAlert.type === 'maintenance_cost' 
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : currentAlert.type === 'diesel_cost'
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Ver no Financeiro
                </button>
                <button
                  onClick={handleClose}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                    currentAlert.type === 'maintenance_cost' 
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : currentAlert.type === 'diesel_cost'
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`ml-2 ${getAlertTextColor(currentAlert.type)} opacity-75 hover:opacity-100`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Componente para mostrar histórico de alertas financeiros
export function FinancialAlertsHistory({ pumpId }: { pumpId?: string }) {
  const [alerts, setAlerts] = useState<FinancialAlert[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    // Simular histórico de alertas
    const mockAlerts: FinancialAlert[] = [
      {
        id: '1',
        type: 'maintenance_cost',
        title: 'Custo de Manutenção Adicionado',
        message: 'Manutenção preventiva da bomba BOMBA-01',
        amount: 2500.00,
        pumpId: 'pump-1',
        pumpPrefix: 'BOMBA-01',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
        read: true
      },
      {
        id: '2',
        type: 'diesel_cost',
        title: 'Custo de Diesel Adicionado',
        message: 'Abastecimento de 50L na bomba BOMBA-02',
        amount: 450.00,
        pumpId: 'pump-2',
        pumpPrefix: 'BOMBA-02',
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
        read: true
      }
    ]

    const filteredAlerts = pumpId 
      ? mockAlerts.filter(alert => alert.pumpId === pumpId)
      : mockAlerts

    setAlerts(filteredAlerts)
  }, [pumpId])

  if (!showHistory) {
    return (
      <button
        onClick={() => setShowHistory(true)}
        className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
      >
        <DollarSign className="w-4 h-4" />
        Histórico Financeiro
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={() => setShowHistory(false)}
        />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Histórico de Integração Financeira
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum registro financeiro encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {alert.type === 'maintenance_cost' && (
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                          )}
                          {alert.type === 'diesel_cost' && (
                            <DollarSign className="w-4 h-4 text-blue-600" />
                          )}
                          {alert.type === 'investment_cost' && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          <h4 className="font-medium text-gray-900 text-sm">{alert.title}</h4>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{alert.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(alert.amount)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
