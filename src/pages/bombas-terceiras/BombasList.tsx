import { useEffect, useState } from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { BombaTerceiraCard } from '../../components/BombaTerceiraCard'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { Link } from 'react-router-dom'
import { useBombasTerceiras } from '../../lib/bombas-terceiras-api'
import { BombaTerceiraWithEmpresa, EmpresaTerceira, BombaTerceiraFilters, STATUS_BOMBA_TERCEIRA_OPTIONS } from '../../types/bombas-terceiras'

export default function BombasList() {
  const { bombas, empresas } = useBombasTerceiras()
  const [bombasList, setBombasList] = useState<BombaTerceiraWithEmpresa[]>([])
  const [empresasList, setEmpresasList] = useState<EmpresaTerceira[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [filters, setFilters] = useState<BombaTerceiraFilters>({
    empresa_id: '',
    status: [],
    search: ''
  })

  async function fetchData() {
    setLoading(true)
    setError(null)
    
    try {
      const [bombasData, empresasData] = await Promise.all([
        bombas.listarBombas(filters),
        empresas.listarEmpresas()
      ])

      setBombasList(bombasData)
      setEmpresasList(empresasData)
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      setError(err?.message || 'Erro ao carregar bombas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters])

  const handleStatusChange = (status: string) => {
    if (status === '') {
      setFilters(prev => ({ ...prev, status: [] }))
    } else {
      const statusArray = status.split(',').filter(Boolean) as ('ativa' | 'em manutenção' | 'indisponível')[]
      setFilters(prev => ({ ...prev, status: statusArray }))
    }
  }

  const empresaOptions = [
    { value: '', label: 'Todas as empresas' },
    ...empresasList.map(empresa => ({
      value: empresa.id,
      label: empresa.nome_fantasia
    }))
  ]

  const statusOptions = [
    { value: '', label: 'Todos os status' },
    ...STATUS_BOMBA_TERCEIRA_OPTIONS
  ]

  if (error) {
    return (
      <GenericError 
        title="Erro ao carregar bombas" 
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
              Bombas Terceiras
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Gerencie bombas de empresas terceiras
            </p>
          </div>
          <div className="mt-4 flex gap-3 md:ml-4 md:mt-0">
            <Link to="/bombas-terceiras/bombas/nova">
              <Button>+ Nova Bomba</Button>
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                id="search"
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Prefixo, modelo ou empresa..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <Select
              label="Empresa"
              options={empresaOptions}
              value={filters.empresa_id || ''}
              onChange={(value) => setFilters(prev => ({ ...prev, empresa_id: value }))}
            />
            
            <Select
              label="Status"
              options={statusOptions}
              value={filters.status?.join(',') || ''}
              onChange={handleStatusChange}
            />
          </div>
        </div>

        {/* Lista de bombas */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        ) : bombasList.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma bomba encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search || filters.empresa_id || filters.status?.length
                  ? 'Tente ajustar os filtros para ver mais resultados.'
                  : 'Comece criando uma nova bomba terceira.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bombasList.map((bomba) => (
              <BombaTerceiraCard key={bomba.id} bomba={bomba} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

