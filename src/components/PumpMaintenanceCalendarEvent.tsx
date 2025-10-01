import { useState } from 'react'
import { Calendar, Wrench, X, Eye, Edit } from 'lucide-react'
import { formatDate, formatCurrency, getMaintenanceIcon } from '../types/pump-advanced'
import { Maintenance } from '../types/pump-advanced'
import { PumpAdvancedAPI } from '../lib/pump-advanced-api'

interface PumpMaintenanceCalendarEventProps {
  maintenance: Maintenance
  pumpPrefix: string
  onEdit?: (maintenance: Maintenance) => void
  onDelete?: (maintenanceId: string) => void
  onViewDetails?: (maintenance: Maintenance) => void
}

export function PumpMaintenanceCalendarEvent({
  maintenance,
  pumpPrefix,
  onEdit,
  onDelete,
  onViewDetails
}: PumpMaintenanceCalendarEventProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const getEventColor = () => {
    switch (maintenance.type) {
      case 'preventiva':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'corretiva':
        return 'bg-red-100 border-red-300 text-red-800'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const getStatusColor = () => {
    switch (maintenance.status) {
      case 'agendada':
        return 'bg-blue-100 text-blue-800'
      case 'em_andamento':
        return 'bg-yellow-100 text-yellow-800'
      case 'concluida':
        return 'bg-green-100 text-green-800'
      case 'cancelada':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta manutenção?')) {
      return
    }

    setIsDeleting(true)
    try {
      // Em uma implementação real, chamaria a API para deletar
      console.log('Deletando manutenção:', maintenance.id)
      onDelete?.(maintenance.id)
    } catch (error) {
      console.error('Erro ao deletar manutenção:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusText = () => {
    switch (maintenance.status) {
      case 'agendada':
        return 'Agendada'
      case 'em_andamento':
        return 'Em Andamento'
      case 'concluida':
        return 'Concluída'
      case 'cancelada':
        return 'Cancelada'
      default:
        return maintenance.status
    }
  }

  return (
    <div className={`relative rounded-lg border-2 p-3 cursor-pointer hover:shadow-md transition-all ${getEventColor()}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{getMaintenanceIcon(maintenance.type)}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{maintenance.os_name}</h4>
            <p className="text-xs opacity-75">{pumpPrefix}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span>Data:</span>
          <span className="font-medium">{formatDate(maintenance.date)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span>Valor:</span>
          <span className="font-medium">{formatCurrency(maintenance.value)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span>Tipo:</span>
          <span className="font-medium capitalize">{maintenance.type}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-current border-opacity-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 hover:bg-current hover:bg-opacity-20 rounded transition-colors"
            title="Ver detalhes"
          >
            <Eye className="w-3 h-3" />
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(maintenance)}
              className="p-1 hover:bg-current hover:bg-opacity-20 rounded transition-colors"
              title="Editar"
            >
              <Edit className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 hover:bg-current hover:bg-opacity-20 rounded transition-colors disabled:opacity-50"
              title="Excluir"
            >
              {isDeleting ? (
                <div className="w-3 h-3 border border-current border-opacity-50 border-t-transparent rounded-full animate-spin" />
              ) : (
                <X className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
        
        <div className="text-xs opacity-75">
          {formatDate(maintenance.created_at)}
        </div>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
          <div className="space-y-2">
            <div>
              <span className="text-xs font-medium opacity-75">Descrição:</span>
              <p className="text-xs mt-1">
                {maintenance.description || 'Nenhuma descrição fornecida'}
              </p>
            </div>
            
            {maintenance.next_maintenance_date && (
              <div>
                <span className="text-xs font-medium opacity-75">Próxima manutenção:</span>
                <p className="text-xs mt-1">{formatDate(maintenance.next_maintenance_date)}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span>ID:</span>
              <span className="font-mono opacity-75">{maintenance.id.slice(-8)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para mostrar eventos de manutenção em uma lista
export function PumpMaintenanceEventsList({
  pumpId,
  date,
  onEventClick
}: {
  pumpId: string
  date: string
  onEventClick?: (maintenance: Maintenance) => void
}) {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMaintenances() {
      try {
        setLoading(true)
        const data = await PumpAdvancedAPI.getMaintenances(pumpId)
        
        // Filtrar manutenções para a data específica
        const dateMaintenances = data.filter(maintenance => 
          maintenance.date === date
        )
        
        setMaintenances(dateMaintenances)
      } catch (error) {
        console.error('Erro ao carregar manutenções:', error)
      } finally {
        setLoading(false)
      }
    }

    if (pumpId && date) {
      loadMaintenances()
    }
  }, [pumpId, date])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (maintenances.length === 0) {
    return (
      <div className="text-center py-4">
        <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Nenhuma manutenção agendada</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {maintenances.map((maintenance) => (
        <PumpMaintenanceCalendarEvent
          key={maintenance.id}
          maintenance={maintenance}
          pumpPrefix="BOMBA" // Em uma implementação real, viria dos dados da bomba
          onViewDetails={onEventClick}
        />
      ))}
    </div>
  )
}

// Componente para integração com calendário de programação
export function PumpMaintenanceCalendarIntegration({
  pumpId,
  startDate,
  endDate
}: {
  pumpId: string
  startDate: string
  endDate: string
}) {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMaintenances() {
      try {
        setLoading(true)
        const data = await PumpAdvancedAPI.getMaintenances(pumpId)
        
        // Filtrar manutenções no período
        const periodMaintenances = data.filter(maintenance => {
          const maintenanceDate = new Date(maintenance.date)
          const start = new Date(startDate)
          const end = new Date(endDate)
          return maintenanceDate >= start && maintenanceDate <= end
        })
        
        setMaintenances(periodMaintenances)
      } catch (error) {
        console.error('Erro ao carregar manutenções:', error)
      } finally {
        setLoading(false)
      }
    }

    if (pumpId && startDate && endDate) {
      loadMaintenances()
    }
  }, [pumpId, startDate, endDate])

  // Agrupar manutenções por data
  const maintenancesByDate = maintenances.reduce((acc, maintenance) => {
    const date = maintenance.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(maintenance)
    return acc
  }, {} as Record<string, Maintenance[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Manutenções Agendadas</h3>
      </div>

      {Object.keys(maintenancesByDate).length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma manutenção agendada no período</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(maintenancesByDate).map(([date, dateMaintenances]) => (
            <div key={date} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {formatDate(date)}
                </h4>
                <span className="text-sm text-gray-500">
                  {dateMaintenances.length} manutenção{dateMaintenances.length !== 1 ? 'ões' : ''}
                </span>
              </div>
              
              <div className="space-y-2">
                {dateMaintenances.map((maintenance) => (
                  <PumpMaintenanceCalendarEvent
                    key={maintenance.id}
                    maintenance={maintenance}
                    pumpPrefix="BOMBA" // Em uma implementação real, viria dos dados da bomba
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


