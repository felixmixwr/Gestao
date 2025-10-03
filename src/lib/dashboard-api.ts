import { supabase } from './supabase'
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { getFinancialStats, getColaboradoresCosts } from './financialApi'

export interface DashboardStats {
  programacao_hoje: Array<{
    hora: string
    endereco: string
    responsavel: string
    bomba_prefix?: string
    motorista?: string
    auxiliares?: string[]
  }>
  programacao_amanha: Array<{
    hora: string
    endereco: string
    responsavel: string
    bomba_prefix?: string
    motorista?: string
    auxiliares?: string[]
  }>
  proxima_bomba: {
    hora: string
    endereco: string
    responsavel: string
    bomba_prefix?: string
    motorista?: string
    auxiliares?: string[]
    tempo_restante?: string
  } | null
  bombeados_dia: {
    total: number
    por_cliente: Record<string, number>
  }
  volume_previsto_dia: number
  volume_bombeado_semana: number
  faturamento_dia: number
  faturamento_mes: number
  colaboradores: number
  clientes: number
  relatorios: {
    dia: number
    mes: number
  }
  notas: {
    quantidade: number
    valor_total: number
  }
  financeiro: {
    entradas: number
    saidas: number
    total_despesas_mes: number
    despesas_por_categoria: Record<string, number>
    colaboradores: {
      custo_salarios: number
      custo_horas_extras: number
      custo_total: number
    }
    proximas_despesas: Array<{
      descricao: string
      valor: number
      data_vencimento: string
      categoria: string
    }>
  }
  relatorios_por_status: Array<{
    status: string
    quantidade: number
    valor_total: number
  }>
}

export class DashboardApi {
  /**
   * Buscar todas as estatísticas do dashboard
   */
  static async getStats(): Promise<DashboardStats> {
    const today = format(new Date(), 'yyyy-MM-dd')
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
    const startOfCurrentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const endOfCurrentMonth = format(endOfMonth(new Date()), 'yyyy-MM-dd')
    const startOfCurrentWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const endOfCurrentWeek = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

    console.log('🔍 [DashboardAPI] Buscando estatísticas para:', { today, tomorrow })

    try {
      // Executar todas as consultas em paralelo
      const [
        programacaoHojeResult,
        programacaoAmanhaResult,
        bombeadosResult,
        volumePrevistoResult,
        volumeBombeadoSemanaResult,
        faturamentoDiaResult,
        faturamentoMesResult,
        colaboradoresResult,
        colaboradoresCostsResult,
        clientesResult,
        relatoriosDiaResult,
        relatoriosMesResult,
        notasResult,
        financialStatsResult,
        relatoriosPorStatusResult
      ] = await Promise.all([
        // Programação de hoje
        this.getProgramacaoDia(today),
        
        // Programação de amanhã
        this.getProgramacaoDia(tomorrow),
        
        // Bombeados do dia
        this.getBombeadosDia(today),
        
        // Volume previsto do dia
        this.getVolumePrevistoDia(today),
        
        // Volume bombeado da semana
        this.getVolumeBombeadoSemana(startOfCurrentWeek, endOfCurrentWeek),
        
        // Faturamento do dia
        this.getFaturamentoDia(today),
        
        // Faturamento do mês
        this.getFaturamentoMes(startOfCurrentMonth, endOfCurrentMonth),
        
        // Colaboradores ativos
        this.getColaboradoresAtivos(),
        
        // Custos de colaboradores
        getColaboradoresCosts(),
        
        // Clientes ativos
        this.getClientesAtivos(),
        
        // Relatórios do dia
        this.getRelatoriosDia(today),
        
        // Relatórios do mês
        this.getRelatoriosMes(startOfCurrentMonth, endOfCurrentMonth),
        
        // Notas fiscais
        this.getNotasFiscais(startOfCurrentMonth, endOfCurrentMonth),
        
        // Estatísticas financeiras do mês atual
        getFinancialStats({
          data_inicio: startOfCurrentMonth,
          data_fim: endOfCurrentMonth
        }),
        
        // Relatórios por status
        this.getRelatoriosPorStatus()
      ])

      // Calcular próxima bomba
      const proximaBomba = this.calcularProximaBomba(programacaoHojeResult)
      
      console.log('📊 [DashboardAPI] Resultados:', {
        programacaoHoje: programacaoHojeResult.length,
        programacaoAmanha: programacaoAmanhaResult.length,
        proximaBomba: proximaBomba ? 'Encontrada' : 'Não encontrada'
      })

      return {
        programacao_hoje: programacaoHojeResult,
        programacao_amanha: programacaoAmanhaResult,
        proxima_bomba: proximaBomba,
        bombeados_dia: bombeadosResult,
        volume_previsto_dia: volumePrevistoResult,
        volume_bombeado_semana: volumeBombeadoSemanaResult,
        faturamento_dia: faturamentoDiaResult,
        faturamento_mes: faturamentoMesResult,
        colaboradores: colaboradoresResult,
        clientes: clientesResult,
        relatorios: {
          dia: relatoriosDiaResult,
          mes: relatoriosMesResult
        },
        notas: notasResult,
        financeiro: {
          entradas: faturamentoMesResult, // Usar faturamento como entradas
          saidas: financialStatsResult.total_despesas,
          total_despesas_mes: financialStatsResult.total_despesas,
          despesas_por_categoria: financialStatsResult.total_por_categoria,
          colaboradores: {
            custo_salarios: colaboradoresCostsResult.custo_salarios,
            custo_horas_extras: colaboradoresCostsResult.custo_horas_extras,
            custo_total: colaboradoresCostsResult.custo_total
          },
          proximas_despesas: await this.getProximasDespesas()
        },
        relatorios_por_status: relatoriosPorStatusResult
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error)
      throw error
    }
  }

  /**
   * Buscar programação de um dia específico
   */
  private static async getProgramacaoDia(date: string) {
    try {
      console.log('🔍 [DashboardAPI] Buscando programação para:', date)
      
      // Primeiro, buscar dados básicos da programação
      const { data: programacaoData, error: programacaoError } = await supabase
        .from('programacao')
        .select(`
          horario,
          endereco,
          numero,
          bairro,
          responsavel,
          motorista_operador,
          auxiliares_bomba,
          bomba_id
        `)
        .eq('data', date)
        .order('horario')

      if (programacaoError) {
        console.error('❌ [DashboardAPI] Erro ao buscar programação:', programacaoError)
        throw programacaoError
      }

      console.log('📊 [DashboardAPI] Programação encontrada:', programacaoData?.length || 0, 'itens')

      if (!programacaoData || programacaoData.length === 0) {
        return []
      }

      // Buscar dados das bombas
      const bombaIds = [...new Set(programacaoData.map(p => p.bomba_id).filter(Boolean))]
      const { data: bombasData } = await supabase
        .from('pumps')
        .select('id, prefix')
        .in('id', bombaIds)

      // Buscar dados dos colaboradores (motoristas e auxiliares)
      const colaboradorIds = [
        ...new Set(programacaoData.map(p => p.motorista_operador).filter(Boolean)),
        ...new Set(programacaoData.flatMap(p => p.auxiliares_bomba || []))
      ]
      
      const { data: colaboradoresData } = await supabase
        .from('colaboradores')
        .select('id, nome')
        .in('id', colaboradorIds)

      return programacaoData.map(item => {
        // Formatar endereço
        const endereco = [item.endereco, item.numero, item.bairro]
          .filter(Boolean)
          .join(', ') || 'Endereço não informado'

        // Buscar prefixo da bomba
        const bomba = bombasData?.find(b => b.id === item.bomba_id)
        const bomba_prefix = bomba?.prefix || 'N/A'

        // Buscar nome do motorista
        const motorista = item.motorista_operador ? 
          colaboradoresData?.find(c => c.id === item.motorista_operador)?.nome || 'Motorista não definido' : 
          'Motorista não definido'

        // Buscar nomes dos auxiliares
        const auxiliares = item.auxiliares_bomba && item.auxiliares_bomba.length > 0 ?
          item.auxiliares_bomba
            .map((id: string) => colaboradoresData?.find(c => c.id === id)?.nome)
            .filter(Boolean) || [] :
          []

        return {
          hora: item.horario || '--:--',
          endereco,
          responsavel: item.responsavel || 'Não definido',
          bomba_prefix,
          motorista,
          auxiliares
        }
      })
    } catch (error) {
      console.error('Erro ao buscar programação:', error)
      return []
    }
  }

  /**
   * Calcular próxima bomba a sair
   */
  private static calcularProximaBomba(programacaoHoje: Array<{
    hora: string
    endereco: string
    responsavel: string
    bomba_prefix?: string
    motorista?: string
    auxiliares?: string[]
  }>) {
    const agora = new Date()
    const horaAtual = agora.getHours() * 60 + agora.getMinutes()

    // Filtrar apenas programações futuras
    const programacoesFuturas = programacaoHoje.filter(item => {
      const [hora, minuto] = item.hora.split(':').map(Number)
      const horaProgramacao = hora * 60 + minuto
      return horaProgramacao > horaAtual
    })

    if (programacoesFuturas.length === 0) {
      return null
    }

    // Pegar a primeira programação futura
    const proxima = programacoesFuturas[0]
    const [hora, minuto] = proxima.hora.split(':').map(Number)
    const horaProgramacao = hora * 60 + minuto
    const tempoRestante = horaProgramacao - horaAtual

    // Formatar tempo restante
    const horas = Math.floor(tempoRestante / 60)
    const minutos = tempoRestante % 60
    
    let tempoFormatado = ''
    if (horas > 0) {
      tempoFormatado = `${horas}h ${minutos}min`
    } else {
      tempoFormatado = `${minutos}min`
    }

    return {
      ...proxima,
      tempo_restante: tempoFormatado
    }
  }

  /**
   * Buscar bombeados do dia
   */
  private static async getBombeadosDia(date: string) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          realized_volume,
          client_rep_name
        `)
        .eq('date', date)

      if (error) throw error

      const total = (data || []).reduce((sum, item) => sum + (Number(item.realized_volume) || 0), 0)
      
      const porCliente = (data || []).reduce((acc, item) => {
        const cliente = item.client_rep_name || 'Cliente não identificado'
        const volume = Number(item.realized_volume) || 0
        acc[cliente] = (acc[cliente] || 0) + volume
        return acc
      }, {} as Record<string, number>)

      return {
        total,
        por_cliente: porCliente
      }
    } catch (error) {
      console.error('Erro ao buscar bombeados:', error)
      return { total: 0, por_cliente: {} }
    }
  }

  /**
   * Buscar volume previsto do dia
   */
  private static async getVolumePrevistoDia(date: string) {
    try {
      const { data, error } = await supabase
        .from('programacao')
        .select('volume_previsto')
        .eq('data', date)

      if (error) throw error

      const total = (data || []).reduce((sum, item) => sum + (Number(item.volume_previsto) || 0), 0)
      
      return total
    } catch (error) {
      console.error('Erro ao buscar volume previsto:', error)
      return 0
    }
  }

  /**
   * Buscar volume bombeado da semana
   */
  private static async getVolumeBombeadoSemana(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('realized_volume')
        .gte('date', startDate)
        .lte('date', endDate)

      if (error) throw error

      const total = (data || []).reduce((sum, item) => sum + (Number(item.realized_volume) || 0), 0)
      
      return total
    } catch (error) {
      console.error('Erro ao buscar volume bombeado da semana:', error)
      return 0
    }
  }

  /**
   * Buscar faturamento do dia (INTEGRADO)
   */
  private static async getFaturamentoDia(date: string) {
    try {
      // Usar a view integrada de KPIs
      const { data, error } = await supabase
        .from('view_kpis_financeiros_unificados')
        .select('faturamento_hoje')
        .single()

      if (error) {
        console.error('Erro ao buscar faturamento do dia (integrado):', error)
        // Fallback para método antigo
        return this.getFaturamentoDiaFallback(date)
      }

      return data?.faturamento_hoje || 0
    } catch (err) {
      console.error('Erro ao buscar faturamento do dia:', err)
      return this.getFaturamentoDiaFallback(date)
    }
  }

  /**
   * Buscar faturamento do mês (INTEGRADO)
   */
  private static async getFaturamentoMes(startDate: string, endDate: string) {
    try {
      // Usar a view integrada de KPIs
      const { data, error } = await supabase
        .from('view_kpis_financeiros_unificados')
        .select('faturamento_mes')
        .single()

      if (error) {
        console.error('Erro ao buscar faturamento do mês (integrado):', error)
        // Fallback para método antigo
        return this.getFaturamentoMesFallback(startDate, endDate)
      }

      return data?.faturamento_mes || 0
    } catch (err) {
      console.error('Erro ao buscar faturamento do mês:', err)
      return this.getFaturamentoMesFallback(startDate, endDate)
    }
  }

  /**
   * Método fallback para faturamento do dia
   */
  private static async getFaturamentoDiaFallback(date: string) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('total_value')
        .eq('date', date)
        .eq('status', 'PAGO')

      if (error) throw error

      return (data || []).reduce((sum, item) => sum + (Number(item.total_value) || 0), 0)
    } catch (error) {
      console.error('Erro ao buscar faturamento do dia (fallback):', error)
      return 0
    }
  }

  /**
   * Método fallback para faturamento do mês
   */
  private static async getFaturamentoMesFallback(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('total_value')
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'PAGO')

      if (error) throw error

      return (data || []).reduce((sum, item) => sum + (Number(item.total_value) || 0), 0)
    } catch (error) {
      console.error('Erro ao buscar faturamento do mês (fallback):', error)
      return 0
    }
  }

  /**
   * Buscar colaboradores ativos
   */
  private static async getColaboradoresAtivos() {
    try {
      const { count, error } = await supabase
        .from('colaboradores')
        .select('*', { count: 'exact', head: true })
        .eq('registrado', true)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error)
      return 0
    }
  }

  /**
   * Buscar clientes ativos
   */
  private static async getClientesAtivos() {
    try {
      const { count, error } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      return 0
    }
  }

  /**
   * Buscar relatórios do dia
   */
  private static async getRelatoriosDia(date: string) {
    try {
      const { count, error } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('date', date)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Erro ao buscar relatórios do dia:', error)
      return 0
    }
  }

  /**
   * Buscar relatórios do mês
   */
  private static async getRelatoriosMes(startDate: string, endDate: string) {
    try {
      const { count, error } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .gte('date', startDate)
        .lte('date', endDate)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Erro ao buscar relatórios do mês:', error)
      return 0
    }
  }

  /**
   * Buscar notas fiscais
   */
  private static async getNotasFiscais(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('notas_fiscais')
        .select('valor')
        .gte('data_emissao', startDate)
        .lte('data_emissao', endDate)

      if (error) throw error

      const quantidade = data?.length || 0
      const valorTotal = (data || []).reduce((sum, item) => sum + (Number(item.valor) || 0), 0)

      return {
        quantidade,
        valor_total: valorTotal
      }
    } catch (error) {
      console.error('Erro ao buscar notas fiscais:', error)
      return { quantidade: 0, valor_total: 0 }
    }
  }

  /**
   * Buscar relatórios agrupados por status
   */
  private static async getRelatoriosPorStatus() {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('status, total_value')

      if (error) throw error

      // Agrupar por status
      const statusMap = new Map<string, { quantidade: number; valor_total: number }>()
      
      // Inicializar todos os status possíveis
      const allStatuses = [
        'ENVIADO_FINANCEIRO',
        'RECEBIDO_FINANCEIRO', 
        'AGUARDANDO_APROVACAO',
        'NOTA_EMITIDA',
        'AGUARDANDO_PAGAMENTO',
        'PAGO'
      ]

      allStatuses.forEach(status => {
        statusMap.set(status, { quantidade: 0, valor_total: 0 })
      })

      // Processar dados
      data?.forEach(report => {
        const status = report.status
        const valor = Number(report.total_value) || 0
        
        if (statusMap.has(status)) {
          const current = statusMap.get(status)!
          statusMap.set(status, {
            quantidade: current.quantidade + 1,
            valor_total: current.valor_total + valor
          })
        }
      })

      // Converter para array e adicionar "Todos"
      const result = Array.from(statusMap.entries()).map(([status, data]) => ({
        status,
        quantidade: data.quantidade,
        valor_total: data.valor_total
      }))

      // Adicionar card "Todos"
      const totalQuantidade = result.reduce((sum, item) => sum + item.quantidade, 0)
      const totalValor = result.reduce((sum, item) => sum + item.valor_total, 0)
      
      result.unshift({
        status: 'TODOS',
        quantidade: totalQuantidade,
        valor_total: totalValor
      })

      return result
    } catch (error) {
      console.error('Erro ao buscar relatórios por status:', error)
      return []
    }
  }

  /**
   * Buscar próximas despesas (próximos 7 dias)
   */
  private static async getProximasDespesas() {
    try {
      const hoje = new Date()
      const proximos7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const { data, error } = await supabase
        .from('expenses')
        .select('descricao, valor, data_despesa, categoria')
        .gte('data_despesa', format(hoje, 'yyyy-MM-dd'))
        .lte('data_despesa', format(proximos7Dias, 'yyyy-MM-dd'))
        .eq('status', 'pendente')
        .order('data_despesa', { ascending: true })
        .limit(5)

      if (error) throw error

      return (data || []).map(expense => ({
        descricao: expense.descricao,
        valor: expense.valor,
        data_vencimento: expense.data_despesa,
        categoria: expense.categoria
      }))
    } catch (error) {
      console.error('Erro ao buscar próximas despesas:', error)
      return []
    }
  }
}
