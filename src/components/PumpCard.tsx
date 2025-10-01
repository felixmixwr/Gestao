import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from './Badge'
import { formatCurrency } from '../utils/formatters'
import { Database } from '../lib/supabase'
import { PumpKPIs, formatVolume, formatLiters, getMaintenanceStatus, getPumpStatusColor, getPumpIcon, isMaintenanceDue } from '../types/pump-advanced'
import { PumpAdvancedAPI } from '../lib/pump-advanced-api'
import { PumpCardSkeleton } from './PumpLoadingSkeleton'

type Pump = Database['public']['Tables']['pumps']['Row'] & {
  company_name?: string
}

interface PumpCardProps {
  pump: Pump
}

export function PumpCard({ pump }: PumpCardProps) {
  const [kpis, setKpis] = useState<PumpKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadKPIs = async () => {
    try {
      const pumpKPIs = await PumpAdvancedAPI.getPumpKPIs(pump.id)
      setKpis(pumpKPIs)
    } catch (error) {
      console.error('Erro ao carregar KPIs da bomba:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKPIs()
  }, [pump.id])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Disponível':
        return 'success'
      case 'Em Uso':
        return 'warning'
      case 'Em Manutenção':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getCardBorderColor = () => {
    if (pump.status === 'Em Manutenção') return 'border-red-200'
    if (isMaintenanceDue(kpis?.next_maintenance_date)) return 'border-yellow-200'
    if (pump.status === 'Em Uso') return 'border-blue-200'
    return 'border-gray-200'
  }

  const getCardBgColor = () => {
    if (pump.status === 'Em Manutenção') return 'bg-red-50'
    if (isMaintenanceDue(kpis?.next_maintenance_date)) return 'bg-yellow-50'
    if (pump.status === 'Em Uso') return 'bg-blue-50'
    return 'bg-white'
  }

  const maintenanceStatus = getMaintenanceStatus(kpis?.next_maintenance_date)

  if (loading) {
    return <PumpCardSkeleton />
  }

  return (
    <div className={`${getCardBgColor()} rounded-lg border-2 ${getCardBorderColor()} p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{getPumpIcon(pump.status as any)}</span>
            <h3 className="text-lg font-bold text-gray-900">{pump.prefix}</h3>
          </div>
          <p className="text-sm text-gray-600 font-medium">{pump.model || 'Modelo não informado'}</p>
          <p className="text-xs text-gray-500">
            {pump.company_name === 'FELIX MIX' ? 'FELIX MIX' : 
             pump.company_name === 'WORLDPAV' ? 'WORLDPAV' : 
             pump.company_name || '-'}
          </p>
        </div>
        <Badge variant={getStatusVariant(pump.status)} size="sm">
          {pump.status}
        </Badge>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Volume Bombeado */}
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xs">📊</span>
            </div>
            <span className="text-xs font-medium text-gray-500">Volume Bombeado</span>
          </div>
          <p className="text-lg font-bold text-blue-600">
            {loading ? '...' : formatVolume(kpis?.total_volume_pumped || 0)}
          </p>
        </div>

        {/* Diesel Consumido */}
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-xs">⛽</span>
            </div>
            <span className="text-xs font-medium text-gray-500">Diesel Consumido</span>
          </div>
          <p className="text-lg font-bold text-orange-600">
            {loading ? '...' : formatLiters(kpis?.total_diesel_consumed || 0)}
          </p>
        </div>

        {/* Faturamento */}
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs">💰</span>
            </div>
            <span className="text-xs font-medium text-gray-500">Faturamento</span>
          </div>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(pump.total_billed)}
          </p>
        </div>

        {/* Próxima Manutenção */}
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-xs">🔧</span>
            </div>
            <span className="text-xs font-medium text-gray-500">Próx. Manutenção</span>
          </div>
          <p className={`text-sm font-semibold ${maintenanceStatus.color}`}>
            {loading ? '...' : 
             kpis?.next_maintenance_date ? 
               maintenanceStatus.status : 
               'Não agendada'
            }
          </p>
        </div>
      </div>

      {/* Alertas */}
      {kpis && (isMaintenanceDue(kpis.next_maintenance_date) || pump.status === 'Em Manutenção') && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-100 border border-yellow-200">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <p className="text-sm font-medium text-yellow-800">
              {pump.status === 'Em Manutenção' 
                ? 'Bomba em manutenção'
                : `Manutenção ${maintenanceStatus.status.toLowerCase()}`
              }
            </p>
          </div>
        </div>
      )}

      {/* Informações Adicionais */}
      <div className="space-y-2 mb-4 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Consumo médio:</span>
          <span className="font-medium">
            {loading ? '...' : 
             kpis?.average_consumption_per_m3 ? 
               `${kpis.average_consumption_per_m3.toFixed(1)} L/m³` : 
               '-'
            }
          </span>
        </div>
        {kpis?.current_mileage && (
          <div className="flex justify-between">
            <span>Quilometragem:</span>
            <span className="font-medium">
              {kpis.current_mileage.toLocaleString('pt-BR')} km
            </span>
          </div>
        )}
      </div>

      {/* Botão Ver Detalhes */}
      <div className="flex justify-end">
        <button 
          onClick={() => navigate(`/pumps/${pump.id}`)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 bg-[#2663eb] text-white border border-[#2663eb] hover:bg-[#1d4ed8] hover:border-[#1d4ed8] hover:text-white focus:ring-[#2663eb] transition-colors"
        >
          <span>Ver detalhes</span>
          <span>→</span>
        </button>
      </div>
    </div>
  )
}
