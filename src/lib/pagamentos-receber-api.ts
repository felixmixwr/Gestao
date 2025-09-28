import { supabase } from './supabase'
import { 
  PagamentoReceber, 
  PagamentoReceberCompleto,
  CreatePagamentoReceberData,
  UpdatePagamentoReceberData,
  PagamentoReceberFilters,
  PagamentoReceberStats,
  StatusPagamento
} from '../types/pagamentos-receber'

/**
 * Serviço para operações de pagamentos a receber
 */
export class PagamentosReceberService {
  /**
   * Listar todos os pagamentos a receber com dados relacionados
   */
  static async listarPagamentos(filters?: PagamentoReceberFilters, forceRefresh = false): Promise<PagamentoReceberCompleto[]> {
    console.log('🔍 [PagamentosReceberAPI] Listando pagamentos com filtros:', filters, 'forceRefresh:', forceRefresh)
    
    // Usar a view original com cache-busting se necessário
    let query = supabase
      .from('view_pagamentos_receber_completo')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Adicionar cache-busting se forçado
    if (forceRefresh) {
      const timestamp = Date.now()
      query = query.gte('created_at', '1900-01-01') // Força re-execução da query
      console.log('🔄 [PagamentosReceberAPI] Forçando refresh com timestamp:', timestamp)
    }

    // Aplicar filtros
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters?.forma_pagamento && filters.forma_pagamento.length > 0) {
      query = query.in('forma_pagamento', filters.forma_pagamento)
    }

    if (filters?.cliente_id) {
      query = query.eq('cliente_id', filters.cliente_id)
    }

    if (filters?.empresa_id) {
      query = query.eq('empresa_id', filters.empresa_id)
    }

    if (filters?.empresa_tipo) {
      query = query.eq('empresa_tipo', filters.empresa_tipo)
    }

    if (filters?.data_inicio) {
      query = query.gte('prazo_data', filters.data_inicio)
    }

    if (filters?.data_fim) {
      query = query.lte('prazo_data', filters.data_fim)
    }

    if (filters?.valor_min) {
      query = query.gte('valor_total', filters.valor_min)
    }

    if (filters?.valor_max) {
      query = query.lte('valor_total', filters.valor_max)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ [PagamentosReceberAPI] Erro ao listar pagamentos:', error)
      throw new Error(`Erro ao listar pagamentos: ${error.message}`)
    }

    console.log('✅ [PagamentosReceberAPI] Pagamentos listados:', data?.length || 0)
    
    // A view já retorna os dados no formato correto
    const mappedData = data || []
    
    // Log do pagamento específico se estiver na lista
    if (mappedData) {
      const pagamentoEspecifico = mappedData.find(p => p.id === 'f259c024-a339-4b5d-8263-dd15df6f89da')
      if (pagamentoEspecifico) {
        console.log('🎯 [PagamentosReceberAPI] Pagamento específico encontrado:', {
          id: pagamentoEspecifico.id,
          status: pagamentoEspecifico.status,
          valor: pagamentoEspecifico.valor_total,
          updated_at: pagamentoEspecifico.updated_at
        })
      } else {
        console.log('❌ [PagamentosReceberAPI] Pagamento específico NÃO encontrado na lista')
      }
    }

    return mappedData
  }

  /**
   * Buscar pagamento por ID
   */
  static async buscarPagamentoPorId(id: string): Promise<PagamentoReceberCompleto | null> {
    const { data, error } = await supabase
      .from('view_pagamentos_receber_completo')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Erro ao buscar pagamento: ${error.message}`)
    }

    return data
  }

  /**
   * Criar novo pagamento
   */
  static async criarPagamento(data: CreatePagamentoReceberData): Promise<PagamentoReceber> {
    const { data: result, error } = await supabase
      .from('pagamentos_receber')
      .insert([data])
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar pagamento: ${error.message}`)
    }

    return result
  }

  /**
   * Atualizar pagamento
   */
  static async atualizarPagamento(data: UpdatePagamentoReceberData): Promise<PagamentoReceber> {
    const { id, ...updateData } = data

    const { data: result, error } = await supabase
      .from('pagamentos_receber')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar pagamento: ${error.message}`)
    }

    return result
  }

  /**
   * Atualizar apenas o status do pagamento
   */
  static async atualizarStatus(id: string, status: StatusPagamento, observacao?: string): Promise<PagamentoReceber> {
    console.log('🔍 [PagamentosReceberAPI] Atualizando status:', { id, status, observacao })
    
    const updateData: any = { status }
    
    if (observacao) {
      updateData.observacoes = observacao
    }

    console.log('🔍 [PagamentosReceberAPI] Dados para UPDATE:', updateData)

    const { data: result, error } = await supabase
      .from('pagamentos_receber')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ [PagamentosReceberAPI] Erro no UPDATE:', error)
      throw new Error(`Erro ao atualizar status: ${error.message}`)
    }

    console.log('✅ [PagamentosReceberAPI] Status atualizado com sucesso:', result)
    return result
  }

  /**
   * Marcar pagamento como pago
   */
  static async marcarComoPago(id: string, observacao?: string): Promise<PagamentoReceber> {
    return this.atualizarStatus(id, 'pago', observacao || 'Pagamento confirmado')
  }

  /**
   * Excluir pagamento
   */
  static async excluirPagamento(id: string): Promise<void> {
    const { error } = await supabase
      .from('pagamentos_receber')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir pagamento: ${error.message}`)
    }
  }

  /**
   * Obter estatísticas dos pagamentos
   */
  static async obterEstatisticas(): Promise<PagamentoReceberStats> {
    const { data, error } = await supabase
      .from('pagamentos_receber')
      .select('status, valor_total')

    if (error) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`)
    }

    const stats: PagamentoReceberStats = {
      total_pagamentos: data?.length || 0,
      total_valor: 0,
      aguardando: 0,
      proximo_vencimento: 0,
      vencido: 0,
      pago: 0,
      valor_aguardando: 0,
      valor_proximo_vencimento: 0,
      valor_vencido: 0,
      valor_pago: 0
    }

    data?.forEach(pagamento => {
      const valor = pagamento.valor_total || 0
      stats.total_valor += valor

      switch (pagamento.status) {
        case 'aguardando':
          stats.aguardando++
          stats.valor_aguardando += valor
          break
        case 'proximo_vencimento':
          stats.proximo_vencimento++
          stats.valor_proximo_vencimento += valor
          break
        case 'vencido':
          stats.vencido++
          stats.valor_vencido += valor
          break
        case 'pago':
          stats.pago++
          stats.valor_pago += valor
          break
      }
    })

    return stats
  }

  /**
   * Buscar pagamentos próximos do vencimento (próximos 3 dias)
   */
  static async buscarProximosVencimento(): Promise<PagamentoReceberCompleto[]> {
    const hoje = new Date()
    const proximos3Dias = new Date(hoje.getTime() + (3 * 24 * 60 * 60 * 1000))

    const { data, error } = await supabase
      .from('view_pagamentos_receber_completo')
      .select('*')
      .not('prazo_data', 'is', null)
      .gte('prazo_data', hoje.toISOString().split('T')[0])
      .lte('prazo_data', proximos3Dias.toISOString().split('T')[0])
      .in('status', ['aguardando', 'proximo_vencimento'])
      .order('prazo_data')

    if (error) {
      throw new Error(`Erro ao buscar próximos vencimentos: ${error.message}`)
    }

    return data || []
  }

  /**
   * Buscar pagamentos vencidos
   */
  static async buscarVencidos(): Promise<PagamentoReceberCompleto[]> {
    const hoje = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('view_pagamentos_receber_completo')
      .select('*')
      .not('prazo_data', 'is', null)
      .lt('prazo_data', hoje)
      .in('status', ['aguardando', 'proximo_vencimento'])
      .order('prazo_data')

    if (error) {
      throw new Error(`Erro ao buscar pagamentos vencidos: ${error.message}`)
    }

    return data || []
  }

  /**
   * Atualizar status automático baseado nas datas
   */
  static async atualizarStatusAutomatico(): Promise<void> {
    const hoje = new Date().toISOString().split('T')[0]
    const proximos3Dias = new Date(new Date().getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]

    // Atualizar para vencido
    const { error: vencidoError } = await supabase
      .from('pagamentos_receber')
      .update({ status: 'vencido' })
      .lt('prazo_data', hoje)
      .in('status', ['aguardando', 'proximo_vencimento'])

    if (vencidoError) {
      throw new Error(`Erro ao atualizar status vencido: ${vencidoError.message}`)
    }

    // Atualizar para próximo do vencimento
    const { error: proximoError } = await supabase
      .from('pagamentos_receber')
      .update({ status: 'proximo_vencimento' })
      .gte('prazo_data', hoje)
      .lte('prazo_data', proximos3Dias)
      .eq('status', 'aguardando')

    if (proximoError) {
      throw new Error(`Erro ao atualizar status próximo vencimento: ${proximoError.message}`)
    }
  }
}

/**
 * Hook personalizado para usar o serviço de pagamentos
 */
export function usePagamentosReceber() {
  const listarPagamentos = async (filters?: PagamentoReceberFilters, forceRefresh = false) => {
    return PagamentosReceberService.listarPagamentos(filters, forceRefresh)
  }

  const buscarPagamentoPorId = async (id: string) => {
    return PagamentosReceberService.buscarPagamentoPorId(id)
  }

  const criarPagamento = async (data: CreatePagamentoReceberData) => {
    return PagamentosReceberService.criarPagamento(data)
  }

  const atualizarPagamento = async (data: UpdatePagamentoReceberData) => {
    return PagamentosReceberService.atualizarPagamento(data)
  }

  const marcarComoPago = async (id: string, observacao?: string) => {
    return PagamentosReceberService.marcarComoPago(id, observacao)
  }

  const excluirPagamento = async (id: string) => {
    return PagamentosReceberService.excluirPagamento(id)
  }

  const obterEstatisticas = async () => {
    return PagamentosReceberService.obterEstatisticas()
  }

  const buscarProximosVencimento = async () => {
    return PagamentosReceberService.buscarProximosVencimento()
  }

  const buscarVencidos = async () => {
    return PagamentosReceberService.buscarVencidos()
  }

  return {
    listarPagamentos,
    buscarPagamentoPorId,
    criarPagamento,
    atualizarPagamento,
    marcarComoPago,
    excluirPagamento,
    obterEstatisticas,
    buscarProximosVencimento,
    buscarVencidos
  }
}
