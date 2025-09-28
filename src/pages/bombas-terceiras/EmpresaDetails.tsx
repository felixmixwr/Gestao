import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { BombaTerceiraCard } from '../../components/BombaTerceiraCard'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useBombasTerceiras } from '../../lib/bombas-terceiras-api'
import { EmpresaTerceiraWithBombas } from '../../types/bombas-terceiras'
import { formatarCNPJ, formatarTelefone, formatarData } from '../../types/bombas-terceiras'
import { toast } from '../../lib/toast-hooks'

export default function EmpresaDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { empresas } = useBombasTerceiras()
  
  const [empresa, setEmpresa] = useState<EmpresaTerceiraWithBombas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    fetchEmpresa()
  }, [id])

  const handleDelete = async () => {
    if (!empresa) return
    
    setDeleting(true)
    
    try {
      await empresas.excluirEmpresa(empresa.id)
      toast.success('Empresa excluída com sucesso!')
      navigate('/bombas-terceiras/empresas')
    } catch (err: any) {
      console.error('Erro ao excluir empresa:', err)
      toast.error(err?.message || 'Erro ao excluir empresa')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
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
        title="Erro ao carregar empresa" 
        message={error} 
        onRetry={fetchEmpresa} 
      />
    )
  }

  if (!empresa) {
    return (
      <GenericError 
        title="Empresa não encontrada" 
        message="A empresa solicitada não foi encontrada." 
        onRetry={() => navigate('/bombas-terceiras/empresas')} 
      />
    )
  }

  const bombasAtivas = empresa.bombas?.filter(b => b.status === 'ativa').length || 0
  const bombasEmManutencao = empresa.bombas?.filter(b => b.status === 'em manutenção').length || 0
  const bombasIndisponiveis = empresa.bombas?.filter(b => b.status === 'indisponível').length || 0

  return (
    <Layout>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <button
                    onClick={() => navigate('/bombas-terceiras/empresas')}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    Empresas Terceiras
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-4 text-sm font-medium text-gray-500">{empresa.nome_fantasia}</span>
                  </div>
                </li>
              </ol>
            </nav>
            
            <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {empresa.nome_fantasia}
            </h2>
          </div>
          <div className="mt-4 flex gap-3 md:ml-4 md:mt-0">
            <Button
              variant="secondary"
              onClick={() => navigate(`/bombas-terceiras/empresas/${empresa.id}/editar`)}
            >
              Editar Empresa
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteDialog(true)}
            >
              Excluir
            </Button>
          </div>
        </div>

        {/* Informações da empresa */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Empresa</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                <p className="mt-1 text-sm text-gray-900">{empresa.nome_fantasia}</p>
              </div>
              
              {empresa.razao_social && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Razão Social</label>
                  <p className="mt-1 text-sm text-gray-900">{empresa.razao_social}</p>
                </div>
              )}
              
              {empresa.cnpj && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                  <p className="mt-1 text-sm text-gray-900">{formatarCNPJ(empresa.cnpj)}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {empresa.telefone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <p className="mt-1 text-sm text-gray-900">{formatarTelefone(empresa.telefone)}</p>
                </div>
              )}
              
              {empresa.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{empresa.email}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cadastrada em</label>
                <p className="mt-1 text-sm text-gray-900">{formatarData(empresa.created_at)}</p>
              </div>
            </div>
          </div>
          
          {empresa.endereco && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Endereço</label>
              <p className="mt-1 text-sm text-gray-900">{empresa.endereco}</p>
            </div>
          )}
        </div>

        {/* Estatísticas das bombas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-2xl font-semibold text-gray-900">{empresa.bombas?.length || 0}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{bombasAtivas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Em Manutenção</p>
                <p className="text-2xl font-semibold text-gray-900">{bombasEmManutencao}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Indisponíveis</p>
                <p className="text-2xl font-semibold text-gray-900">{bombasIndisponiveis}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de bombas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Bombas da Empresa</h3>
            <Button
              onClick={() => navigate(`/bombas-terceiras/empresas/${empresa.id}/bombas/nova`)}
            >
              + Nova Bomba
            </Button>
          </div>

          {empresa.bombas && empresa.bombas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {empresa.bombas.map((bomba) => (
                <BombaTerceiraCard 
                  key={bomba.id} 
                  bomba={{
                    ...bomba,
                    empresa_nome_fantasia: empresa.nome_fantasia,
                    empresa_razao_social: empresa.razao_social,
                    empresa_cnpj: empresa.cnpj,
                    empresa_telefone: empresa.telefone,
                    empresa_email: empresa.email,
                    empresa_endereco: empresa.endereco
                  }} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma bomba cadastrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comece cadastrando a primeira bomba desta empresa.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dialog de confirmação de exclusão */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Excluir Empresa"
          message={`Tem certeza que deseja excluir a empresa "${empresa.nome_fantasia}"? Esta ação também excluirá todas as bombas associadas e não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
          loading={deleting}
        />
      </div>
    </Layout>
  )
}
