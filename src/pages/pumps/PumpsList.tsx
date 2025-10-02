import { useEffect, useState } from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { PumpCard } from '../../components/PumpCard'
import { BombaTerceiraCard } from '../../components/BombaTerceiraCard'
// import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Database } from '../../lib/supabase'
import { BombaTerceiraWithEmpresa } from '../../types/bombas-terceiras'
import { PumpDashboardStats, formatVolume, formatLiters, formatCurrency } from '../../types/pump-advanced'
import { PumpAdvancedAPI } from '../../lib/pump-advanced-api'
import { DashboardStatsSkeleton, PumpListSkeleton } from '../../components/PumpLoadingSkeleton'

type Pump = Database['public']['Tables']['pumps']['Row'] & {
  company_name?: string
}

type Company = Database['public']['Tables']['companies']['Row']

const SORT_OPTIONS = [
  { value: 'total_billed_desc', label: 'Maior faturamento' },
  { value: 'total_billed_asc', label: 'Menor faturamento' },
  { value: 'prefix_asc', label: 'Prefixo A-Z' },
  { value: 'prefix_desc', label: 'Prefixo Z-A' }
]

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'Disponível', label: 'Disponível' },
  { value: 'Em Uso', label: 'Em Uso' },
  { value: 'Em Manutenção', label: 'Em Manutenção' }
]

export default function PumpsList() {
  const [pumps, setPumps] = useState<Pump[]>([])
  const [bombasTerceiras, setBombasTerceiras] = useState<BombaTerceiraWithEmpresa[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [dashboardStats, setDashboardStats] = useState<PumpDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('total_billed_desc')
  const [statusFilter, setStatusFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [showEmpresasTerceiras] = useState(true) // Sempre mostrar bombas de terceiros

  async function fetchPumps() {
    setLoading(true)
    setError(null)
    
    try {
      // Se o filtro for "empresas_terceiras", não buscar bombas internas
      if (companyFilter === 'empresas_terceiras') {
        setPumps([])
        setLoading(false)
        return
      }

      let query = supabase
        .from('pumps')
        .select(`
          *,
          companies!pumps_owner_company_id_fkey(name)
        `)

      // Aplicar filtros
      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }
      
      if (companyFilter && companyFilter !== 'empresas_terceiras') {
        query = query.eq('owner_company_id', companyFilter)
      }

      // Aplicar ordenação
      const [sortField, sortDirection] = sortBy.split('_')
      const ascending = sortDirection === 'asc'
      
      if (sortField === 'total_billed') {
        query = query.order('total_billed', { ascending })
      } else if (sortField === 'prefix') {
        query = query.order('prefix', { ascending })
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Transformar dados para incluir company_name
      const pumpsWithCompany = (data || []).map(pump => ({
        ...pump,
        company_name: pump.companies?.name
      }))

      setPumps(pumpsWithCompany)
    } catch (err: any) {
      console.error('Erro ao buscar bombas:', err)
      setError(err?.message || 'Erro ao carregar bombas')
    } finally {
      setLoading(false)
    }
  }

  async function fetchBombasTerceiras() {
    try {
      const { data, error } = await supabase
        .from('view_bombas_terceiras_com_empresa')
        .select('*')
        .order('empresa_nome_fantasia')

      if (error) throw error
      setBombasTerceiras(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar bombas terceiras:', err)
    }
  }

  async function fetchCompanies() {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar empresas:', err)
    }
  }

  async function fetchDashboardStats() {
    try {
      setStatsLoading(true)
      const stats = await PumpAdvancedAPI.getDashboardStats()
      setDashboardStats(stats)
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas do dashboard:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
    fetchBombasTerceiras()
    fetchDashboardStats()
  }, [])

  useEffect(() => {
    fetchPumps()
  }, [sortBy, statusFilter, companyFilter])

  // showEmpresasTerceiras está sempre como true, não precisa de useEffect

  if (error) {
    return (
      <GenericError 
        title="Erro ao carregar bombas" 
        message={error} 
        onRetry={fetchPumps} 
      />
    )
  }

  const companyOptions = [
    { value: '', label: 'Todas as empresas' },
    { value: 'empresas_terceiras', label: '🏢 Empresas Terceiras' },
    ...companies.map(company => ({
      value: company.id,
      label: company.name === 'FELIX MIX' ? 'FELIX MIX' : 
             company.name === 'WORLDPAV' ? 'WORLDPAV' : 
             company.name
    }))
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Frota de Bombas
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Gerencie suas bombas de concreto e acompanhe o desempenho operacional
            </p>
          </div>
          <div className="mt-4 flex gap-3 md:ml-4 md:mt-0">
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar
            </Button>
            <Link to="/pumps/new">
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                + Nova Bomba
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard KPIs */}
        {statsLoading ? (
          <DashboardStatsSkeleton />
        ) : dashboardStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total de Bombas */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de Bombas</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.total_pumps}</p>
                </div>
              </div>
            </div>

            {/* Disponíveis */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Disponíveis</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardStats.available_pumps}</p>
                </div>
              </div>
            </div>

            {/* Em Serviço */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Em Serviço</p>
                  <p className="text-2xl font-bold text-yellow-600">{dashboardStats.in_service_pumps}</p>
                </div>
              </div>
            </div>

            {/* Em Manutenção */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Em Manutenção</p>
                  <p className="text-2xl font-bold text-red-600">{dashboardStats.in_maintenance_pumps}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* KPIs Adicionais */}
        {!statsLoading && dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Volume Total Bombeado */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-lg">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Volume Bombeado</p>
                  <p className="text-2xl font-bold text-blue-600">{formatVolume(dashboardStats.total_volume_pumped)}</p>
                </div>
              </div>
            </div>

            {/* Diesel Consumido */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 text-lg">⛽</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Diesel Consumido</p>
                  <p className="text-2xl font-bold text-orange-600">{formatLiters(dashboardStats.total_diesel_consumed)}</p>
                </div>
              </div>
            </div>

            {/* Custo Manutenção */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-lg">🔧</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Custo Manutenção</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(dashboardStats.total_maintenance_cost)}</p>
                </div>
              </div>
            </div>

            {/* Manutenções Próximas */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-lg">⚠️</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Manutenções Próximas</p>
                  <p className="text-2xl font-bold text-yellow-600">{dashboardStats.maintenance_due_count}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por nome ou modelo...
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Buscar bombas..."
                />
              </div>
            </div>

            <Select
              label="Ordenar por"
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={setSortBy}
            />
            
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            
            <Select
              label="Empresa"
              options={companyOptions}
              value={companyFilter}
              onChange={setCompanyFilter}
            />
          </div>
        </div>

        {/* Grid de bombas */}
        {loading ? (
          <PumpListSkeleton />
        ) : pumps.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma bomba encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter || companyFilter 
                  ? 'Tente ajustar os filtros para ver mais resultados.'
                  : 'Comece criando uma nova bomba.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bombas Internas - só mostra se não estiver filtrando por empresas terceiras */}
            {companyFilter !== 'empresas_terceiras' && pumps.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bombas Internas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pumps.map((pump) => (
                    <PumpCard key={pump.id} pump={pump} />
                  ))}
                </div>
              </div>
            )}

            {/* Bombas Terceiras */}
            {(showEmpresasTerceiras || companyFilter === 'empresas_terceiras') && bombasTerceiras.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Bombas de Empresas Terceiras</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    ⚠️ Terceiros
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bombasTerceiras.map((bomba) => (
                    <BombaTerceiraCard key={bomba.id} bomba={bomba} />
                  ))}
                </div>
              </div>
            )}

            {/* Mensagem quando não há bombas */}
            {pumps.length === 0 && (!showEmpresasTerceiras || bombasTerceiras.length === 0) && companyFilter !== 'empresas_terceiras' && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma bomba encontrada</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {statusFilter || companyFilter 
                      ? 'Tente ajustar os filtros para ver mais resultados.'
                      : 'Comece criando uma nova bomba.'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Mensagem específica para quando não há bombas terceiras */}
            {companyFilter === 'empresas_terceiras' && bombasTerceiras.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma bomba terceira encontrada</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Não há bombas cadastradas de empresas terceiras.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}