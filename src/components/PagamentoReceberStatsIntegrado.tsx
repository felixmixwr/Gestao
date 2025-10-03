import { KPIsFinanceirosIntegrados } from '../lib/pagamentos-receber-api-integrado'

interface PagamentoReceberStatsIntegradoProps {
  kpis: KPIsFinanceirosIntegrados
}

export function PagamentoReceberStatsIntegrado({ kpis }: PagamentoReceberStatsIntegradoProps) {
  const formatarValor = (valor: number | undefined): string => {
    if (valor === undefined || valor === null) {
      return 'R$ 0,00'
    }
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  // Debug: Log dos KPIs recebidos
  console.log('🔍 [PagamentoReceberStatsIntegrado] KPIs recebidos:', kpis)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total de Bombeamentos Feitos */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Total de Bombeamentos Feitos</p>
            <p className="text-2xl font-semibold text-gray-900">{kpis.total_bombeamentos_feitos}</p>
            <p className="text-xs text-gray-500">{formatarValor(kpis.valor_total_bombeamentos)}</p>
          </div>
        </div>
      </div>

      {/* Faturamento Hoje */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Faturamento Hoje</p>
            <p className="text-2xl font-semibold text-gray-900">{formatarValor(kpis.faturamento_hoje)}</p>
            <p className="text-xs text-gray-500">Mês: {formatarValor(kpis.faturamento_mes)}</p>
          </div>
        </div>
      </div>

      {/* Aguardando */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Aguardando</p>
            <p className="text-2xl font-semibold text-gray-900">{kpis.relatorios_aguardando_pagamento}</p>
            <p className="text-xs text-gray-500">{formatarValor(kpis.valor_relatorios_aguardando_pagamento || 0)}</p>
          </div>
        </div>
      </div>

      {/* Próximo Vencimento */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Próximo Vencimento</p>
            <p className="text-2xl font-semibold text-gray-900">{kpis.pagamentos_proximo_vencimento}</p>
            <p className="text-xs text-gray-500">{formatarValor(kpis.valor_proximo_vencimento)}</p>
          </div>
        </div>
      </div>

      {/* Vencidos */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Vencidos</p>
            <p className="text-2xl font-semibold text-gray-900">{kpis.pagamentos_vencidos}</p>
            <p className="text-xs text-gray-500">{formatarValor(kpis.valor_vencido)}</p>
          </div>
        </div>
      </div>

      {/* Pagos */}
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
            <p className="text-sm font-medium text-gray-500">Pagos</p>
            <p className="text-2xl font-semibold text-gray-900">{kpis.pagamentos_pagos}</p>
            <p className="text-xs text-gray-500">{formatarValor(kpis.valor_pago)}</p>
          </div>
        </div>
      </div>

      {/* Relatórios Pendentes */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Relatórios Pendentes</p>
            <p className="text-2xl font-semibold text-gray-900">{kpis.relatorios_pendentes}</p>
            <p className="text-xs text-gray-500">Pagos: {kpis.relatorios_pagos}</p>
          </div>
        </div>
      </div>

      {/* Notas Fiscais */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Notas Fiscais</p>
            <p className="text-2xl font-semibold text-gray-900">{kpis.notas_faturadas}</p>
            <p className="text-xs text-gray-500">Pagas: {kpis.notas_pagas}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
