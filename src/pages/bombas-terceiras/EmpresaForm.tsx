import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { EmpresaTerceiraForm } from '../../components/EmpresaTerceiraForm'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { useBombasTerceiras } from '../../lib/bombas-terceiras-api'
import { EmpresaTerceira, CreateEmpresaTerceiraData, UpdateEmpresaTerceiraData } from '../../types/bombas-terceiras'
import { toast } from '../../lib/toast-hooks'

export default function EmpresaForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { empresas } = useBombasTerceiras()
  
  const [empresa, setEmpresa] = useState<EmpresaTerceira | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!id

  async function fetchEmpresa() {
    if (!id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const empresaData = await empresas.buscarEmpresaPorId(id)
      if (!empresaData) {
        throw new Error('Empresa não encontrada')
      }
      setEmpresa(empresaData)
    } catch (err: any) {
      console.error('Erro ao carregar empresa:', err)
      setError(err?.message || 'Erro ao carregar empresa')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isEditing) {
      fetchEmpresa()
    } else {
      setLoading(false)
    }
  }, [id])

  const handleSubmit = async (data: CreateEmpresaTerceiraData | UpdateEmpresaTerceiraData) => {
    setSaving(true)
    
    try {
      if (isEditing) {
        await empresas.atualizarEmpresa(data as UpdateEmpresaTerceiraData)
        toast.success('Empresa atualizada com sucesso!')
      } else {
        await empresas.criarEmpresa(data as CreateEmpresaTerceiraData)
        toast.success('Empresa criada com sucesso!')
      }
      
      navigate('/bombas-terceiras/empresas')
    } catch (err: any) {
      console.error('Erro ao salvar empresa:', err)
      toast.error(err?.message || 'Erro ao salvar empresa')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/bombas-terceiras/empresas')
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
        title="Erro ao carregar empresa" 
        message={error} 
        onRetry={fetchEmpresa} 
      />
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {isEditing ? 'Editar Empresa' : 'Nova Empresa Terceira'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing 
                ? 'Atualize as informações da empresa terceira'
                : 'Cadastre uma nova empresa terceira no sistema'
              }
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <EmpresaTerceiraForm
            empresa={empresa || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={saving}
          />
        </div>
      </div>
    </Layout>
  )
}

