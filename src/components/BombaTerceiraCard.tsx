import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from './Badge'
import { 
  BombaTerceiraWithEmpresa, 
  getCorStatus, 
  formatarData,
  BombaTerceiraKPIs,
  formatVolumeTerceira,
  formatCurrencyTerceira,
  getBombaTerceiraIcon,
  isManutencaoVencida,
  getStatusManutencao,
  getCorStatusManutencao
} from '../types/bombas-terceiras'
import { BombasTerceirasService } from '../lib/bombas-terceiras-api'

interface BombaTerceiraCardProps {
  bomba: BombaTerceiraWithEmpresa
}

export function BombaTerceiraCard({ bomba }: BombaTerceiraCardProps) {
  const [kpis, setKpis] = useState<BombaTerceiraKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadKPIs = async () => {
    try {
      const bombaKPIs = await BombasTerceirasService.getBombaKPIs(bomba.prefixo)
      setKpis(bombaKPIs)
    } catch (error) {
      console.error('Erro ao carregar KPIs da bomba terceira:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKPIs()
  }, [bomba.prefixo])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'success'
      case 'em manutenção':
        return 'warning'
      case 'indisponível':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getCardBorderColor = () => {
    if (bomba.status === 'indisponível') return 'border-red-200'
    if (isManutencaoVencida(kpis?.next_maintenance_date)) return 'border-yellow-200'
    if (bomba.status === 'em manutenção') return 'border-orange-200'
    return 'border-gray-200'
  }

  const getCardBgColor = () => {
    if (bomba.status === 'indisponível') return 'bg-red-50'
    if (isManutencaoVencida(kpis?.next_maintenance_date)) return 'bg-yellow-50'
    if (bomba.status === 'em manutenção') return 'bg-orange-50'
    return 'bg-white'
  }

  const maintenanceStatus = getStatusManutencao(kpis?.next_maintenance_date)

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`${getCardBgColor()} rounded-lg border-2 ${getCardBorderColor()} p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{getBombaTerceiraIcon(bomba.status)}</span>
            <h3 className="text-lg font-bold text-gray-900">{bomba.prefixo}</h3>
          </div>
          <p className="text-sm text-gray-600 font-medium">{bomba.modelo || 'Modelo não informado'}</p>
          <p className="text-xs text-gray-500">{bomba.empresa_nome_fantasia}</p>
        </div>
        <Badge variant={getStatusVariant(bomba.status)} size="sm">
          {bomba.status}
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
            {loading ? '...' : formatVolumeTerceira(kpis?.total_volume_pumped || 0)}
          </p>
        </div>

        {/* Receita Total */}
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xs">💰</span>
            </div>
            <span className="text-xs font-medium text-gray-500">Receita Total</span>
          </div>
          <p className="text-lg font-bold text-green-600">
            {loading ? '...' : formatCurrencyTerceira(kpis?.total_revenue || 0)}
          </p>
        </div>

        {/* Serviços Realizados */}
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-xs">🔧</span>
            </div>
            <span className="text-xs font-medium text-gray-500">Serviços</span>
          </div>
          <p className="text-lg font-bold text-purple-600">
            {loading ? '...' : kpis?.total_services || 0}
          </p>
        </div>

        {/* Valor da Diária */}
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-xs">📅</span>
            </div>
            <span className="text-xs font-medium text-gray-500">Valor Diária</span>
          </div>
          <p className="text-lg font-bold text-orange-600">
            {bomba.valor_diaria ? formatCurrencyTerceira(bomba.valor_diaria) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Alertas */}
      {kpis && (isManutencaoVencida(kpis.next_maintenance_date) || bomba.status === 'em manutenção') && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-100 border border-yellow-200">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <p className="text-sm font-medium text-yellow-800">
              {bomba.status === 'em manutenção' 
                ? 'Bomba em manutenção'
                : `Manutenção ${maintenanceStatus.toLowerCase()}`
              }
            </p>
          </div>
        </div>
      )}

      {/* Informações Adicionais */}
      <div className="space-y-2 mb-4 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Último serviço:</span>
          <span className="font-medium">
            {loading ? '...' : 
             kpis?.last_service_date ? 
               formatarData(kpis.last_service_date) : 
               'Nenhum'
            }
          </span>
        </div>
        <div className="flex justify-between">
          <span>Próxima manutenção:</span>
          <span className={`font-medium ${getCorStatusManutencao(kpis?.next_maintenance_date)}`}>
            {loading ? '...' : 
             kpis?.next_maintenance_date ? 
               maintenanceStatus : 
               'Não agendada'
            }
          </span>
        </div>
        {kpis?.efficiency_ratio && kpis.efficiency_ratio > 0 && (
          <div className="flex justify-between">
            <span>Eficiência:</span>
            <span className="font-medium">
              {formatCurrencyTerceira(kpis.efficiency_ratio)}/m³
            </span>
          </div>
        )}
      </div>

      {/* Botão Ver Detalhes */}
      <div className="flex justify-end">
        <button 
          onClick={() => navigate(`/bombas-terceiras/bombas/${bomba.id}`)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 bg-orange-600 text-white border border-orange-600 hover:bg-orange-700 hover:border-orange-700 hover:text-white focus:ring-orange-600 transition-colors"
        >
          <span>Ver detalhes</span>
          <span>→</span>
        </button>
      </div>
    </div>
  )
}

