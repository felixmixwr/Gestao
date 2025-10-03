import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { usePagamentosReceberIntegrado } from '../../lib/pagamentos-receber-api-integrado'
import { PagamentoReceberIntegrado, FormaPagamento } from '../../lib/pagamentos-receber-api-integrado'
import { Select } from '../../components/Select'
import { toast } from '../../lib/toast-hooks'

export default function PagamentoDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pagamento, setPagamento] = useState<PagamentoReceberIntegrado | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const { buscarPagamentoIntegradoPorId, marcarComoPagoIntegrado, atualizarFormaPagamentoIntegrado } = usePagamentosReceberIntegrado()

  async function fetchPagamento() {
    if (!id) return
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 [PagamentoDetails-Integrado] Buscando pagamento:', id)
      const data = await buscarPagamentoIntegradoPorId(id)
      console.log('✅ [PagamentoDetails-Integrado] Pagamento carregado:', data)
      setPagamento(data)
    } catch (err: any) {
      console.error('❌ [PagamentoDetails-Integrado] Erro ao buscar pagamento:', err)
      setError(err?.message || 'Erro ao carregar pagamento')
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarComoPago = async () => {
    if (!pagamento) return
    
    try {
      console.log('🔍 [PagamentoDetails-Integrado] Marcando como pago:', pagamento.id)
      await marcarComoPagoIntegrado(pagamento.id, 'Pagamento confirmado pelo usuário')
      toast.success('Pagamento marcado como pago! Relatório sincronizado automaticamente.')
      setShowConfirmDialog(false)
      fetchPagamento() // Recarregar dados
    } catch (err: any) {
      console.error('❌ [PagamentoDetails-Integrado] Erro ao marcar como pago:', err)
      toast.error('Erro ao marcar pagamento como pago')
    }
  }

  const handleAtualizarFormaPagamento = async (novaForma: FormaPagamento) => {
    if (!pagamento) return
    
    try {
      console.log('🔍 [PagamentoDetails-Integrado] Atualizando forma de pagamento:', { id: pagamento.id, novaForma })
      await atualizarFormaPagamentoIntegrado(pagamento.id, novaForma)
      toast.success('Forma de pagamento atualizada com sucesso!')
      fetchPagamento() // Recarregar dados
    } catch (err: any) {
      console.error('❌ [PagamentoDetails-Integrado] Erro ao atualizar forma de pagamento:', err)
      toast.error('Erro ao atualizar forma de pagamento')
    }
  }

  useEffect(() => {
    fetchPagamento()
  }, [id])

  // Opções de forma de pagamento
  const FORMA_PAGAMENTO_OPTIONS = [
    { value: 'pix', label: 'PIX' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'a_vista', label: 'À Vista' }
  ]

  // Funções de formatação
  const formatarValor = (valor: number | undefined | null): string => {
    if (valor === undefined || valor === null) return 'R$ 0,00'
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const formatarData = (data: string | undefined | null): string => {
    if (!data) return 'N/A'
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aguardando':
        return 'bg-gray-100 text-gray-800'
      case 'proximo_vencimento':
        return 'bg-yellow-100 text-yellow-800'
      case 'vencido':
        return 'bg-red-100 text-red-800'
      case 'pago':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFormaPagamentoColor = (forma: FormaPagamento) => {
    switch (forma) {
      case 'sem_forma':
        return 'bg-yellow-100 text-yellow-800'
      case 'pix':
        return 'bg-blue-100 text-blue-800'
      case 'boleto':
        return 'bg-purple-100 text-purple-800'
      case 'a_vista':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFormaPagamentoTexto = (forma: FormaPagamento) => {
    switch (forma) {
      case 'sem_forma':
        return 'Sem forma'
      case 'pix':
        return 'PIX'
      case 'boleto':
        return 'Boleto'
      case 'a_vista':
        return 'À Vista'
      default:
        return (forma as string).toUpperCase()
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
            {pagamento.status_unificado !== 'pago' && (
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
                  {pagamento.forma_pagamento === 'sem_forma' ? (
                    <div className="mt-2">
                      <Select
                        options={FORMA_PAGAMENTO_OPTIONS}
                        value=""
                        onChange={(value) => handleAtualizarFormaPagamento(value as FormaPagamento)}
                        placeholder="Selecione a forma de pagamento"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Atualize a forma de pagamento para manter o histórico correto
                      </p>
                    </div>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFormaPagamentoColor(pagamento.forma_pagamento)}`}>
                      {getFormaPagamentoTexto(pagamento.forma_pagamento)}
                    </span>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pagamento.status_unificado)}`}>
                    {pagamento.status_unificado}
                    {pagamento.dias_ate_vencimento !== undefined && pagamento.dias_ate_vencimento !== null && (
                      <span className="ml-1">
                        ({pagamento.dias_ate_vencimento > 0 ? `${pagamento.dias_ate_vencimento} dias` : 
                          pagamento.dias_ate_vencimento === 0 ? 'hoje' : 
                          `${Math.abs(pagamento.dias_ate_vencimento)} dias atrás`})
                      </span>
                    )}
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

        {/* Informações do Relatório */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Relatório</h3>
            
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Número do Relatório</label>
                <p className="mt-1 text-sm text-gray-900">{pagamento.report_number}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Data do Relatório</label>
                <p className="mt-1 text-sm text-gray-900">{formatarData(pagamento.relatorio_data)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status do Relatório</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pagamento.relatorio_status.toLowerCase())}`}>
                  {pagamento.relatorio_status}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor do Relatório</label>
                <p className="mt-1 text-sm text-gray-900">{formatarValor(pagamento.relatorio_valor)}</p>
              </div>
            </div>

            {/* Informações de Trabalho */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Detalhes do Trabalho</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pagamento.client_rep_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Representante do Cliente</label>
                    <p className="mt-1 text-sm text-gray-900">{pagamento.client_rep_name}</p>
                  </div>
                )}
                
                {pagamento.whatsapp_digits && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                    <p className="mt-1 text-sm text-gray-900">{pagamento.whatsapp_digits}</p>
                  </div>
                )}
                
                {pagamento.work_address && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Endereço de Trabalho</label>
                    <p className="mt-1 text-sm text-gray-900">{pagamento.work_address}</p>
                  </div>
                )}
                
                {pagamento.realized_volume && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Volume Realizado</label>
                    <p className="mt-1 text-sm text-gray-900">{pagamento.realized_volume} m³</p>
                  </div>
                )}
              </div>
            </div>

            {/* Informações da Equipe */}
            {(pagamento.driver_name || pagamento.assistant1_name || pagamento.assistant2_name) && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Equipe de Trabalho</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pagamento.driver_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Motorista</label>
                      <p className="mt-1 text-sm text-gray-900">{pagamento.driver_name}</p>
                    </div>
                  )}
                  
                  {pagamento.assistant1_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Assistente 1</label>
                      <p className="mt-1 text-sm text-gray-900">{pagamento.assistant1_name}</p>
                    </div>
                  )}
                  
                  {pagamento.assistant2_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Assistente 2</label>
                      <p className="mt-1 text-sm text-gray-900">{pagamento.assistant2_name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informações da Nota Fiscal */}
        {pagamento.tem_nota_fiscal && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Nota Fiscal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Número da Nota</label>
                  <p className="mt-1 text-sm text-gray-900">{pagamento.numero_nota}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status da Nota</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pagamento.nf_status?.toLowerCase() || '')}`}>
                    {pagamento.nf_status}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Emissão</label>
                  <p className="mt-1 text-sm text-gray-900">{formatarData(pagamento.nf_data_emissao)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                  <p className="mt-1 text-sm text-gray-900">{formatarData(pagamento.nf_data_vencimento)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor da Nota</label>
                  <p className="mt-1 text-sm text-gray-900">{formatarValor(pagamento.nf_valor)}</p>
                </div>
                
                {pagamento.nf_anexo_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Anexo</label>
                    <a 
                      href={pagamento.nf_anexo_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Ver Anexo
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Informações de Controle */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações de Controle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Criado em</label>
                <p className="mt-1 text-sm text-gray-900">{formatarData(pagamento.pagamento_created_at)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Última atualização</label>
                <p className="mt-1 text-sm text-gray-900">{formatarData(pagamento.pagamento_updated_at)}</p>
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
