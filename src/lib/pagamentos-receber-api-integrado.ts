import { supabase } from './supabase'
import { 
  PagamentoReceber, 
  PagamentoReceberCompleto,
  CreatePagamentoReceberData,
  UpdatePagamentoReceberData,
  PagamentoReceberFilters,
  PagamentoReceberStats,
  StatusPagamento,
  FormaPagamento
} from '../types/pagamentos-receber'

// Re-exportar tipos para facilitar importação
export type { FormaPagamento, StatusPagamento } from '../types/pagamentos-receber'

// Interface para dados integrados
export interface PagamentoReceberIntegrado {
  // Dados do pagamento
  id: string
  relatorio_id: string
  cliente_id: string
  empresa_id?: string
  empresa_tipo?: string
  valor_total: number
  forma_pagamento: FormaPagamento
  prazo_data?: string
  prazo_dias?: number
  pagamento_status: StatusPagamento
  observacoes?: string
  pagamento_created_at: string
  pagamento_updated_at: string
  
  // Dados do cliente (GARANTIDOS)
  cliente_nome: string  // Sempre preenchido, mesmo que seja "Cliente não informado"
  cliente_email?: string
  cliente_telefone?: string
  
  // Dados do relatório
  report_number: string
  relatorio_data: string
  relatorio_valor: number
  relatorio_status: string
  client_rep_name?: string
  whatsapp_digits?: string
  work_address?: string
  driver_name?: string
  assistant1_name?: string
  assistant2_name?: string
  realized_volume?: number
  
  // Dados da empresa (GARANTIDOS)
  empresa_nome: string  // Sempre preenchido, mesmo que seja "Empresa não informada"
  empresa_cnpj?: string
  
  // Dados da bomba
  bomba_prefix?: string
  bomba_model?: string
  bomba_brand?: string
  
  // Dados da nota fiscal
  nota_fiscal_id?: string
  numero_nota?: string
  nf_data_emissao?: string
  nf_data_vencimento?: string
  nf_valor?: number
  nf_status?: string
  nf_anexo_url?: string
  
  // Campos calculados
  status_unificado: StatusPagamento
  tem_nota_fiscal: boolean
  relatorio_pago: boolean
  pagamento_pago: boolean
  dias_ate_vencimento?: number
}

// Interface para KPIs integrados
export interface KPIsFinanceirosIntegrados {
  // Pagamentos
  pagamentos_aguardando: number
  pagamentos_pagos: number
  pagamentos_vencidos: number
  pagamentos_proximo_vencimento: number
  
  // Valores
  valor_aguardando: number
  valor_pago: number
  valor_vencido: number
  valor_proximo_vencimento: number
  
  // Faturamento
  faturamento_hoje: number
  faturamento_mes: number
  
  // Relatórios (AJUSTADOS)
  relatorios_aguardando_pagamento: number  // NOVO: relatórios com status AGUARDANDO_PAGAMENTO
  valor_relatorios_aguardando_pagamento?: number  // NOVO: valor dos relatórios AGUARDANDO_PAGAMENTO (opcional temporariamente)
  relatorios_pendentes: number             // AJUSTADO: relatórios que não estão PAGO nem AGUARDANDO_PAGAMENTO
  relatorios_pagos: number
  
  // Notas Fiscais
  notas_faturadas: number
  notas_pagas: number
  
  // Métricas calculadas (AJUSTADAS)
  total_bombeamentos_feitos: number        // NOVO: total de todos os relatórios
  valor_total_bombeamentos: number         // NOVO: valor total de todos os relatórios
  valor_total_pagamentos: number           // MANTIDO para compatibilidade
  total_pagamentos: number                 // MANTIDO para compatibilidade
  
  // Timestamp
  consultado_em: string
}

/**
 * Serviço integrado para operações de pagamentos a receber
 */
export class PagamentosReceberServiceIntegrado {
  /**
   * Listar todos os pagamentos com dados integrados
   */
  static async listarPagamentosIntegrados(filters?: PagamentoReceberFilters, forceRefresh = false): Promise<PagamentoReceberIntegrado[]> {
    console.log('🔍 [PagamentosReceberAPI-Integrado] Listando pagamentos integrados com filtros:', filters, 'forceRefresh:', forceRefresh)
    
    let query = supabase
      .from('view_pagamentos_receber_integrado')
      .select('*')
      .order('pagamento_created_at', { ascending: false })
    
    // Adicionar cache-busting se forçado
    if (forceRefresh) {
      const timestamp = Date.now()
      query = query.gte('pagamento_created_at', '1900-01-01') // Força re-execução da query
      console.log('🔄 [PagamentosReceberAPI-Integrado] Forçando refresh com timestamp:', timestamp)
    }

    // Aplicar filtros
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status_unificado', filters.status)
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
      console.error('❌ [PagamentosReceberAPI-Integrado] Erro ao listar pagamentos:', error)
      throw new Error(`Erro ao listar pagamentos: ${error.message}`)
    }

    console.log('✅ [PagamentosReceberAPI-Integrado] Pagamentos listados:', data?.length || 0)
    return data || []
  }

  /**
   * Buscar pagamento integrado por ID
   */
  static async buscarPagamentoIntegradoPorId(id: string): Promise<PagamentoReceberIntegrado | null> {
    const { data, error } = await supabase
      .from('view_pagamentos_receber_integrado')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Erro ao buscar pagamento: ${error.message}`)
    }

    return data
  }

  /**
   * Marcar pagamento como pago (com sincronização completa)
   */
  static async marcarComoPagoIntegrado(id: string, observacao?: string): Promise<PagamentoReceberIntegrado> {
    console.log('🔍 [PagamentosReceberAPI-Integrado] Marcando pagamento como pago:', { id, observacao })
    
    const updateData: any = { 
      status: 'pago',
      updated_at: new Date().toISOString()
    }
    
    if (observacao) {
      updateData.observacoes = observacao
    }

    console.log('🔍 [PagamentosReceberAPI-Integrado] Dados para UPDATE:', updateData)

    // Primeiro, atualizar o pagamento
    const { data: result, error } = await supabase
      .from('pagamentos_receber')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ [PagamentosReceberAPI-Integrado] Erro no UPDATE do pagamento:', error)
      throw new Error(`Erro ao marcar como pago: ${error.message}`)
    }

    console.log('✅ [PagamentosReceberAPI-Integrado] Pagamento marcado como pago:', result)

    // Depois, atualizar o relatório correspondente para sincronizar
    if (result && result.relatorio_id) {
      console.log('🔄 [PagamentosReceberAPI-Integrado] Sincronizando relatório:', result.relatorio_id)
      
      const { error: relatorioError } = await supabase
        .from('reports')
        .update({ 
          status: 'PAGO',
          updated_at: new Date().toISOString()
        })
        .eq('id', result.relatorio_id)

      if (relatorioError) {
        console.error('❌ [PagamentosReceberAPI-Integrado] Erro ao sincronizar relatório:', relatorioError)
        // Não falhar a operação, apenas logar o erro
      } else {
        console.log('✅ [PagamentosReceberAPI-Integrado] Relatório sincronizado com sucesso')
      }

      // Sincronizar também as notas fiscais vinculadas ao relatório
      console.log('🔄 [PagamentosReceberAPI-Integrado] Sincronizando notas fiscais do relatório:', result.relatorio_id)
      
      const { error: notasError } = await supabase
        .from('notas_fiscais')
        .update({ 
          status: 'Paga',
          updated_at: new Date().toISOString()
        })
        .eq('relatorio_id', result.relatorio_id)
        .eq('status', 'Faturada') // Apenas notas que estão "Faturada"

      if (notasError) {
        console.error('❌ [PagamentosReceberAPI-Integrado] Erro ao sincronizar notas fiscais:', notasError)
        // Não falhar a operação, apenas logar o erro
      } else {
        console.log('✅ [PagamentosReceberAPI-Integrado] Notas fiscais sincronizadas com sucesso')
      }
    }
    
    // Buscar dados integrados atualizados
    const pagamentoIntegrado = await this.buscarPagamentoIntegradoPorId(id)
    if (!pagamentoIntegrado) {
      throw new Error('Erro ao buscar dados atualizados do pagamento')
    }
    
    return pagamentoIntegrado
  }

  /**
   * Atualizar forma de pagamento
   */
  static async atualizarFormaPagamentoIntegrado(id: string, formaPagamento: FormaPagamento): Promise<PagamentoReceberIntegrado> {
    console.log('🔍 [PagamentosReceberAPI-Integrado] Atualizando forma de pagamento:', { id, formaPagamento })
    
    // Primeiro, verificar se o pagamento existe e obter dados atuais
    const { data: pagamentoAtual, error: fetchError } = await supabase
      .from('pagamentos_receber')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('❌ [PagamentosReceberAPI-Integrado] Erro ao buscar pagamento atual:', fetchError)
      throw new Error(`Pagamento não encontrado: ${fetchError.message}`)
    }

    console.log('🔍 [PagamentosReceberAPI-Integrado] Pagamento atual:', pagamentoAtual)
    
    // Atualizar apenas a forma de pagamento, mantendo todos os outros campos
    const updateData = {
      forma_pagamento: formaPagamento,
      updated_at: new Date().toISOString()
    }

    console.log('🔍 [PagamentosReceberAPI-Integrado] Dados para UPDATE:', updateData)
    
    const { data: result, error } = await supabase
      .from('pagamentos_receber')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ [PagamentosReceberAPI-Integrado] Erro ao atualizar forma de pagamento:', error)
      console.error('❌ [PagamentosReceberAPI-Integrado] Detalhes do erro:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw new Error(`Erro ao atualizar forma de pagamento: ${error.message}`)
    }

    console.log('✅ [PagamentosReceberAPI-Integrado] Forma de pagamento atualizada:', result)
    
    // Buscar dados integrados atualizados
    const pagamentoIntegrado = await this.buscarPagamentoIntegradoPorId(id)
    if (!pagamentoIntegrado) {
      throw new Error('Erro ao buscar dados atualizados do pagamento')
    }

    return pagamentoIntegrado
  }

  /**
   * Obter KPIs financeiros integrados
   */
  static async obterKPIsIntegrados(): Promise<KPIsFinanceirosIntegrados> {
    console.log('🔍 [PagamentosReceberAPI-Integrado] Obtendo KPIs integrados')
    
    const { data, error } = await supabase
      .from('view_kpis_financeiros_unificados')
      .select('*')
      .single()

    if (error) {
      console.error('❌ [PagamentosReceberAPI-Integrado] Erro ao obter KPIs:', error)
      throw new Error(`Erro ao obter KPIs: ${error.message}`)
    }

    console.log('✅ [PagamentosReceberAPI-Integrado] KPIs obtidos:', data)
    return data
  }

  /**
   * Buscar pagamentos próximos do vencimento
   */
  static async buscarProximosVencimentoIntegrados(): Promise<PagamentoReceberIntegrado[]> {
    const { data, error } = await supabase
      .from('view_pagamentos_receber_integrado')
      .select('*')
      .eq('status_unificado', 'proximo_vencimento')
      .order('prazo_data')

    if (error) {
      throw new Error(`Erro ao buscar próximos vencimentos: ${error.message}`)
    }

    return data || []
  }

  /**
   * Buscar pagamentos vencidos
   */
  static async buscarVencidosIntegrados(): Promise<PagamentoReceberIntegrado[]> {
    const { data, error } = await supabase
      .from('view_pagamentos_receber_integrado')
      .select('*')
      .eq('status_unificado', 'vencido')
      .order('prazo_data')

    if (error) {
      throw new Error(`Erro ao buscar pagamentos vencidos: ${error.message}`)
    }

    return data || []
  }

  /**
   * Migrar dados existentes para integração
   */
  static async migrarDadosExistentes(): Promise<any[]> {
    console.log('🔍 [PagamentosReceberAPI-Integrado] Iniciando migração de dados existentes')
    
    const { data, error } = await supabase
      .rpc('migrar_dados_existentes_para_integracao')

    if (error) {
      console.error('❌ [PagamentosReceberAPI-Integrado] Erro na migração:', error)
      throw new Error(`Erro na migração: ${error.message}`)
    }

    console.log('✅ [PagamentosReceberAPI-Integrado] Migração concluída:', data)
    return data || []
  }
}

/**
 * Hook personalizado para usar o serviço integrado
 */
export function usePagamentosReceberIntegrado() {
  const listarPagamentosIntegrados = async (filters?: PagamentoReceberFilters, forceRefresh = false) => {
    return PagamentosReceberServiceIntegrado.listarPagamentosIntegrados(filters, forceRefresh)
  }

  const buscarPagamentoIntegradoPorId = async (id: string) => {
    return PagamentosReceberServiceIntegrado.buscarPagamentoIntegradoPorId(id)
  }

  const marcarComoPagoIntegrado = async (id: string, observacao?: string) => {
    return PagamentosReceberServiceIntegrado.marcarComoPagoIntegrado(id, observacao)
  }

  const atualizarFormaPagamentoIntegrado = async (id: string, formaPagamento: FormaPagamento) => {
    return PagamentosReceberServiceIntegrado.atualizarFormaPagamentoIntegrado(id, formaPagamento)
  }

  const obterKPIsIntegrados = async () => {
    return PagamentosReceberServiceIntegrado.obterKPIsIntegrados()
  }

  const buscarProximosVencimentoIntegrados = async () => {
    return PagamentosReceberServiceIntegrado.buscarProximosVencimentoIntegrados()
  }

  const buscarVencidosIntegrados = async () => {
    return PagamentosReceberServiceIntegrado.buscarVencidosIntegrados()
  }

  const migrarDadosExistentes = async () => {
    return PagamentosReceberServiceIntegrado.migrarDadosExistentes()
  }

  return {
    listarPagamentosIntegrados,
    buscarPagamentoIntegradoPorId,
    marcarComoPagoIntegrado,
    atualizarFormaPagamentoIntegrado,
    obterKPIsIntegrados,
    buscarProximosVencimentoIntegrados,
    buscarVencidosIntegrados,
    migrarDadosExistentes
  }
}
