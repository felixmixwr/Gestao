import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { BombaTerceiraForm } from '../../components/BombaTerceiraForm'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { useBombasTerceiras } from '../../lib/bombas-terceiras-api'
import { BombaTerceiraWithEmpresa, EmpresaTerceira, CreateBombaTerceiraData, UpdateBombaTerceiraData } from '../../types/bombas-terceiras'
import { toast } from '../../lib/toast-hooks'

export default function BombaForm() {
  const { id, empresaId } = useParams<{ id: string; empresaId: string }>()
  const navigate = useNavigate()
  const { bombas, empresas } = useBombasTerceiras()
  
  const [bomba, setBomba] = useState<BombaTerceiraWithEmpresa | null>(null)
  const [empresasList, setEmpresasList] = useState<EmpresaTerceira[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!id

  async function fetchData() {
    setLoading(true)
    setError(null)
    
    try {
      const empresasData = await empresas.listarEmpresas()
      setEmpresasList(empresasData)
      
      if (isEditing) {
        const bombaData = await bombas.buscarBombaPorId(id!)
        setBomba(bombaData)
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      setError(err?.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleSubmit = async (data: CreateBombaTerceiraData | UpdateBombaTerceiraData) => {
    setSaving(true)
    
    try {
      if (isEditing) {
        await bombas.atualizarBomba(data as UpdateBombaTerceiraData)
        toast.success('Bomba atualizada com sucesso!')
      } else {
        await bombas.criarBomba(data as CreateBombaTerceiraData)
        toast.success('Bomba criada com sucesso!')
      }
      
      // Redirecionar baseado no contexto
      if (empresaId) {
        navigate(`/bombas-terceiras/empresas/${empresaId}`)
      } else {
        navigate('/bombas-terceiras/bombas')
      }
    } catch (err: any) {
      console.error('Erro ao salvar bomba:', err)
      toast.error(err?.message || 'Erro ao salvar bomba')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (empresaId) {
      navigate(`/bombas-terceiras/empresas/${empresaId}`)
    } else {
      navigate('/bombas-terceiras/bombas')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <GenericError 
        title="Erro ao carregar dados" 
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
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <button
                    onClick={() => navigate('/bombas-terceiras/bombas')}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    Bombas Terceiras
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-4 text-sm font-medium text-gray-500">
                      {isEditing ? 'Editar Bomba' : 'Nova Bomba'}
                    </span>
                  </div>
                </li>
              </ol>
            </nav>
            
            <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {isEditing ? 'Editar Bomba Terceira' : 'Nova Bomba Terceira'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing 
                ? 'Atualize as informações da bomba terceira'
                : 'Cadastre uma nova bomba terceira no sistema'
              }
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <BombaTerceiraForm
            bomba={bomba || undefined}
            empresaId={empresaId}
            empresas={empresasList}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={saving}
          />
        </div>
      </div>
    </Layout>
  )
}
