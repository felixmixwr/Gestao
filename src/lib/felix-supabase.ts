/**
 * FELIX IA - Integração com Supabase
 * Funções para buscar dados do banco e preparar para análise pela FELIX IA
 */

import { supabase } from './supabase'
import { getCurrentDateString, getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth } from '../utils/date-utils'
import { ProgramacaoAPI } from './programacao-api'
import { PlannerAPI } from './planner-api'
import { DashboardApi } from './dashboard-api'
import { PumpAdvancedAPI } from './pump-advanced-api'
import { getFinancialStats, getColaboradoresCosts } from './financialApi'
import { PagamentosReceberServiceIntegrado } from './pagamentos-receber-api-integrado'

// Interface para dados de relatórios
export interface ReportData {
  id: string
  report_number: string
  client_name: string
  pump_prefix: string
  start_date: string
  end_date: string
  total_hours: number
  volume_bombeado?: number
  status: string
  created_at: string
}

// Interface para dados financeiros
export interface FinancialData {
  pagamentos_receber: Array<{
    id: string
    cliente_name: string
    valor_total: number
    forma_pagamento: string
    status: string
    prazo_data: string
    created_at: string
  }>
  despesas: Array<{
    id: string
    descricao: string
    categoria: string
    valor: number
    data_despesa: string
    pump_id: string
    status: string
  }>
  resumo: {
    total_receitas: number
    total_despesas: number
    lucro_liquido: number
    pagamentos_pendentes: number
    despesas_pendentes: number
  }
}

// Interface para status de bombas
export interface PumpStatusData {
  bombas: Array<{
    id: string
    prefix: string
    model: string
    status: string
    total_billed: number
    ultima_utilizacao: string
    horas_mes: number
    volume_mes: number
  }>
  resumo: {
    total_bombas: number
    bombas_ativas: number
    bombas_manutencao: number
    utilizacao_media: number
    volume_total_mes: number
  }
}

// Interface para dados de colaboradores
export interface CollaboratorsData {
  colaboradores: Array<{
    id: string
    nome: string
    funcao: string
    tipo_contrato: string
    salario_fixo: number
    equipamento_vinculado: string | null
    registrado: boolean
  }>
  custos_mensais: {
    total_salarios: number
    total_horas_extras: number
    total_beneficios: number
    custo_total: number
  }
  produtividade: {
    total_colaboradores: number
    colaboradores_registrados: number
    eficiencia_media: number
  }
}

/**
 * Busca os últimos relatórios para análise
 * @param limit - Número máximo de relatórios (padrão: 50)
 * @param companyId - ID da empresa (opcional, usa contexto atual se não fornecido)
 * @returns Dados dos relatórios prontos para análise
 */
export async function getReportsForAnalysis(limit: number = 50, companyId?: string): Promise<ReportData[]> {
  try {
    console.log('📊 [FELIX SUPABASE] Buscando relatórios para análise...')

    const currentCompanyId = companyId || await getCurrentCompanyId()

    // Buscar relatórios com dados de clientes e bombas
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        id,
        report_number,
        start_date,
        end_date,
        total_hours,
        created_at,
        clients!inner(name),
        pumps!inner(prefix, model),
        company_id
      `)
      .eq('company_id', currentCompanyId) // Filtro multi-tenant
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ [FELIX SUPABASE] Erro ao buscar relatórios:', error)
      throw error
    }

    // Transformar dados para formato da FELIX IA
    const reportData: ReportData[] = reports?.map(report => ({
      id: report.id,
      report_number: report.report_number,
      client_name: (report.clients as any)?.name || 'Cliente não identificado',
      pump_prefix: (report.pumps as any)?.prefix || 'Bomba não identificada',
      start_date: report.start_date,
      end_date: report.end_date,
      total_hours: report.total_hours,
      volume_bombeado: report.total_hours * 30, // Estimativa baseada em horas
      status: 'Concluído',
      created_at: report.created_at
    })) || []

    console.log(`✅ [FELIX SUPABASE] ${reportData.length} relatórios encontrados`)
    return reportData

  } catch (error) {
    console.error('❌ [FELIX SUPABASE] Erro em getReportsForAnalysis:', error)
    return []
  }
}

/**
 * Retorna dados financeiros (pagamentos + despesas) para análise
 * @param companyId - ID da empresa (opcional, usa contexto atual se não fornecido)
 * @returns Dados financeiros estruturados
 */
export async function getFinancialData(companyId?: string): Promise<FinancialData> {
  try {
    console.log('💰 [FELIX SUPABASE] Buscando dados financeiros...')

    const currentCompanyId = companyId || await getCurrentCompanyId()
    const currentMonth = getFirstDayOfCurrentMonth()
    const endMonth = getLastDayOfCurrentMonth()

    // Buscar pagamentos a receber - CORRIGIDO: usa empresa_id conforme estrutura real
    const { data: pagamentos, error: pagamentosError } = await supabase
      .from('pagamentos_receber')
      .select(`
        id,
        valor_total,
        forma_pagamento,
        status,
        prazo_data,
        created_at,
        clients!inner(name)
      `)
      .eq('empresa_id', currentCompanyId) // CORRIGIDO: empresa_id (não company_id)
      .gte('created_at', currentMonth)
      .lte('created_at', endMonth)

    if (pagamentosError) {
      console.error('❌ [FELIX SUPABASE] Erro ao buscar pagamentos:', pagamentosError)
    }

    // Buscar despesas
    const { data: despesas, error: despesasError } = await supabase
      .from('expenses')
      .select(`
        id,
        descricao,
        categoria,
        valor,
        data_despesa,
        pump_id,
        status
      `)
      .eq('company_id', currentCompanyId)
      .gte('data_despesa', currentMonth)
      .lte('data_despesa', endMonth)

    if (despesasError) {
      console.error('❌ [FELIX SUPABASE] Erro ao buscar despesas:', despesasError)
    }

    // Calcular resumo financeiro
    const totalReceitas = pagamentos?.reduce((sum, p) => sum + p.valor_total, 0) || 0
    const totalDespesas = despesas?.reduce((sum, d) => sum + d.valor, 0) || 0
    const pagamentosPendentes = pagamentos?.filter(p => p.status === 'pendente').length || 0
    const despesasPendentes = despesas?.filter(d => d.status === 'pendente').length || 0

    const financialData: FinancialData = {
      pagamentos_receber: pagamentos?.map(p => ({
        id: p.id,
        cliente_name: (p.clients as any)?.name || 'Cliente não identificado',
        valor_total: p.valor_total,
        forma_pagamento: p.forma_pagamento,
        status: p.status,
        prazo_data: p.prazo_data,
        created_at: p.created_at
      })) || [],
      despesas: despesas || [],
      resumo: {
        total_receitas: totalReceitas,
        total_despesas: totalDespesas,
        lucro_liquido: totalReceitas - totalDespesas,
        pagamentos_pendentes: pagamentosPendentes,
        despesas_pendentes: despesasPendentes
      }
    }

    console.log('✅ [FELIX SUPABASE] Dados financeiros carregados:', {
      receitas: totalReceitas,
      despesas: totalDespesas,
      lucro: totalReceitas - totalDespesas
    })

    return financialData

  } catch (error) {
    console.error('❌ [FELIX SUPABASE] Erro em getFinancialData:', error)
    return {
      pagamentos_receber: [],
      despesas: [],
      resumo: {
        total_receitas: 0,
        total_despesas: 0,
        lucro_liquido: 0,
        pagamentos_pendentes: 0,
        despesas_pendentes: 0
      }
    }
  }
}

/**
 * Retorna status e histórico de bombas para análise
 * @param companyId - ID da empresa (opcional, usa contexto atual se não fornecido)
 * @returns Dados de status das bombas
 */
export async function getPumpStatus(companyId?: string): Promise<PumpStatusData> {
  try {
    console.log('🚛 [FELIX SUPABASE] Buscando status das bombas...')

    const currentCompanyId = companyId || await getCurrentCompanyId()
    const currentMonth = getFirstDayOfCurrentMonth()
    const endMonth = getLastDayOfCurrentMonth()

    // Buscar bombas - CORRIGIDO: usa owner_company_id conforme estrutura real
    const { data: bombas, error: bombasError } = await supabase
      .from('pumps')
      .select(`
        id,
        prefix,
        model,
        status,
        total_billed,
        created_at
      `)
      .eq('owner_company_id', currentCompanyId) // CORRIGIDO: owner_company_id (não company_id)

    if (bombasError) {
      console.error('❌ [FELIX SUPABASE] Erro ao buscar bombas:', bombasError)
    }

    // Buscar relatórios do mês para calcular utilização
    const { data: relatorios, error: relatoriosError } = await supabase
      .from('reports')
      .select(`
        pump_id,
        total_hours,
        start_date,
        end_date
      `)
      .eq('company_id', currentCompanyId)
      .gte('start_date', currentMonth)
      .lte('end_date', endMonth)

    if (relatoriosError) {
      console.error('❌ [FELIX SUPABASE] Erro ao buscar relatórios:', relatoriosError)
    }

    // Calcular utilização por bomba
    const utilizacaoPorBomba = new Map<string, { horas: number; volume: number }>()
    
    relatorios?.forEach(relatorio => {
      const bombaId = relatorio.pump_id
      const horas = relatorio.total_hours
      const volume = horas * 30 // Estimativa de volume baseada em horas
      
      if (utilizacaoPorBomba.has(bombaId)) {
        const atual = utilizacaoPorBomba.get(bombaId)!
        utilizacaoPorBomba.set(bombaId, {
          horas: atual.horas + horas,
          volume: atual.volume + volume
        })
      } else {
        utilizacaoPorBomba.set(bombaId, { horas, volume })
      }
    })

    // Preparar dados das bombas
    const bombasData = bombas?.map(bomba => {
      const utilizacao = utilizacaoPorBomba.get(bomba.id) || { horas: 0, volume: 0 }
      
      return {
        id: bomba.id,
        prefix: bomba.prefix,
        model: bomba.model || 'Modelo não informado',
        status: bomba.status,
        total_billed: bomba.total_billed,
        ultima_utilizacao: bomba.created_at,
        horas_mes: utilizacao.horas,
        volume_mes: utilizacao.volume
      }
    }) || []

    // Calcular resumo
    const totalBombas = bombasData.length
    const bombasAtivas = bombasData.filter(b => b.status === 'Disponível').length
    const bombasManutencao = bombasData.filter(b => b.status === 'Em Manutenção').length
    const volumeTotalMes = bombasData.reduce((sum, b) => sum + b.volume_mes, 0)
    const utilizacaoMedia = totalBombas > 0 ? bombasAtivas / totalBombas : 0

    const pumpData: PumpStatusData = {
      bombas: bombasData,
      resumo: {
        total_bombas: totalBombas,
        bombas_ativas: bombasAtivas,
        bombas_manutencao: bombasManutencao,
        utilizacao_media: utilizacaoMedia,
        volume_total_mes: volumeTotalMes
      }
    }

    console.log('✅ [FELIX SUPABASE] Status das bombas carregado:', {
      total: totalBombas,
      ativas: bombasAtivas,
      manutencao: bombasManutencao,
      volume_mes: volumeTotalMes
    })

    return pumpData

  } catch (error) {
    console.error('❌ [FELIX SUPABASE] Erro em getPumpStatus:', error)
    return {
      bombas: [],
      resumo: {
        total_bombas: 0,
        bombas_ativas: 0,
        bombas_manutencao: 0,
        utilizacao_media: 0,
        volume_total_mes: 0
      }
    }
  }
}

/**
 * Retorna dados de colaboradores para análise
 * @param companyId - ID da empresa (opcional, usa contexto atual se não fornecido)
 * @returns Dados dos colaboradores
 */
export async function getCollaboratorsData(companyId?: string): Promise<CollaboratorsData> {
  try {
    console.log('👥 [FELIX SUPABASE] Buscando dados dos colaboradores...')

    const currentCompanyId = companyId || await getCurrentCompanyId()
    const currentMonth = getFirstDayOfCurrentMonth()
    const endMonth = getLastDayOfCurrentMonth()

    // Buscar colaboradores
    const { data: colaboradores, error: colaboradoresError } = await supabase
      .from('colaboradores')
      .select(`
        id,
        nome,
        funcao,
        tipo_contrato,
        salario_fixo,
        equipamento_vinculado_id,
        registrado
      `)
      .eq('company_id', currentCompanyId)

    if (colaboradoresError) {
      console.error('❌ [FELIX SUPABASE] Erro ao buscar colaboradores:', colaboradoresError)
    }

    // Buscar horas extras do mês
    const { data: horasExtras, error: horasExtrasError } = await supabase
      .from('colaboradores_horas_extras')
      .select(`
        colaborador_id,
        horas,
        valor_calculado
      `)
      .gte('data', currentMonth)
      .lte('data', endMonth)

    if (horasExtrasError) {
      console.error('❌ [FELIX SUPABASE] Erro ao buscar horas extras:', horasExtrasError)
    }

    // Calcular custos
    const totalSalarios = colaboradores?.reduce((sum, c) => sum + (c.salario_fixo || 0), 0) || 0
    const totalHorasExtras = horasExtras?.reduce((sum, h) => sum + h.valor_calculado, 0) || 0
    const totalBeneficios = totalSalarios * 0.3 // Estimativa de 30% em benefícios
    const custoTotal = totalSalarios + totalHorasExtras + totalBeneficios

    // Preparar dados dos colaboradores
    const colaboradoresData = colaboradores?.map(colaborador => ({
      id: colaborador.id,
      nome: colaborador.nome,
      funcao: colaborador.funcao,
      tipo_contrato: colaborador.tipo_contrato,
      salario_fixo: colaborador.salario_fixo || 0,
      equipamento_vinculado: colaborador.equipamento_vinculado_id,
      registrado: colaborador.registrado
    })) || []

    const collaboratorsData: CollaboratorsData = {
      colaboradores: colaboradoresData,
      custos_mensais: {
        total_salarios: totalSalarios,
        total_horas_extras: totalHorasExtras,
        total_beneficios: totalBeneficios,
        custo_total: custoTotal
      },
      produtividade: {
        total_colaboradores: colaboradoresData.length,
        colaboradores_registrados: colaboradoresData.filter(c => c.registrado).length,
        eficiencia_media: colaboradoresData.length > 0 ? 
          colaboradoresData.filter(c => c.registrado).length / colaboradoresData.length : 0
      }
    }

    console.log('✅ [FELIX SUPABASE] Dados dos colaboradores carregados:', {
      total: colaboradoresData.length,
      registrados: collaboratorsData.produtividade.colaboradores_registrados,
      custo_total: custoTotal
    })

    return collaboratorsData

  } catch (error) {
    console.error('❌ [FELIX SUPABASE] Erro em getCollaboratorsData:', error)
    return {
      colaboradores: [],
      custos_mensais: {
        total_salarios: 0,
        total_horas_extras: 0,
        total_beneficios: 0,
        custo_total: 0
      },
      produtividade: {
        total_colaboradores: 0,
        colaboradores_registrados: 0,
        eficiencia_media: 0
      }
    }
  }
}

/**
 * Buscar dados de programação (agendamentos)
 * @param companyId - ID da empresa (opcional)
 * @returns Dados de programação para análise
 */
export async function getProgramacaoData(companyId?: string): Promise<any> {
  try {
    console.log('📅 [FELIX SUPABASE] Buscando dados de programação...')
    const currentCompanyId = companyId || await getCurrentCompanyId()
    
    // Buscar programação de hoje e amanhã
    const hoje = getCurrentDateString()
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)
    const amanhaStr = amanha.toISOString().split('T')[0]
    
    const { data: programacaoHoje, error: errorHoje } = await supabase
      .from('programacao')
      .select(`
        *,
        clients!inner(name, phone),
        pumps!inner(prefix, model),
        companies!inner(name)
      `)
      .eq('company_id', currentCompanyId)
      .eq('data', hoje)
      .order('hora_inicio')
    
    const { data: programacaoAmanha, error: errorAmanha } = await supabase
      .from('programacao')
      .select(`
        *,
        clients!inner(name, phone),
        pumps!inner(prefix, model),
        companies!inner(name)
      `)
      .eq('company_id', currentCompanyId)
      .eq('data', amanhaStr)
      .order('hora_inicio')
    
    if (errorHoje) console.error('❌ [FELIX SUPABASE] Erro ao buscar programação de hoje:', errorHoje)
    if (errorAmanha) console.error('❌ [FELIX SUPABASE] Erro ao buscar programação de amanhã:', errorAmanha)
    
    const programacaoData = {
      hoje: programacaoHoje || [],
      amanha: programacaoAmanha || [],
      resumo: {
        total_hoje: programacaoHoje?.length || 0,
        total_amanha: programacaoAmanha?.length || 0,
        bombas_utilizadas_hoje: [...new Set(programacaoHoje?.map(p => p.pumps?.prefix).filter(Boolean))],
        bombas_utilizadas_amanha: [...new Set(programacaoAmanha?.map(p => p.pumps?.prefix).filter(Boolean))]
      }
    }
    
    console.log(`✅ [FELIX SUPABASE] ${programacaoData.resumo.total_hoje} agendamentos hoje, ${programacaoData.resumo.total_amanha} amanhã`)
    return programacaoData
    
  } catch (error) {
    console.error('❌ [FELIX SUPABASE] Erro ao buscar dados de programação:', error)
    throw error
  }
}

/**
 * Buscar dados do dashboard completo
 * @param companyId - ID da empresa (opcional)
 * @returns Dados completos do dashboard
 */
export async function getDashboardData(companyId?: string): Promise<any> {
  try {
    console.log('📊 [FELIX SUPABASE] Buscando dados do dashboard...')
    const currentCompanyId = companyId || await getCurrentCompanyId()
    
    const dashboardStats = await DashboardApi.getStats()
    
    console.log('✅ [FELIX SUPABASE] Dados do dashboard carregados')
    return dashboardStats
    
  } catch (error) {
    console.error('❌ [FELIX SUPABASE] Erro ao buscar dados do dashboard:', error)
    throw error
  }
}

/**
 * Buscar dados avançados das bombas
 * @param companyId - ID da empresa (opcional)
 * @returns Dados avançados das bombas
 */
export async function getAdvancedPumpData(companyId?: string): Promise<any> {
  try {
    console.log('🚛 [FELIX SUPABASE] Buscando dados avançados das bombas...')
    const currentCompanyId = companyId || await getCurrentCompanyId()
    
    const pumps = await PumpAdvancedAPI.getAllPumps({ company_id: currentCompanyId })
    const pumpKPIs = await PumpAdvancedAPI.getPumpKPIs(currentCompanyId)
    const maintenance = await PumpAdvancedAPI.getMaintenances(currentCompanyId)
    
    const advancedPumpData = {
      pumps,
      kpis: pumpKPIs,
      maintenance,
      resumo: {
        total_bombas: pumps.length,
        bombas_ativas: pumps.filter(p => p.status === 'ativa').length,
        bombas_manutencao: pumps.filter(p => p.status === 'manutencao').length,
        manutencoes_pendentes: maintenance.filter((m: any) => m.status === 'pendente').length
      }
    }
    
    console.log(`✅ [FELIX SUPABASE] ${advancedPumpData.resumo.total_bombas} bombas encontradas`)
    return advancedPumpData
    
  } catch (error) {
    console.error('❌ [FELIX SUPABASE] Erro ao buscar dados avançados das bombas:', error)
    throw error
  }
}

/**
 * Buscar dados do planner (tarefas e notas)
 * @param companyId - ID da empresa (opcional)
 * @returns Dados do planner
 */
export async function getPlannerData(companyId?: string): Promise<any> {
  try {
    console.log('📋 [FELIX SUPABASE] Buscando dados do planner...')
    
    const tasks = await PlannerAPI.getTasks()
    const categories = await PlannerAPI.getCategories()
    
    const plannerData = {
      tasks,
      notes: [], // Temporariamente vazio até implementar getNotes
      categories,
      resumo: {
        total_tarefas: tasks.length,
        tarefas_pendentes: tasks.filter((t: any) => t.status === 'pending').length,
        tarefas_em_andamento: tasks.filter((t: any) => t.status === 'in_progress').length,
        tarefas_concluidas: tasks.filter((t: any) => t.status === 'completed').length,
        total_notas: 0, // Temporariamente 0
        notas_fixadas: 0 // Temporariamente 0
      }
    }
    
    console.log(`✅ [FELIX SUPABASE] ${plannerData.resumo.total_tarefas} tarefas, ${plannerData.resumo.total_notas} notas`)
    return plannerData
    
  } catch (error) {
    console.error('❌ [FELIX SUPABASE] Erro ao buscar dados do planner:', error)
    throw error
  }
}

/**
 * Buscar dados financeiros completos
 * @param companyId - ID da empresa (opcional)
 * @returns Dados financeiros completos
 */
export async function getCompleteFinancialData(companyId?: string): Promise<any> {
  try {
    console.log('💰 [FELIX SUPABASE] Buscando dados financeiros completos...')
    const currentCompanyId = companyId || await getCurrentCompanyId()
    
    const financialStats = await getFinancialStats({ company_id: currentCompanyId })
    const colaboradoresCosts = await getColaboradoresCosts()
    const pagamentos = await PagamentosReceberServiceIntegrado.listarPagamentosIntegrados()
    
    const completeFinancialData = {
      stats: financialStats,
      colaboradores_costs: colaboradoresCosts,
      pagamentos_receber: pagamentos,
      resumo: {
        total_receitas: (financialStats as any).total_receitas || 0,
        total_despesas: (financialStats as any).total_despesas || 0,
        lucro_liquido: ((financialStats as any).total_receitas || 0) - ((financialStats as any).total_despesas || 0),
        pagamentos_pendentes: pagamentos.filter((p: any) => p.status === 'pendente').length,
        custo_total_rh: colaboradoresCosts.custo_total || 0
      }
    }
    
    console.log('✅ [FELIX SUPABASE] Dados financeiros completos carregados')
    return completeFinancialData
    
  } catch (error) {
    console.error('❌ [FELIX SUPABASE] Erro ao buscar dados financeiros completos:', error)
    throw error
  }
}

/**
 * Buscar TODOS os dados do sistema para análise completa
 * @param companyId - ID da empresa (opcional)
 * @returns Todos os dados do sistema
 */
export async function getAllSystemData(companyId?: string): Promise<any> {
  try {
    console.log('🌐 [FELIX SUPABASE] Buscando TODOS os dados do sistema...')
    const currentCompanyId = companyId || await getCurrentCompanyId()
    
    const [
      programacaoData,
      dashboardData,
      advancedPumpData,
      plannerData,
      completeFinancialData,
      reportsData,
      collaboratorsData
    ] = await Promise.all([
      getProgramacaoData(currentCompanyId),
      getDashboardData(currentCompanyId),
      getAdvancedPumpData(currentCompanyId),
      getPlannerData(currentCompanyId),
      getCompleteFinancialData(currentCompanyId),
      getReportsForAnalysis(50, currentCompanyId),
      getCollaboratorsData(currentCompanyId)
    ])
    
    const allSystemData = {
      programacao: programacaoData,
      dashboard: dashboardData,
      bombas: advancedPumpData,
      planner: plannerData,
      financeiro: completeFinancialData,
      relatorios: reportsData,
      colaboradores: collaboratorsData,
      metadata: {
        company_id: currentCompanyId,
        timestamp: new Date().toISOString(),
        periodo: `${getFirstDayOfCurrentMonth()} a ${getLastDayOfCurrentMonth()}`,
        total_modulos: 7
      }
    }
    
    console.log('✅ [FELIX SUPABASE] TODOS os dados do sistema carregados com sucesso!')
    return allSystemData
    
  } catch (error) {
    console.error('❌ [FELIX SUPABASE] Erro ao buscar todos os dados do sistema:', error)
    throw error
  }
}

/**
 * Função de teste para verificar conexão com Supabase
 * @returns Status da conexão e dados básicos
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean
  user: any
  companyId: string
  tables: { [key: string]: boolean }
  errors: string[]
}> {
  const result = {
    success: false,
    user: null as any,
    companyId: '',
    tables: {} as { [key: string]: boolean },
    errors: [] as string[]
  }

  try {
    console.log('🔍 [FELIX SUPABASE] Testando conexão...')

    // Testar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      result.errors.push(`Erro de autenticação: ${userError.message}`)
    } else {
      result.user = user
      console.log('✅ [FELIX SUPABASE] Usuário autenticado:', user?.email)
    }

    // Testar company_id
    const companyId = await getCurrentCompanyId()
    result.companyId = companyId
    console.log('✅ [FELIX SUPABASE] Company ID:', companyId)

    // Testar tabelas principais
    const tablesToTest = [
      'users',
      'companies', 
      'pagamentos_receber',
      'expenses',
      'pumps',
      'reports',
      'colaboradores'
    ]

    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          result.tables[table] = false
          result.errors.push(`Erro na tabela ${table}: ${error.message}`)
          console.log(`❌ [FELIX SUPABASE] Tabela ${table}: ERRO - ${error.message}`)
        } else {
          result.tables[table] = true
          console.log(`✅ [FELIX SUPABASE] Tabela ${table}: OK (${data?.length || 0} registros)`)
        }
      } catch (err) {
        result.tables[table] = false
        result.errors.push(`Erro ao testar tabela ${table}: ${err}`)
        console.log(`❌ [FELIX SUPABASE] Tabela ${table}: ERRO - ${err}`)
      }
    }

    result.success = result.errors.length === 0
    console.log('🔍 [FELIX SUPABASE] Teste de conexão concluído:', result)

    return result

  } catch (error) {
    result.errors.push(`Erro geral: ${error}`)
    console.error('❌ [FELIX SUPABASE] Erro no teste de conexão:', error)
    return result
  }
}

/**
 * Função utilitária para obter ID da empresa atual
 * @returns ID da empresa ou string padrão
 */
export async function getCurrentCompanyId(): Promise<string> {
  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('⚠️ [FELIX SUPABASE] Usuário não autenticado')
      return '550e8400-e29b-41d4-a716-446655440001' // FELIX MIX (ID real da tabela)
    }

    console.log('🔍 [FELIX SUPABASE] Usuário autenticado:', user.email)

    // Primeiro, tentar buscar na tabela public.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userError && userData?.company_id) {
      console.log('✅ [FELIX SUPABASE] Company ID obtido da tabela users:', userData.company_id)
      return userData.company_id
    }

    console.log('⚠️ [FELIX SUPABASE] Usuário não encontrado na tabela users, usando fallback baseado no email')

    // Fallback: mapear por email ou usar empresa padrão
    const userEmail = user.email?.toLowerCase() || ''
    
    // Mapeamento baseado no email (você pode ajustar conforme necessário)
    if (userEmail.includes('felix') || userEmail.includes('mix')) {
      console.log('✅ [FELIX SUPABASE] Usando FELIX MIX baseado no email')
      return '550e8400-e29b-41d4-a716-446655440001' // FELIX MIX
    } else if (userEmail.includes('world') || userEmail.includes('rental')) {
      console.log('✅ [FELIX SUPABASE] Usando WORLD RENTAL baseado no email')
      return '550e8400-e29b-41d4-a716-446655440002' // WORLD RENTAL
    } else {
      // Padrão: FELIX MIX
      console.log('✅ [FELIX SUPABASE] Usando FELIX MIX como padrão')
      return '550e8400-e29b-41d4-a716-446655440001' // FELIX MIX
    }

  } catch (error) {
    console.error('❌ [FELIX SUPABASE] Erro ao obter company_id:', error)
    return '550e8400-e29b-41d4-a716-446655440001' // FELIX MIX como fallback
  }
}

/**
 * Função para buscar todos os dados necessários para análise completa
 * @param companyId - ID da empresa (opcional)
 * @returns Objeto com todos os dados para análise
 */
export async function getAllDataForAnalysis(companyId?: string) {
  try {
    console.log('🔄 [FELIX SUPABASE] Buscando todos os dados para análise...')

    const [reports, financial, pumps, collaborators] = await Promise.all([
      getReportsForAnalysis(50, companyId),
      getFinancialData(companyId),
      getPumpStatus(companyId),
      getCollaboratorsData(companyId)
    ])

    const currentCompanyId = companyId || await getCurrentCompanyId()
    
    const allData = {
      relatorios: reports,
      financeiro: financial,
      bombas: pumps,
      colaboradores: collaborators,
      metadata: {
        periodo: `${getFirstDayOfCurrentMonth()} a ${getLastDayOfCurrentMonth()}`,
        empresa_id: currentCompanyId,
        timestamp: new Date().toISOString()
      }
    }

    console.log('✅ [FELIX SUPABASE] Todos os dados carregados com sucesso')
    return allData

  } catch (error) {
    console.error('❌ [FELIX SUPABASE] Erro ao buscar todos os dados:', error)
    return null
  }
}
