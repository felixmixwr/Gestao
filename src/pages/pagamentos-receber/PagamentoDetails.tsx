import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { usePagamentosReceber } from '../../lib/pagamentos-receber-api'
import { PagamentoReceberCompleto, getCorStatusPagamento, getCorFormaPagamento, formatarValor, formatarData, getTextoStatusComDias } from '../../types/pagamentos-receber'
import { toast } from '../../lib/toast-hooks'

export default function PagamentoDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pagamento, setPagamento] = useState<PagamentoReceberCompleto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const { buscarPagamentoPorId, marcarComoPago } = usePagamentosReceber()

  async function fetchPagamento() {
    if (!id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await buscarPagamentoPorId(id)
      setPagamento(data)
    } catch (err: any) {
      console.error('Erro ao buscar pagamento:', err)
      setError(err?.message || 'Erro ao carregar pagamento')
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarComoPago = async () => {
    if (!pagamento) return
    
    try {
      await marcarComoPago(pagamento.id, 'Pagamento confirmado pelo usuário')
      toast.success('Pagamento marcado como pago!')
      setShowConfirmDialog(false)
      fetchPagamento() // Recarregar dados
    } catch (err: any) {
      console.error('Erro ao marcar como pago:', err)
      toast.error('Erro ao marcar pagamento como pago')
    }
  }

  useEffect(() => {
    fetchPagamento()
  }, [id])

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      </Layout>
    )
  }

  if (error || !pagamento) {
    return (
      <GenericError 
        title="Erro ao carregar pagamento" 
        message={error || 'Pagamento não encontrado'} 
        onRetry={fetchPagamento} 
      />
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <button
                    onClick={() => navigate('/pagamentos-receber')}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    Pagamentos a Receber
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-4 text-sm font-medium text-gray-500">Detalhes</span>
                  </div>
                </li>
              </ol>
            </nav>
            <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Pagamento #{pagamento.id.slice(0, 8)}
            </h2>
          </div>
          <div className="mt-4 flex gap-3 md:ml-4 md:mt-0">
            {pagamento.status !== 'pago' && (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                Marcar como Pago
              </Button>
            )}
            <Button
              onClick={() => navigate('/pagamentos-receber')}
              variant="outline"
            >
              Voltar
            </Button>
          </div>
        </div>

        {/* Informações principais */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações do Cliente */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Cliente</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <p className="mt-1 text-sm text-gray-900">{pagamento.cliente_nome}</p>
                  </div>
                  
                  {pagamento.cliente_email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{pagamento.cliente_email}</p>
                    </div>
                  )}
                  
                  {pagamento.cliente_telefone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Telefone</label>
                      <p className="mt-1 text-sm text-gray-900">{pagamento.cliente_telefone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações da Empresa */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Empresa</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <p className="mt-1 text-sm text-gray-900">{pagamento.empresa_nome || 'Não informado'}</p>
                  </div>
                  
                  {pagamento.empresa_cnpj && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                      <p className="mt-1 text-sm text-gray-900">{pagamento.empresa_cnpj}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {pagamento.empresa_tipo === 'interna' ? 'Empresa Interna' : 
                       pagamento.empresa_tipo === 'terceira' ? 'Empresa Terceira' : 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações do Pagamento */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Pagamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor Total</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{formatarValor(pagamento.valor_total)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCorFormaPagamento(pagamento.forma_pagamento as any)}`}>
                    {pagamento.forma_pagamento.toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCorStatusPagamento(pagamento.status as any)}`}>
                    {getTextoStatusComDias(pagamento as any)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {pagamento.prazo_data && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                    <p className="mt-1 text-sm text-gray-900">{formatarData(pagamento.prazo_data)}</p>
                  </div>
                )}
                
                {pagamento.prazo_dias && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prazo em Dias</label>
                    <p className="mt-1 text-sm text-gray-900">{pagamento.prazo_dias} dias</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relatório Vinculado</label>
                  <p className="mt-1 text-sm text-gray-900">{formatarData(pagamento.relatorio_data)}</p>
                  <p className="text-xs text-gray-500">Valor do relatório: {formatarValor(pagamento.relatorio_valor)}</p>
                </div>
              </div>
            </div>
            
            {pagamento.observacoes && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <p className="mt-1 text-sm text-gray-900">{pagamento.observacoes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Informações de Controle */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações de Controle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Criado em</label>
                <p className="mt-1 text-sm text-gray-900">{formatarData(pagamento.created_at)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Última atualização</label>
                <p className="mt-1 text-sm text-gray-900">{formatarData(pagamento.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de confirmação */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onCancel={() => setShowConfirmDialog(false)}
        onConfirm={handleMarcarComoPago}
        title="Confirmar Pagamento"
        message="Tem certeza que deseja marcar este pagamento como pago? Esta ação não pode ser desfeita."
        confirmText="Marcar como Pago"
        cancelText="Cancelar"
      />
    </Layout>
  )
}
