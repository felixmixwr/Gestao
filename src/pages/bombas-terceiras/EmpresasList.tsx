import { useEffect, useState } from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { EmpresaTerceiraCard } from '../../components/EmpresaTerceiraCard'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { Link } from 'react-router-dom'
import { useBombasTerceiras } from '../../lib/bombas-terceiras-api'
import { EmpresaTerceira, EmpresaTerceiraStats, BombaTerceiraStatsByEmpresa } from '../../types/bombas-terceiras'

export default function EmpresasList() {
  const { empresas, bombas } = useBombasTerceiras()
  const [empresasList, setEmpresasList] = useState<EmpresaTerceira[]>([])
  const [stats, setStats] = useState<EmpresaTerceiraStats | null>(null)
  const [bombasStats, setBombasStats] = useState<BombaTerceiraStatsByEmpresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  async function fetchData() {
    setLoading(true)
    setError(null)
    
    try {
      const [empresasData, statsData, bombasStatsData] = await Promise.all([
        empresas.listarEmpresas({ search: searchTerm }),
        empresas.obterEstatisticas(),
        bombas.obterEstatisticasPorEmpresa()
      ])

      setEmpresasList(empresasData)
      setStats(statsData)
      setBombasStats(bombasStatsData)
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      setError(err?.message || 'Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [searchTerm])

  const getEmpresaStats = (empresaId: string) => {
    const empresaStats = bombasStats.find(s => s.empresa_id === empresaId)
    return {
      totalBombas: empresaStats?.total_bombas || 0,
      bombasAtivas: empresaStats?.bombas_ativas || 0
    }
  }

  if (error) {
    return (
      <GenericError 
        title="Erro ao carregar empresas" 
        message={error} 
        onRetry={fetchData} 
      />
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Empresas Terceiras
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Gerencie empresas terceiras e suas bombas
            </p>
          </div>
          <div className="mt-4 flex gap-3 md:ml-4 md:mt-0">
            <Link to="/bombas-terceiras/empresas/nova">
              <Button>+ Nova Empresa</Button>
            </Link>
          </div>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total de Empresas</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_empresas}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total de Bombas</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_bombas}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Bombas Ativas</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.bombas_ativas}</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Busca */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="max-w-md">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar empresas
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome da empresa..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Lista de empresas */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        ) : empresasList.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma empresa encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'Tente ajustar o termo de busca.'
                  : 'Comece criando uma nova empresa terceira.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {empresasList.map((empresa) => {
              const empresaStats = getEmpresaStats(empresa.id)
              return (
                <EmpresaTerceiraCard 
                  key={empresa.id} 
                  empresa={empresa}
                  totalBombas={empresaStats.totalBombas}
                  bombasAtivas={empresaStats.bombasAtivas}
                />
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
