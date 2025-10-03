import { useEffect, useState } from 'react'
import { Layout } from '../../components/Layout'
import { Button } from '../../components/Button'
import { Select } from '../../components/Select'
import { Loading } from '../../components/Loading'
import { GenericError } from '../errors/GenericError'
import { PagamentoReceberCardIntegrado } from '../../components/PagamentoReceberCardIntegrado'
import { PagamentoReceberStatsIntegrado } from '../../components/PagamentoReceberStatsIntegrado'
import { usePagamentosReceberIntegrado } from '../../lib/pagamentos-receber-api-integrado'
import { PagamentoReceberIntegrado, KPIsFinanceirosIntegrados, FormaPagamento } from '../../lib/pagamentos-receber-api-integrado'
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

const NOTA_FISCAL_FILTER_OPTIONS = [
  { value: '', label: 'Todas as situações' },
  { value: 'com_nota', label: 'Com nota fiscal' },
  { value: 'sem_nota', label: 'Sem nota fiscal' }
]

export default function PagamentosList() {
  const { 
    listarPagamentosIntegrados, 
    marcarComoPagoIntegrado, 
    atualizarFormaPagamentoIntegrado,
    obterKPIsIntegrados
  } = usePagamentosReceberIntegrado()
  
  const [pagamentos, setPagamentos] = useState<PagamentoReceberIntegrado[]>([])
  const [kpis, setKpis] = useState<KPIsFinanceirosIntegrados | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para extrair opções únicas de clientes
  const getClientesOptions = () => {
    const clientesUnicos = Array.from(
      new Set(pagamentos.map(p => p.cliente_nome).filter(Boolean))
    ).sort()
    
    return [
      { value: '', label: 'Todos os clientes' },
      ...clientesUnicos.map(cliente => ({ value: cliente!, label: cliente! }))
    ]
  }

  // Função para extrair opções únicas de empresas
  const getEmpresasOptions = () => {
    const empresasUnicas = Array.from(
      new Set(pagamentos.map(p => p.empresa_nome).filter(Boolean))
    ).sort()
    
    return [
      { value: '', label: 'Todas as empresas' },
      ...empresasUnicas.map(empresa => ({ value: empresa!, label: empresa! }))
    ]
  }

  // Função para extrair opções únicas de bombas
  const getBombasOptions = () => {
    // Criar um mapa único de bombas com identificação completa
    const bombasMap = new Map<string, { prefix: string; model?: string; brand?: string }>()
    
    pagamentos.forEach(p => {
      if (p.bomba_prefix) {
        const key = p.bomba_prefix
        if (!bombasMap.has(key)) {
          bombasMap.set(key, {
            prefix: p.bomba_prefix,
            model: p.bomba_model,
            brand: p.bomba_brand
          })
        }
      }
    })
    
    // Converter para array e ordenar
    const bombasUnicas = Array.from(bombasMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([prefix, data]) => {
        // Criar label descritivo
        let label = prefix
        if (data.brand && data.model) {
          label = `${prefix} - ${data.brand} ${data.model}`
        } else if (data.brand) {
          label = `${prefix} - ${data.brand}`
        } else if (data.model) {
          label = `${prefix} - ${data.model}`
        }
        
        return { value: prefix, label }
      })
    
    return [
      { value: '', label: 'Todas as bombas' },
      ...bombasUnicas
    ]
  }
  const [filtros, setFiltros] = useState({
    status: '',
    forma_pagamento: '',
    busca: '',
    empresa: '',
    cliente: '',
    bomba: '',
    nota_fiscal: ''
  })

  const fetchPagamentos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 [PagamentosList-Integrado] Buscando pagamentos e KPIs...')
      
      // Buscar pagamentos e KPIs em paralelo
      const [pagamentosData, kpisData] = await Promise.all([
        listarPagamentosIntegrados(),
        obterKPIsIntegrados()
      ])
      
      console.log('📋 [PagamentosList-Integrado] Pagamentos recebidos:', pagamentosData.length)
      console.log('📊 [PagamentosList-Integrado] KPIs recebidos:', kpisData)
      
      // Log detalhado dos pagamentos
      pagamentosData.forEach((pagamento, index) => {
        if (index < 3) { // Log apenas os primeiros 3 para não poluir
          console.log(`  ${index + 1}. ID: ${pagamento.id}, Status: ${pagamento.status_unificado}, Valor: ${pagamento.valor_total}`)
        }
      })
      
      setPagamentos(pagamentosData)
      setKpis(kpisData)
      console.log('✅ [PagamentosList-Integrado] Estado atualizado com sucesso')
      
    } catch (err: any) {
      console.error('❌ [PagamentosList-Integrado] Erro ao buscar dados:', err)
      setError(err?.message || 'Erro ao carregar pagamentos')
      toast.error('Erro ao carregar pagamentos')
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarComoPago = async (id: string) => {
    try {
      console.log('🔍 [PagamentosList-Integrado] Iniciando marcação como pago para ID:', id)
      
      const observacao = `Pagamento confirmado em ${new Date().toLocaleDateString('pt-BR')}`
      console.log('🔍 [PagamentosList-Integrado] Observação:', observacao)
      
      // Atualizar diretamente no estado local primeiro
      setPagamentos(prev => 
        prev.map(pagamento => 
          pagamento.id === id 
            ? { ...pagamento, status_unificado: 'pago' as any, observacoes: observacao, pagamento_updated_at: new Date().toISOString() }
            : pagamento
        )
      )
      
      console.log('✅ [PagamentosList-Integrado] Estado local atualizado')
      
      // Depois fazer a chamada da API integrada
      const resultado = await marcarComoPagoIntegrado(id, observacao)
      console.log('✅ [PagamentosList-Integrado] Resultado da API:', resultado)
      
      toast.success('Pagamento marcado como pago! Relatório sincronizado automaticamente.')
      
      // Aguardar um pouco e depois recarregar para garantir consistência
      setTimeout(async () => {
        console.log('🔄 [PagamentosList-Integrado] Recarregando dados integrados...')
        try {
          await fetchPagamentos()
          console.log('✅ [PagamentosList-Integrado] Dados recarregados com sucesso')
        } catch (err) {
          console.error('❌ [PagamentosList-Integrado] Erro ao recarregar:', err)
        }
      }, 1000)
      
    } catch (err: any) {
      console.error('❌ [PagamentosList-Integrado] Erro ao marcar como pago:', err)
      console.error('❌ [PagamentosList-Integrado] Detalhes do erro:', err.message)
      
      // Reverter o estado local em caso de erro
      await fetchPagamentos()
      
      toast.error(`Erro ao marcar pagamento como pago: ${err.message}`)
    }
  }

  const handleAtualizarFormaPagamento = async (id: string, novaForma: FormaPagamento) => {
    try {
      await atualizarFormaPagamentoIntegrado(id, novaForma)
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


  // Filtrar pagamentos baseado nos filtros
  const pagamentosFiltrados = pagamentos.filter(pagamento => {
    const matchStatus = !filtros.status || pagamento.status_unificado === filtros.status
    const matchForma = !filtros.forma_pagamento || pagamento.forma_pagamento === filtros.forma_pagamento
    const matchBusca = !filtros.busca || 
      pagamento.cliente_nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      pagamento.empresa_nome?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      pagamento.report_number.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      pagamento.numero_nota?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      pagamento.id.toLowerCase().includes(filtros.busca.toLowerCase())
    
    // Filtros específicos (comparação exata)
    const matchEmpresa = !filtros.empresa || pagamento.empresa_nome === filtros.empresa
    const matchCliente = !filtros.cliente || pagamento.cliente_nome === filtros.cliente
    const matchBomba = !filtros.bomba || pagamento.bomba_prefix === filtros.bomba
    
    const matchNotaFiscal = !filtros.nota_fiscal || 
      (filtros.nota_fiscal === 'com_nota' && pagamento.tem_nota_fiscal) ||
      (filtros.nota_fiscal === 'sem_nota' && !pagamento.tem_nota_fiscal)
    
    return matchStatus && matchForma && matchBusca && matchEmpresa && matchCliente && matchBomba && matchNotaFiscal
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

        {/* Estatísticas Integradas */}
        {kpis && <PagamentoReceberStatsIntegrado kpis={kpis} />}

        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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

            {/* Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa
              </label>
              <Select
                options={getEmpresasOptions()}
                value={filtros.empresa}
                onChange={(value) => handleFiltroChange('empresa', value)}
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <Select
                options={getClientesOptions()}
                value={filtros.cliente}
                onChange={(value) => handleFiltroChange('cliente', value)}
              />
            </div>

            {/* Bomba */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bomba
              </label>
              <Select
                options={getBombasOptions()}
                value={filtros.bomba}
                onChange={(value) => handleFiltroChange('bomba', value)}
              />
            </div>

            {/* Nota Fiscal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nota Fiscal
              </label>
              <Select
                options={NOTA_FISCAL_FILTER_OPTIONS}
                value={filtros.nota_fiscal}
                onChange={(value) => handleFiltroChange('nota_fiscal', value)}
              />
            </div>

            {/* Limpar Filtros */}
            <div className="flex items-end">
              <Button
                onClick={() => setFiltros({ 
                  status: '', 
                  forma_pagamento: '', 
                  busca: '',
                  empresa: '',
                  cliente: '',
                  bomba: '',
                  nota_fiscal: ''
                })}
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

              {/* Cards de Pagamentos Integrados */}
              <div className="grid grid-cols-1 gap-4">
                {pagamentosFiltrados.map((pagamento) => (
                  <PagamentoReceberCardIntegrado
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
    </Layout>
  )
}
