import { useEffect, useState } from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { PumpCard } from '../../components/PumpCard'
import { BombaTerceiraCard } from '../../components/BombaTerceiraCard'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Database } from '../../lib/supabase'
import { BombaTerceiraWithEmpresa } from '../../types/bombas-terceiras'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('total_billed_desc')
  const [statusFilter, setStatusFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [showEmpresasTerceiras, setShowEmpresasTerceiras] = useState(false)

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

  useEffect(() => {
    fetchCompanies()
    fetchBombasTerceiras()
  }, [])

  useEffect(() => {
    fetchPumps()
  }, [sortBy, statusFilter, companyFilter])

  // Atualizar checkbox quando filtro de empresa terceira for selecionado
  useEffect(() => {
    if (companyFilter === 'empresas_terceiras') {
      setShowEmpresasTerceiras(true)
    }
  }, [companyFilter])

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
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Bombas
            </h2>
          </div>
          <div className="mt-4 flex gap-3 md:ml-4 md:mt-0">
            <Link to="/pumps/new">
              <Button>+ Nova Bomba</Button>
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          {/* Checkbox para mostrar empresas terceiras */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showEmpresasTerceiras}
                onChange={(e) => setShowEmpresasTerceiras(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                🏢 Incluir bombas de empresas terceiras
              </span>
            </label>
          </div>
        </div>

        {/* Grid de bombas */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
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