import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Activity, BarChart3, PieChart } from 'lucide-react'
import { formatCurrency, formatVolume, formatLiters } from '../types/pump-advanced'
import { PumpKPIs } from '../types/pump-advanced'
import { PumpAdvancedAPI } from '../lib/pump-advanced-api'

interface PumpKPIChartsProps {
  pumpId: string
  period?: 'week' | 'month' | 'quarter' | 'year'
}

interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }>
}

export function PumpKPICharts({ pumpId, period = 'month' }: PumpKPIChartsProps) {
  const [kpis, setKpis] = useState<PumpKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeChart, setActiveChart] = useState<'volume' | 'diesel' | 'costs' | 'maintenance'>('volume')

  useEffect(() => {
    async function loadKPIs() {
      try {
        setLoading(true)
        const data = await PumpAdvancedAPI.getPumpKPIs(pumpId)
        setKpis(data)
      } catch (error) {
        console.error('Erro ao carregar KPIs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadKPIs()
  }, [pumpId, period])

  // Dados simulados para os gráficos (em uma implementação real, viriam da API)
  const getVolumeChartData = (): ChartData => ({
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Volume Bombeado (m³)',
        data: [1200, 1350, 1100, 1450, 1300, 1200],
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2
      }
    ]
  })

  const getDieselChartData = (): ChartData => ({
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Diesel Consumido (L)',
        data: [450, 520, 480, 550, 510, 470],
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        borderColor: 'rgba(251, 146, 60, 1)',
        borderWidth: 2
      }
    ]
  })

  const getCostsChartData = (): ChartData => ({
    labels: ['Manutenção', 'Diesel', 'Investimentos', 'Outros'],
    datasets: [
      {
        label: 'Custos (R$)',
        data: [kpis?.total_maintenance_cost || 0, kpis?.total_diesel_cost || 0, kpis?.total_investment_cost || 0, 500],
        backgroundColor: [
          'rgba(147, 51, 234, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(107, 114, 128, 0.8)'
        ],
        borderColor: [
          'rgba(147, 51, 234, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(107, 114, 128, 1)'
        ],
        borderWidth: 1
      }
    ]
  })

  const getMaintenanceChartData = (): ChartData => ({
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Custo Manutenção (R$)',
        data: [2500, 0, 1800, 3200, 0, 2100],
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 2
      }
    ]
  })

  const SimpleLineChart = ({ data, title, color = 'blue' }: { data: ChartData, title: string, color?: string }) => {
    const maxValue = Math.max(...data.datasets[0].data)
    const minValue = Math.min(...data.datasets[0].data)
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-48 relative">
          <div className="absolute inset-0 flex items-end justify-between">
            {data.datasets[0].data.map((value, index) => {
              const height = ((value - minValue) / (maxValue - minValue)) * 100
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className={`w-8 rounded-t transition-all duration-500 ${
                      color === 'blue' ? 'bg-blue-500' :
                      color === 'orange' ? 'bg-orange-500' :
                      color === 'purple' ? 'bg-purple-500' : 'bg-gray-500'
                    }`}
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                  <span className="text-xs text-gray-600 mt-2">{data.labels[index]}</span>
                  <span className="text-xs font-medium text-gray-900 mt-1">
                    {color === 'blue' ? formatVolume(value) :
                     color === 'orange' ? formatLiters(value) :
                     formatCurrency(value)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const SimplePieChart = ({ data, title }: { data: ChartData, title: string }) => {
    const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0)
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-48 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 relative">
              {data.datasets[0].data.map((value, index) => {
                const percentage = (value / total) * 100
                const angle = (value / total) * 360
                const cumulativeAngle = data.datasets[0].data.slice(0, index).reduce((sum, val) => sum + (val / total) * 360, 0)
                
                return (
                  <div key={index} className="absolute inset-0">
                    <div
                      className="absolute w-full h-full rounded-full border-8 border-transparent"
                      style={{
                        borderTopColor: data.datasets[0].backgroundColor![index],
                        transform: `rotate(${cumulativeAngle}deg)`,
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((angle * Math.PI) / 180)}% ${50 - 50 * Math.sin((angle * Math.PI) / 180)}%)`
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {data.labels.map((label, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: data.datasets[0].backgroundColor![index] }}
                />
                <span className="text-gray-700">{label}</span>
              </div>
              <span className="font-medium text-gray-900">
                {formatCurrency(data.datasets[0].data[index])}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!kpis) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Não foi possível carregar os dados dos gráficos</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Análise de Desempenho</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Período:</span>
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Semana</option>
            <option value="month">Mês</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Ano</option>
          </select>
        </div>
      </div>

      {/* Chart Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'volume', label: 'Volume', icon: TrendingUp },
            { id: 'diesel', label: 'Diesel', icon: Activity },
            { id: 'costs', label: 'Custos', icon: PieChart },
            { id: 'maintenance', label: 'Manutenção', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveChart(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeChart === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeChart === 'volume' && (
          <SimpleLineChart 
            data={getVolumeChartData()} 
            title="Evolução do Volume Bombeado" 
            color="blue"
          />
        )}
        
        {activeChart === 'diesel' && (
          <SimpleLineChart 
            data={getDieselChartData()} 
            title="Consumo de Diesel" 
            color="orange"
          />
        )}
        
        {activeChart === 'costs' && (
          <SimplePieChart 
            data={getCostsChartData()} 
            title="Distribuição de Custos" 
          />
        )}
        
        {activeChart === 'maintenance' && (
          <SimpleLineChart 
            data={getMaintenanceChartData()} 
            title="Custos de Manutenção" 
            color="purple"
          />
        )}

        {/* KPI Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Resumo de KPIs</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Volume Total:</span>
              <span className="font-semibold text-blue-600">{formatVolume(kpis.total_volume_pumped)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Diesel Total:</span>
              <span className="font-semibold text-orange-600">{formatLiters(kpis.total_diesel_consumed)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Custo Manutenção:</span>
              <span className="font-semibold text-purple-600">{formatCurrency(kpis.total_maintenance_cost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Custo Diesel:</span>
              <span className="font-semibold text-orange-600">{formatCurrency(kpis.total_diesel_cost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Consumo Médio:</span>
              <span className="font-semibold text-gray-900">
                {kpis.average_consumption_per_m3 ? `${kpis.average_consumption_per_m3.toFixed(1)} L/m³` : '-'}
              </span>
            </div>
            {kpis.current_mileage && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Quilometragem:</span>
                <span className="font-semibold text-gray-900">{kpis.current_mileage.toLocaleString('pt-BR')} km</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Eficiência</p>
              <p className="text-lg font-bold text-blue-900">
                {kpis.total_volume_pumped > 0 ? 
                  (kpis.total_volume_pumped / Math.max(kpis.total_diesel_consumed, 1)).toFixed(1) : '0'} m³/L
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Custo por m³</p>
              <p className="text-lg font-bold text-green-900">
                {kpis.total_volume_pumped > 0 ? 
                  formatCurrency((kpis.total_maintenance_cost + kpis.total_diesel_cost) / kpis.total_volume_pumped) : 
                  formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-600 font-medium">ROI Estimado</p>
              <p className="text-lg font-bold text-purple-900">
                {kpis.total_volume_pumped > 0 ? 
                  `${((kpis.total_volume_pumped * 50 - (kpis.total_maintenance_cost + kpis.total_diesel_cost)) / (kpis.total_maintenance_cost + kpis.total_diesel_cost) * 100).toFixed(1)}%` : 
                  '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para mostrar comparação entre bombas
export function PumpComparisonChart({ pumpIds }: { pumpIds: string[] }) {
  const [comparisonData, setComparisonData] = useState<Array<{
    pumpId: string
    pumpPrefix: string
    kpis: PumpKPIs
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadComparisonData() {
      try {
        setLoading(true)
        const data = await Promise.all(
          pumpIds.map(async (pumpId) => {
            const kpis = await PumpAdvancedAPI.getPumpKPIs(pumpId)
            return {
              pumpId,
              pumpPrefix: `BOMBA-${pumpId.slice(-2)}`, // Simulado
              kpis
            }
          })
        )
        setComparisonData(data)
      } catch (error) {
        console.error('Erro ao carregar dados de comparação:', error)
      } finally {
        setLoading(false)
      }
    }

    if (pumpIds.length > 0) {
      loadComparisonData()
    }
  }, [pumpIds])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-semibold text-gray-900 mb-6">Comparação entre Bombas</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bomba
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Volume (m³)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diesel (L)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manutenção (R$)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Eficiência (m³/L)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comparisonData.map((item) => (
              <tr key={item.pumpId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.pumpPrefix}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatVolume(item.kpis.total_volume_pumped)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatLiters(item.kpis.total_diesel_consumed)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(item.kpis.total_maintenance_cost)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.kpis.total_diesel_consumed > 0 ? 
                    (item.kpis.total_volume_pumped / item.kpis.total_diesel_consumed).toFixed(1) : 
                    '0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
