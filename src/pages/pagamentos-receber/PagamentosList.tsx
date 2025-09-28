import { useEffect, useState } from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { PagamentoReceberCard } from '../../components/PagamentoReceberCard'
import { PagamentoReceberStatsComponent } from '../../components/PagamentoReceberStats'
import { ForceUpdateButton } from '../../components/ForceUpdateButton'
import { usePagamentosReceber } from '../../lib/pagamentos-receber-api'
import { PagamentoReceberCompleto, FormaPagamento, PagamentoReceberStats } from '../../types/pagamentos-receber'
import { toast } from '../../lib/toast-hooks'

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'aguardando', label: 'Aguardando' },
  { value: 'pago', label: 'Pago' },
  { value: 'vencido', label: 'Vencido' }
]

const FORMA_PAGAMENTO_FILTER_OPTIONS = [
  { value: '', label: 'Todas as formas' },
  { value: 'sem_forma', label: 'Sem forma de pagamento' },
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'a_vista', label: 'À Vista' }
]

export default function PagamentosList() {
  const { listarPagamentos, marcarComoPago, atualizarPagamento } = usePagamentosReceber()
  
  const [pagamentos, setPagamentos] = useState<PagamentoReceberCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    status: '',
    forma_pagamento: '',
    busca: ''
  })

  const fetchPagamentos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 [PagamentosList] Buscando pagamentos...')
      const data = await listarPagamentos()
      console.log('📋 [PagamentosList] Pagamentos recebidos:', data.length)
      
      // Log detalhado dos pagamentos
      data.forEach((pagamento, index) => {
        if (index < 3) { // Log apenas os primeiros 3 para não poluir
          console.log(`  ${index + 1}. ID: ${pagamento.id}, Status: ${pagamento.status}, Valor: ${pagamento.valor_total}`)
        }
      })
      
      setPagamentos(data)
      console.log('✅ [PagamentosList] Estado dos pagamentos atualizado')
      
    } catch (err: any) {
      console.error('❌ [PagamentosList] Erro ao buscar pagamentos:', err)
      setError(err?.message || 'Erro ao carregar pagamentos')
      toast.error('Erro ao carregar pagamentos')
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarComoPago = async (id: string) => {
    try {
      console.log('🔍 [PagamentosList] Iniciando marcação como pago para ID:', id)
      
      const observacao = `Pagamento confirmado em ${new Date().toLocaleDateString('pt-BR')}`
      console.log('🔍 [PagamentosList] Observação:', observacao)
      
      // Atualizar diretamente no estado local primeiro
      setPagamentos(prev => 
        prev.map(pagamento => 
          pagamento.id === id 
            ? { ...pagamento, status: 'pago' as any, observacoes: observacao, updated_at: new Date().toISOString() }
            : pagamento
        )
      )
      
      console.log('✅ [PagamentosList] Estado local atualizado')
      
      // Depois fazer a chamada da API
      const resultado = await marcarComoPago(id, observacao)
      console.log('✅ [PagamentosList] Resultado da API:', resultado)
      
      toast.success('Pagamento marcado como pago!')
      
      // Aguardar um pouco e depois recarregar para garantir consistência
      setTimeout(async () => {
        console.log('🔄 [PagamentosList] Recarregando lista de pagamentos com forceRefresh...')
        try {
          const data = await listarPagamentos(undefined, true)
          setPagamentos(data)
          console.log('✅ [PagamentosList] Lista recarregada com sucesso')
        } catch (err) {
          console.error('❌ [PagamentosList] Erro ao recarregar:', err)
        }
      }, 1000)
      
    } catch (err: any) {
      console.error('❌ [PagamentosList] Erro ao marcar como pago:', err)
      console.error('❌ [PagamentosList] Detalhes do erro:', err.message)
      
      // Reverter o estado local em caso de erro
      await fetchPagamentos()
      
      toast.error(`Erro ao marcar pagamento como pago: ${err.message}`)
    }
  }

  const handleAtualizarFormaPagamento = async (id: string, novaForma: FormaPagamento) => {
    try {
      await atualizarPagamento({ id, forma_pagamento: novaForma })
      toast.success('Forma de pagamento atualizada com sucesso!')
      
      // Atualizar a lista
      await fetchPagamentos()
    } catch (err: any) {
      console.error('Erro ao atualizar forma de pagamento:', err)
      toast.error('Erro ao atualizar forma de pagamento')
    }
  }

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
  }

  // Função de teste para forçar atualização
  const handleForceUpdate = async () => {
    console.log('🔄 [PagamentosList] Forçando atualização completa...')
    
    try {
      setLoading(true)
      
      // Limpar estado
      setPagamentos([])
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Recarregar com forceRefresh = true
      const data = await listarPagamentos(undefined, true)
      console.log('✅ [PagamentosList] Dados recarregados com forceRefresh:', data.length)
      
      setPagamentos(data)
      toast.success('Lista atualizada com sucesso!')
      
    } catch (err: any) {
      console.error('❌ [PagamentosList] Erro na força atualização:', err)
      toast.error('Erro ao atualizar lista')
    } finally {
      setLoading(false)
    }
  }

  // Calcular estatísticas dos pagamentos
  const calcularEstatisticas = (pagamentos: PagamentoReceberCompleto[]): PagamentoReceberStats => {
    const hoje = new Date()
    
    const stats = pagamentos.reduce((acc, pagamento) => {
      acc.total_pagamentos++
      acc.total_valor += pagamento.valor_total
      
      if (pagamento.status === 'aguardando') {
        acc.aguardando++
        acc.valor_aguardando += pagamento.valor_total
      } else if (pagamento.status === 'pago') {
        acc.pago++
        acc.valor_pago += pagamento.valor_total
      } else if (pagamento.status === 'vencido') {
        acc.vencido++
        acc.valor_vencido += pagamento.valor_total
      }
      
      // Verificar próximo vencimento (próximos 7 dias)
      if (pagamento.prazo_data && pagamento.status === 'aguardando') {
        const dataVencimento = new Date(pagamento.prazo_data)
        const diffDias = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDias >= 0 && diffDias <= 7) {
          acc.proximo_vencimento++
          acc.valor_proximo_vencimento += pagamento.valor_total
        }
      }
      
      return acc
    }, {
      total_pagamentos: 0,
      total_valor: 0,
      aguardando: 0,
      valor_aguardando: 0,
      proximo_vencimento: 0,
      valor_proximo_vencimento: 0,
      vencido: 0,
      valor_vencido: 0,
      pago: 0,
      valor_pago: 0
    })
    
    return stats
  }

  // Filtrar pagamentos baseado nos filtros
  const pagamentosFiltrados = pagamentos.filter(pagamento => {
    const matchStatus = !filtros.status || pagamento.status === filtros.status
    const matchForma = !filtros.forma_pagamento || pagamento.forma_pagamento === filtros.forma_pagamento
    const matchBusca = !filtros.busca || 
      pagamento.cliente_nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      pagamento.empresa_nome?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      pagamento.id.toLowerCase().includes(filtros.busca.toLowerCase())
    
    return matchStatus && matchForma && matchBusca
  })

  useEffect(() => {
    fetchPagamentos()
  }, [])

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
        title="Erro ao carregar pagamentos" 
        message={error} 
        onRetry={fetchPagamentos} 
      />
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Pagamentos a Receber
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerencie todos os pagamentos pendentes e recebidos
            </p>
          </div>
          <div className="mt-4 flex gap-3 md:ml-4 md:mt-0">
            <Button
              onClick={fetchPagamentos}
              variant="outline"
            >
              Atualizar
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <PagamentoReceberStatsComponent stats={calcularEstatisticas(pagamentos)} />

        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Cliente, empresa ou ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filtros.busca}
                onChange={(e) => handleFiltroChange('busca', e.target.value)}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                options={STATUS_FILTER_OPTIONS}
                value={filtros.status}
                onChange={(value) => handleFiltroChange('status', value)}
              />
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de Pagamento
              </label>
              <Select
                options={FORMA_PAGAMENTO_FILTER_OPTIONS}
                value={filtros.forma_pagamento}
                onChange={(value) => handleFiltroChange('forma_pagamento', value)}
              />
            </div>

            {/* Limpar Filtros */}
            <div className="flex items-end">
              <Button
                onClick={() => setFiltros({ status: '', forma_pagamento: '', busca: '' })}
                variant="outline"
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Pagamentos */}
        <div className="space-y-4">
          {pagamentosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pagamento encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {pagamentos.length === 0 
                  ? 'Não há pagamentos cadastrados ainda.'
                  : 'Tente ajustar os filtros para encontrar o que procura.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Contador de resultados */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Mostrando {pagamentosFiltrados.length} de {pagamentos.length} pagamentos
                </p>
              </div>

              {/* Cards de Pagamentos */}
              <div className="grid grid-cols-1 gap-4">
                {pagamentosFiltrados.map((pagamento) => (
                  <PagamentoReceberCard
                    key={pagamento.id}
                    pagamento={pagamento}
                    onMarcarComoPago={handleMarcarComoPago}
                    onAtualizarFormaPagamento={handleAtualizarFormaPagamento}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Botão de força atualização */}
      <ForceUpdateButton 
        onForceUpdate={handleForceUpdate}
        loading={loading}
      />
    </Layout>
  )
}
