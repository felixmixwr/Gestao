import { Link } from 'react-router-dom'
import { PagamentoReceberIntegrado, FormaPagamento } from '../lib/pagamentos-receber-api-integrado'

interface PagamentoReceberCardIntegradoProps {
  pagamento: PagamentoReceberIntegrado
  onMarcarComoPago?: (id: string) => void
  onAtualizarFormaPagamento?: (id: string, novaForma: FormaPagamento) => void
}

export function PagamentoReceberCardIntegrado({ 
  pagamento, 
  onMarcarComoPago, 
  onAtualizarFormaPagamento 
}: PagamentoReceberCardIntegradoProps) {
  
  const handleMarcarComoPago = () => {
    if (onMarcarComoPago) {
      onMarcarComoPago(pagamento.id)
    }
  }

  const handleAtualizarFormaPagamento = (novaForma: FormaPagamento) => {
    if (onAtualizarFormaPagamento) {
      onAtualizarFormaPagamento(pagamento.id, novaForma)
    }
  }

  const formatarValor = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const formatarData = (data: string): string => {
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
        return forma.toUpperCase()
    }
  }

  const getStatusTexto = (status: string, diasVencimento?: number) => {
    switch (status) {
      case 'aguardando':
        if (diasVencimento !== undefined) {
          if (diasVencimento > 0) return `Aguardando (${diasVencimento} dias)`
          if (diasVencimento === 0) return 'Vence hoje'
          return 'Aguardando'
        }
        return 'Aguardando'
      case 'proximo_vencimento':
        if (diasVencimento !== undefined) {
          if (diasVencimento > 0) return `Vence em ${diasVencimento} dias`
          if (diasVencimento === 0) return 'Vence hoje'
        }
        return 'Próximo vencimento'
      case 'vencido':
        if (diasVencimento !== undefined && diasVencimento < 0) {
          return `Vencido há ${Math.abs(diasVencimento)} dias`
        }
        return 'Vencido'
      case 'pago':
        return 'Pago'
      default:
        return status
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header compacto */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {pagamento.cliente_nome || 'Cliente não informado'}
              </h3>
              <p className="text-xs text-gray-500">
                {pagamento.empresa_nome || 'Empresa não informada'}
              </p>
            </div>
          </div>
          
          {/* Status badges compactos */}
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pagamento.status_unificado)}`}>
              {getStatusTexto(pagamento.status_unificado, pagamento.dias_ate_vencimento)}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getFormaPagamentoColor(pagamento.forma_pagamento)}`}>
              {getFormaPagamentoTexto(pagamento.forma_pagamento)}
            </span>
          </div>
        </div>
      </div>

      {/* Conteúdo compacto */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-3 mb-3">
          {/* Valor */}
          <div className="bg-gray-50 rounded-md p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Valor</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{formatarValor(pagamento.valor_total)}</p>
          </div>

          {/* Relatório */}
          <div className="bg-gray-50 rounded-md p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Relatório</span>
            </div>
            <p className="text-xs font-medium text-gray-900">{pagamento.report_number}</p>
            <p className="text-xs text-gray-500">{formatarData(pagamento.relatorio_data)}</p>
          </div>

          {/* Vencimento */}
          {pagamento.prazo_data && (
            <div className="bg-gray-50 rounded-md p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vencimento</span>
              </div>
              <p className="text-xs font-medium text-gray-900">{formatarData(pagamento.prazo_data)}</p>
            </div>
          )}
        </div>

        {/* Informações adicionais */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Nota Fiscal */}
          {pagamento.tem_nota_fiscal && (
            <div className="bg-blue-50 rounded-md p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Nota Fiscal</span>
              </div>
              <p className="text-xs font-medium text-blue-900">{pagamento.numero_nota}</p>
              <p className="text-xs text-blue-600">{formatarData(pagamento.nf_data_emissao || '')}</p>
            </div>
          )}

          {/* Status do Relatório */}
          <div className="bg-gray-50 rounded-md p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status Relatório</span>
            </div>
            <p className="text-xs font-medium text-gray-900">{pagamento.relatorio_status}</p>
          </div>
        </div>

        {/* Data de criação compacta */}
        <div className="text-xs text-gray-400 mb-3">
          Criado em {formatarData(pagamento.pagamento_created_at)}
        </div>
      </div>

      {/* Ações compactas */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <Link 
            to={`/pagamentos-receber/${pagamento.id}`}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Ver detalhes
          </Link>
          
          <div className="flex items-center gap-1.5">
            {/* Sempre mostrar opção de alterar forma de pagamento se for 'sem_forma' */}
            {pagamento.forma_pagamento === 'sem_forma' && (
              <select
                onChange={(e) => handleAtualizarFormaPagamento(e.target.value as FormaPagamento)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                defaultValue=""
              >
                <option value="" disabled>Atualizar forma</option>
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
                <option value="a_vista">À Vista</option>
              </select>
            )}
            
            <Link 
              to={`/pagamentos-receber/${pagamento.id}/edit`}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </Link>
            
            {/* Mostrar botão "Marcar como Pago" apenas se não estiver pago */}
            {pagamento.status_unificado !== 'pago' && (
              <button
                onClick={handleMarcarComoPago}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Marcar como Pago
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
