import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { useBombasTerceiras } from '../../lib/bombas-terceiras-api'
import { BombaTerceiraWithEmpresa, getCorStatus, formatarData } from '../../types/bombas-terceiras'
import { toast } from '../../lib/toast-hooks'

export default function BombaDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { bombas } = useBombasTerceiras()
  
  const [bomba, setBomba] = useState<BombaTerceiraWithEmpresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function fetchBomba() {
    if (!id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const bombaData = await bombas.buscarBombaPorId(id)
      if (!bombaData) {
        throw new Error('Bomba não encontrada')
      }
      setBomba(bombaData)
    } catch (err: any) {
      console.error('Erro ao carregar bomba:', err)
      setError(err?.message || 'Erro ao carregar bomba')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBomba()
  }, [id])

  const handleDelete = async () => {
    if (!bomba) return
    
    setDeleting(true)
    
    try {
      await bombas.excluirBomba(bomba.id)
      toast.success('Bomba excluída com sucesso!')
      navigate('/bombas-terceiras/bombas')
    } catch (err: any) {
      console.error('Erro ao excluir bomba:', err)
      toast.error(err?.message || 'Erro ao excluir bomba')
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
        title="Erro ao carregar bomba" 
        message={error} 
        onRetry={fetchBomba} 
      />
    )
  }

  if (!bomba) {
    return (
      <GenericError 
        title="Bomba não encontrada" 
        message="A bomba solicitada não foi encontrada." 
        onRetry={() => navigate('/bombas-terceiras/bombas')} 
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
                    <span className="ml-4 text-sm font-medium text-gray-500">{bomba.prefixo}</span>
                  </div>
                </li>
              </ol>
            </nav>
            
            <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {bomba.prefixo}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Bomba da empresa {bomba.empresa_nome_fantasia}
            </p>
          </div>
          <div className="mt-4 flex gap-3 md:ml-4 md:mt-0">
            <Button
              variant="secondary"
              onClick={() => navigate(`/bombas-terceiras/bombas/${bomba.id}/editar`)}
            >
              Editar Bomba
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteDialog(true)}
            >
              Excluir
            </Button>
          </div>
        </div>

        {/* Informações da bomba */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Bomba</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Prefixo</label>
                <p className="mt-1 text-sm text-gray-900">{bomba.prefixo}</p>
              </div>
              
              {bomba.modelo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Modelo</label>
                  <p className="mt-1 text-sm text-gray-900">{bomba.modelo}</p>
                </div>
              )}
              
              {bomba.ano && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ano</label>
                  <p className="mt-1 text-sm text-gray-900">{bomba.ano}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCorStatus(bomba.status)}`}>
                  {bomba.status}
                </span>
              </div>
              
              {bomba.valor_diaria && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor da Diária</label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm text-gray-900">
                      R$ {bomba.valor_diaria.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      por dia
                    </span>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cadastrada em</label>
                <p className="mt-1 text-sm text-gray-900">{formatarData(bomba.created_at)}</p>
              </div>
            </div>
          </div>
          
          {bomba.observacoes && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Observações</label>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{bomba.observacoes}</p>
            </div>
          )}
        </div>

        {/* Informações da empresa */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Empresa Proprietária</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                <p className="mt-1 text-sm text-gray-900">{bomba.empresa_nome_fantasia}</p>
              </div>
              
              {bomba.empresa_razao_social && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Razão Social</label>
                  <p className="mt-1 text-sm text-gray-900">{bomba.empresa_razao_social}</p>
                </div>
              )}
              
              {bomba.empresa_cnpj && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                  <p className="mt-1 text-sm text-gray-900">{bomba.empresa_cnpj}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {bomba.empresa_telefone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <p className="mt-1 text-sm text-gray-900">{bomba.empresa_telefone}</p>
                </div>
              )}
              
              {bomba.empresa_email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{bomba.empresa_email}</p>
                </div>
              )}
              
              <div>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/bombas-terceiras/empresas/${bomba.empresa_id}`)}
                >
                  Ver Empresa
                </Button>
              </div>
            </div>
          </div>
          
          {bomba.empresa_endereco && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Endereço</label>
              <p className="mt-1 text-sm text-gray-900">{bomba.empresa_endereco}</p>
            </div>
          )}
        </div>

        {/* Dialog de confirmação de exclusão */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Excluir Bomba"
          message={`Tem certeza que deseja excluir a bomba "${bomba.prefixo}"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
          loading={deleting}
        />
      </div>
    </Layout>
  )
}
