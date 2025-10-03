import { supabase } from './supabase';
import type { 
  Expense, 
  ExpenseWithRelations, 
  CreateExpenseData, 
  UpdateExpenseData, 
  ExpenseFilters, 
  FinancialStats, 
  PaginatedExpenses,
  InvoiceIntegration
} from '../types/financial';

// ============================================================================
// FUNÇÕES DE VOLUME E FATURAMENTO
// ============================================================================

/**
 * Busca volume bombeado por período com informações das bombas
 */
export async function getVolumeStats(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
  try {
    let dateFilter = '';
    let groupBy = '';
    
    switch (period) {
      case 'daily':
        dateFilter = "date >= CURRENT_DATE - INTERVAL '1 day' AND date <= CURRENT_DATE";
        groupBy = 'DATE(date)';
        break;
      case 'weekly':
        dateFilter = "date >= CURRENT_DATE - INTERVAL '7 days' AND date <= CURRENT_DATE";
        groupBy = 'DATE_TRUNC(\'week\', date)';
        break;
      case 'monthly':
        dateFilter = "date >= DATE_TRUNC('month', CURRENT_DATE) AND date <= CURRENT_DATE";
        groupBy = 'DATE_TRUNC(\'month\', date)';
        break;
    }

    const { data, error } = await supabase.rpc('get_volume_stats', {
      period_filter: dateFilter,
      group_by_clause: groupBy
    });

    if (error) {
      console.error('Erro ao buscar estatísticas de volume:', error);
      throw new Error('Erro ao buscar estatísticas de volume');
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar volume stats:', error);
    return [];
  }
}

/**
 * Busca faturamento mensal
 * CORRIGIDO: Agora busca TODOS os relatórios, não apenas os PAGOS
 */
export async function getFaturamentoMensal() {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('reports')
      .select('total_value, realized_volume, date, status, pump_prefix')
      .gte('date', startOfMonthStr);
      // REMOVIDO: .eq('status', 'PAGO') - Agora busca TODOS os relatórios

    if (error) {
      console.error('Erro ao buscar faturamento mensal:', error);
      throw new Error('Erro ao buscar faturamento mensal');
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Agrupar por mês
    const monthlyData = data.reduce((acc, report) => {
      const month = new Date(report.date).getMonth();
      const year = new Date(report.date).getFullYear();
      const monthKey = `${year}-${month}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          mes: new Date(year, month, 1),
          faturamento_total: 0,
          volume_total: 0,
          total_relatorios: 0
        };
      }
      
      acc[monthKey].faturamento_total += report.total_value || 0;
      acc[monthKey].volume_total += report.realized_volume || 0;
      acc[monthKey].total_relatorios += 1;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyData);
  } catch (error) {
    console.error('Erro ao buscar faturamento mensal:', error);
    return [];
  }
}

/**
 * Busca volume diário com bombas
 * CORRIGIDO: Agora busca TODOS os relatórios, não apenas os PAGOS
 * NOVO: Aceita filtro de pump_prefix para filtrar por bomba específica
 */
export async function getVolumeDiarioComBombas(filters?: { pump_prefix?: string }) {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('🔍 [getVolumeDiarioComBombas] Buscando dados para:', today, filters);
    
    let query = supabase
      .from('reports')
      .select('pump_prefix, realized_volume, total_value, date, status')
      .eq('date', today);
      // REMOVIDO: .eq('status', 'PAGO') - Agora busca TODOS os relatórios

    // Aplicar filtro de bomba se fornecido
    if (filters?.pump_prefix) {
      console.log('🚛 [getVolumeDiarioComBombas] Filtrando por bomba:', filters.pump_prefix);
      query = query.eq('pump_prefix', filters.pump_prefix);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar volume diário:', error);
      throw new Error('Erro ao buscar volume diário');
    }

    console.log('📊 [getVolumeDiarioComBombas] Dados encontrados:', data?.length || 0);
    
    if (!data || data.length === 0) {
      console.log('⚠️ [getVolumeDiarioComBombas] Nenhum dado encontrado para hoje');
      return [];
    }

    // Agrupar por bomba
    const bombaData = data.reduce((acc, report) => {
      const bombaPrefix = report.pump_prefix || 'N/A';
      
      if (!acc[bombaPrefix]) {
        acc[bombaPrefix] = {
          pump_prefix: bombaPrefix,
          volume_total: 0,
          total_servicos: 0,
          faturamento_total: 0
        };
      }
      
      acc[bombaPrefix].volume_total += report.realized_volume || 0;
      acc[bombaPrefix].total_servicos += 1;
      acc[bombaPrefix].faturamento_total += report.total_value || 0;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(bombaData).sort((a: any, b: any) => b.volume_total - a.volume_total);
  } catch (error) {
    console.error('Erro ao buscar volume diário:', error);
    return [];
  }
}

/**
 * Busca volume semanal com bombas
 * CORRIGIDO: Agora busca TODOS os relatórios, não apenas os PAGOS
 * NOVO: Aceita filtro de pump_prefix para filtrar por bomba específica
 */
export async function getVolumeSemanalComBombas(filters?: { pump_prefix?: string }) {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Se domingo, volta 6 dias; senão, calcula para segunda
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + mondayOffset);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    
    let query = supabase
      .from('reports')
      .select('pump_prefix, realized_volume, total_value, date, status')
      .gte('date', startOfWeekStr);
      // REMOVIDO: .eq('status', 'PAGO') - Agora busca TODOS os relatórios

    // Aplicar filtro de bomba se fornecido
    if (filters?.pump_prefix) {
      console.log('🚛 [getVolumeSemanalComBombas] Filtrando por bomba:', filters.pump_prefix);
      query = query.eq('pump_prefix', filters.pump_prefix);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar volume semanal:', error);
      throw new Error('Erro ao buscar volume semanal');
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Agrupar por bomba
    const bombaData = data.reduce((acc, report) => {
      const bombaPrefix = report.pump_prefix || 'N/A';
      
      if (!acc[bombaPrefix]) {
        acc[bombaPrefix] = {
          pump_prefix: bombaPrefix,
          volume_total: 0,
          total_servicos: 0,
          faturamento_total: 0
        };
      }
      
      acc[bombaPrefix].volume_total += report.realized_volume || 0;
      acc[bombaPrefix].total_servicos += 1;
      acc[bombaPrefix].faturamento_total += report.total_value || 0;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(bombaData).sort((a: any, b: any) => b.volume_total - a.volume_total);
  } catch (error) {
    console.error('Erro ao buscar volume semanal:', error);
    return [];
  }
}

/**
 * Busca volume mensal com bombas
 * CORRIGIDO: Agora busca TODOS os relatórios, não apenas os PAGOS
 * NOVO: Aceita filtro de pump_prefix para filtrar por bomba específica
 */
export async function getVolumeMensalComBombas(filters?: { pump_prefix?: string }) {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
    
    let query = supabase
      .from('reports')
      .select('pump_prefix, realized_volume, total_value, date, status')
      .gte('date', startOfMonthStr);
      // REMOVIDO: .eq('status', 'PAGO') - Agora busca TODOS os relatórios

    // Aplicar filtro de bomba se fornecido
    if (filters?.pump_prefix) {
      console.log('🚛 [getVolumeMensalComBombas] Filtrando por bomba:', filters.pump_prefix);
      query = query.eq('pump_prefix', filters.pump_prefix);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar volume mensal:', error);
      throw new Error('Erro ao buscar volume mensal');
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Agrupar por bomba
    const bombaData = data.reduce((acc, report) => {
      const bombaPrefix = report.pump_prefix || 'N/A';
      
      if (!acc[bombaPrefix]) {
        acc[bombaPrefix] = {
          pump_prefix: bombaPrefix,
          volume_total: 0,
          total_servicos: 0,
          faturamento_total: 0
        };
      }
      
      acc[bombaPrefix].volume_total += report.realized_volume || 0;
      acc[bombaPrefix].total_servicos += 1;
      acc[bombaPrefix].faturamento_total += report.total_value || 0;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(bombaData).sort((a: any, b: any) => b.volume_total - a.volume_total);
  } catch (error) {
    console.error('Erro ao buscar volume mensal:', error);
    return [];
  }
}

// ============================================================================
// FUNÇÕES DE DESPESAS
// ============================================================================

/**
 * Busca todas as despesas com filtros opcionais
 */
export async function getExpenses(filters?: ExpenseFilters): Promise<ExpenseWithRelations[]> {
  console.log('🔍 [getExpenses] Aplicando filtros:', filters);
  
  let query = supabase
    .from('expenses')
    .select(`
      *,
      pumps: pump_id (
        prefix,
        model,
        brand
      ),
      companies: company_id (
        name
      ),
      notas_fiscais: nota_fiscal_id (
        numero_nota
      )
    `)
    .order('data_despesa', { ascending: false });

  // Aplicar filtros
  if (filters?.company_id) {
    console.log('🏢 [getExpenses] Filtrando por empresa:', filters.company_id);
    query = query.eq('company_id', filters.company_id);
  }

  if (filters?.pump_id) {
    console.log('🚛 [getExpenses] Filtrando por bomba:', filters.pump_id);
    query = query.eq('pump_id', filters.pump_id);
  }

  if (filters?.categoria && filters.categoria.length > 0) {
    console.log('📦 [getExpenses] Filtrando por categoria:', filters.categoria);
    query = query.in('categoria', filters.categoria);
  }

  if (filters?.tipo_custo && filters.tipo_custo.length > 0) {
    console.log('💰 [getExpenses] Filtrando por tipo de custo:', filters.tipo_custo);
    query = query.in('tipo_custo', filters.tipo_custo);
  }

  if (filters?.tipo_transacao && filters.tipo_transacao.length > 0) {
    console.log('🔄 [getExpenses] Filtrando por tipo de transação:', filters.tipo_transacao);
    query = query.in('tipo_transacao', filters.tipo_transacao);
  }

  if (filters?.status && filters.status.length > 0) {
    console.log('📋 [getExpenses] Filtrando por status:', filters.status);
    query = query.in('status', filters.status);
  }

  if (filters?.data_inicio) {
    console.log('📅 [getExpenses] Filtrando por data início:', filters.data_inicio);
    query = query.gte('data_despesa', filters.data_inicio);
  }

  if (filters?.data_fim) {
    console.log('📅 [getExpenses] Filtrando por data fim:', filters.data_fim);
    query = query.lte('data_despesa', filters.data_fim);
  }

  if (filters?.search) {
    console.log('🔍 [getExpenses] Filtrando por busca:', filters.search);
    query = query.ilike('descricao', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ [getExpenses] Erro ao buscar despesas:', error);
    throw new Error('Erro ao buscar despesas');
  }

  console.log('✅ [getExpenses] Despesas encontradas:', data?.length || 0, 'itens');

  // Transformar dados para incluir relações
  return (data || []).map(expense => ({
    ...expense,
    bomba_prefix: expense.pumps?.prefix,
    bomba_model: expense.pumps?.model,
    bomba_brand: expense.pumps?.brand,
    company_name: expense.companies?.name,
    nota_fiscal_numero: expense.notas_fiscais?.numero_nota
  }));
}

/**
 * Busca despesas com paginação
 */
export async function getExpensesPaginated(
  page: number = 1,
  limit: number = 10,
  filters?: ExpenseFilters
): Promise<PaginatedExpenses> {
  const offset = (page - 1) * limit;

  // Primeiro, contar o total
  let countQuery = supabase
    .from('expenses')
    .select('*', { count: 'exact', head: true });

  // Aplicar mesmos filtros para contagem
  if (filters?.company_id) {
    countQuery = countQuery.eq('company_id', filters.company_id);
  }

  if (filters?.pump_id) {
    countQuery = countQuery.eq('pump_id', filters.pump_id);
  }

  if (filters?.categoria && filters.categoria.length > 0) {
    countQuery = countQuery.in('categoria', filters.categoria);
  }

  if (filters?.tipo_custo && filters.tipo_custo.length > 0) {
    countQuery = countQuery.in('tipo_custo', filters.tipo_custo);
  }

  if (filters?.status && filters.status.length > 0) {
    countQuery = countQuery.in('status', filters.status);
  }

  if (filters?.data_inicio) {
    countQuery = countQuery.gte('data_despesa', filters.data_inicio);
  }

  if (filters?.data_fim) {
    countQuery = countQuery.lte('data_despesa', filters.data_fim);
  }

  if (filters?.search) {
    countQuery = countQuery.ilike('descricao', `%${filters.search}%`);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error('Erro ao contar despesas:', countError);
    throw new Error('Erro ao contar despesas');
  }

  // Buscar dados paginados
  const data = await getExpenses(filters);
  const paginatedData = data.slice(offset, offset + limit);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
}

/**
 * Busca uma despesa específica por ID
 */
export async function getExpenseById(id: string): Promise<ExpenseWithRelations | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      pumps: pump_id (
        prefix,
        model,
        brand
      ),
      companies: company_id (
        name
      ),
      notas_fiscais: nota_fiscal_id (
        numero_nota
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    console.error('Erro ao buscar despesa:', error);
    throw new Error('Erro ao buscar despesa');
  }

  return {
    ...data,
    bomba_prefix: data.pumps?.prefix,
    bomba_model: data.pumps?.model,
    bomba_brand: data.pumps?.brand,
    company_name: data.companies?.name,
    nota_fiscal_numero: data.notas_fiscais?.numero_nota
  };
}

/**
 * Cria uma nova transação financeira (despesa ou faturamento)
 */
export async function createExpense(expenseData: CreateExpenseData): Promise<Expense> {
  // Se pump_id foi fornecido, buscar o company_id da bomba
  let finalCompanyId = expenseData.company_id;
  
  if (expenseData.pump_id) {
    const { data: bombaData, error: bombaError } = await supabase
      .from('pumps')
      .select('company_id')
      .eq('id', expenseData.pump_id)
      .single();

    if (!bombaError && bombaData) {
      finalCompanyId = bombaData.company_id;
    }
  }

  // Determinar o valor baseado no tipo de transação
  let valorFinal = Math.abs(expenseData.valor);
  if (expenseData.tipo_transacao === 'Saída') {
    valorFinal = -valorFinal; // Despesas são negativas (saída de dinheiro)
  }
  // Entradas já são positivas por padrão

  // Remover campos que não existem na tabela
  const { tipo_transacao, ...expenseDataClean } = expenseData;
  
  const insertData = {
    ...expenseDataClean,
    valor: valorFinal,
    company_id: finalCompanyId, // Usar company_id da bomba se disponível
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log('🔍 [createExpense] Dados para inserção:', insertData);

  const { data, error } = await supabase
    .from('expenses')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ [createExpense] Erro ao criar transação:', error);
    console.error('❌ [createExpense] Dados que causaram erro:', insertData);
    throw new Error('Erro ao criar transação');
  }

  return data;
}

/**
 * Atualiza uma transação financeira existente
 */
export async function updateExpense(expenseData: UpdateExpenseData): Promise<Expense> {
  const { id, ...updateData } = expenseData;

  // Se o valor está sendo atualizado, aplicar a lógica de tipo de transação
  if (updateData.valor !== undefined) {
    let valorFinal = Math.abs(updateData.valor);
    if (updateData.tipo_transacao === 'Saída') {
      valorFinal = -valorFinal; // Despesas são negativas (saída de dinheiro)
    }
    updateData.valor = valorFinal;
  }

  const { data, error } = await supabase
    .from('expenses')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar transação:', error);
    throw new Error('Erro ao atualizar transação');
  }

  return data;
}

/**
 * Exclui uma despesa
 */
export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir despesa:', error);
    throw new Error('Erro ao excluir despesa');
  }
}

// ============================================================================
// FUNÇÕES DE ESTATÍSTICAS FINANCEIRAS
// ============================================================================

/**
 * Busca estatísticas financeiras consolidadas
 */
export async function getFinancialStats(filters?: ExpenseFilters): Promise<FinancialStats> {
  console.log('🔍 [getFinancialStats] Buscando estatísticas financeiras...', filters);
  
  let query = supabase
    .from('expenses')
    .select(`
      valor,
      categoria,
      pump_id,
      company_id,
      tipo_custo,
      data_despesa,
      pumps: pump_id (
        prefix
      ),
      companies: company_id (
        name
      )
    `);

  // Aplicar filtros
  if (filters?.company_id) {
    query = query.eq('company_id', filters.company_id);
  }

  if (filters?.pump_id) {
    console.log('🚛 [getFinancialStats] Filtrando por bomba:', filters.pump_id);
    query = query.eq('pump_id', filters.pump_id);
  }

  if (filters?.data_inicio) {
    query = query.gte('data_despesa', filters.data_inicio);
  }

  if (filters?.data_fim) {
    query = query.lte('data_despesa', filters.data_fim);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar estatísticas:', error);
    throw new Error('Erro ao buscar estatísticas');
  }

  const expenses = data || [];
  console.log('📊 [getFinancialStats] Despesas encontradas:', expenses.length);

  // Calcular total de despesas
  const total_despesas = expenses.reduce((sum, expense) => sum + expense.valor, 0);
  console.log('💰 [getFinancialStats] Total de despesas calculado:', total_despesas);

  // Calcular total por categoria
  const total_por_categoria = expenses.reduce((acc, expense) => {
    acc[expense.categoria] = (acc[expense.categoria] || 0) + expense.valor;
    return acc;
  }, {} as Record<string, number>);

  // Calcular total por bomba
  const total_por_bomba = expenses.reduce((acc, expense) => {
    const pumpId = expense.pump_id;
    const existing = acc.find(item => item.pump_id === pumpId);
    
    if (existing) {
      existing.total += expense.valor;
    } else {
      acc.push({
        pump_id: pumpId,
        bomba_prefix: (expense.pumps as any)?.prefix || 'N/A',
        total: expense.valor
      });
    }
    
    return acc;
  }, [] as Array<{ pump_id: string; bomba_prefix: string; total: number }>);

  // Calcular total por empresa
  const total_por_empresa = expenses.reduce((acc, expense) => {
    const companyId = expense.company_id;
    const existing = acc.find(item => item.company_id === companyId);
    
    if (existing) {
      existing.total += expense.valor;
    } else {
      acc.push({
        company_id: companyId,
        company_name: (expense.companies as any)?.name || 'N/A',
        total: expense.valor
      });
    }
    
    return acc;
  }, [] as Array<{ company_id: string; company_name: string; total: number }>);

  // Calcular despesas por período (últimos 12 meses)
  const despesas_por_periodo = expenses.reduce((acc, expense) => {
    const date = new Date(expense.data_despesa);
    const periodo = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const existing = acc.find(item => item.periodo === periodo);
    if (existing) {
      existing.total += expense.valor;
    } else {
      acc.push({ periodo, total: expense.valor });
    }
    
    return acc;
  }, [] as Array<{ periodo: string; total: number }>);

  // Calcular total por tipo
  const despesas_por_tipo = expenses.reduce((acc, expense) => {
    acc[expense.tipo_custo] = (acc[expense.tipo_custo] || 0) + expense.valor;
    return acc;
  }, {} as Record<string, number>);

  return {
    total_despesas,
    total_por_categoria,
    total_por_bomba,
    total_por_empresa,
    despesas_por_periodo,
    despesas_por_tipo
  };
}

// ============================================================================
// FUNÇÕES DE INTEGRAÇÃO COM FATURAMENTO DE RELATÓRIOS
// ============================================================================

/**
 * Cria entrada de faturamento a partir de relatório pago
 */
export async function createFaturamentoFromReport(
  reportId: string,
  additionalData: Partial<CreateExpenseData>
): Promise<Expense> {
  // Buscar dados do relatório
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select(`
      *,
      pumps: pump_id (
        prefix,
        company_id
      ),
      clients: client_id (
        companies: company_id (
          name
        )
      )
    `)
    .eq('id', reportId)
    .single();

  if (reportError || !report) {
    throw new Error('Relatório não encontrado');
  }

  // Verificar se já existe uma entrada para este relatório
  const { data: existingEntry } = await supabase
    .from('expenses')
    .select('id')
    .eq('relatorio_id', reportId)
    .eq('tipo_transacao', 'Entrada')
    .single();

  if (existingEntry) {
    throw new Error('Já existe uma entrada de faturamento para este relatório');
  }

  // Criar entrada de faturamento
  const faturamentoData: CreateExpenseData = {
    descricao: `Faturamento - Relatório ${report.report_number || report.id}`,
    categoria: 'Outros', // Categoria padrão para faturamento
    valor: Math.abs(report.total_value || 0), // Valor positivo para entrada
    tipo_custo: 'variável',
    tipo_transacao: 'Entrada', // Classificar como entrada
    data_despesa: report.date,
    pump_id: report.pump_id,
    company_id: report.pumps?.company_id || report.client_id,
    status: 'pago', // Faturamento sempre pago
    relatorio_id: reportId,
    observacoes: `Faturamento automático do relatório ${report.report_number || report.id} - Cliente: ${report.clients?.companies?.name || 'N/A'}`,
    ...additionalData
  };

  return createExpense(faturamentoData);
}

/**
 * Sincroniza todos os relatórios pagos como entradas de faturamento
 */
export async function syncFaturamentoFromReports(): Promise<{ created: number; errors: string[] }> {
  try {
    console.log('🔄 [syncFaturamentoFromReports] Iniciando sincronização de faturamento...');
    
    // Buscar todos os relatórios pagos que ainda não têm entrada de faturamento
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        id,
        report_number,
        total_value,
        date,
        pump_id,
        client_id,
        pumps: pump_id (
          prefix,
          company_id
        ),
        clients: client_id (
          companies: company_id (
            name
          )
        )
      `)
      .eq('status', 'PAGO')
      .not('total_value', 'is', null);

    if (error) {
      throw new Error('Erro ao buscar relatórios pagos');
    }

    if (!reports || reports.length === 0) {
      console.log('⚠️ [syncFaturamentoFromReports] Nenhum relatório pago encontrado');
      return { created: 0, errors: [] };
    }

    console.log(`📊 [syncFaturamentoFromReports] Encontrados ${reports.length} relatórios pagos`);

    let created = 0;
    const errors: string[] = [];

    // Verificar quais relatórios já têm entrada de faturamento
    const { data: existingEntries } = await supabase
      .from('expenses')
      .select('relatorio_id')
      .eq('tipo_transacao', 'Entrada')
      .not('relatorio_id', 'is', null);

    const existingReportIds = new Set(existingEntries?.map(e => e.relatorio_id) || []);

    // Criar entradas para relatórios que ainda não têm
    for (const report of reports) {
      if (existingReportIds.has(report.id)) {
        continue; // Já existe entrada para este relatório
      }

      try {
        await createFaturamentoFromReport(report.id, {});
        created++;
        console.log(`✅ [syncFaturamentoFromReports] Criada entrada para relatório ${report.id}`);
      } catch (error) {
        const errorMsg = `Erro ao criar entrada para relatório ${report.id}: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ [syncFaturamentoFromReports] ${errorMsg}`);
      }
    }

    console.log(`🎉 [syncFaturamentoFromReports] Sincronização concluída: ${created} entradas criadas, ${errors.length} erros`);
    return { created, errors };
  } catch (error) {
    console.error('❌ [syncFaturamentoFromReports] Erro na sincronização:', error);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES DE INTEGRAÇÃO COM NOTAS FISCAIS
// ============================================================================

/**
 * Busca notas fiscais com status "Paga" para integração
 */
export async function getPaidInvoices(): Promise<InvoiceIntegration[]> {
  const { data, error } = await supabase
    .from('notas_fiscais')
    .select(`
      id,
      numero_nota,
      valor,
      data_emissao,
      data_vencimento,
      status,
      reports: relatorio_id (
        pumps: pump_id (
          prefix
        ),
        clients: client_id (
          companies: company_id (
            name
          )
        )
      )
    `)
    .eq('status', 'Paga')
    .order('data_emissao', { ascending: false });

  if (error) {
    console.error('Erro ao buscar notas fiscais pagas:', error);
    throw new Error('Erro ao buscar notas fiscais pagas');
  }

  return (data || []).map(invoice => ({
    nota_fiscal_id: invoice.id,
    numero_nota: invoice.numero_nota,
    valor: invoice.valor,
    data_emissao: invoice.data_emissao,
    data_vencimento: invoice.data_vencimento,
    status: invoice.status as 'Faturada' | 'Paga' | 'Cancelada',
    empresa_nome: (invoice.reports as any)?.clients?.companies?.name,
    bomba_prefix: (invoice.reports as any)?.pumps?.prefix
  }));
}

/**
 * Cria despesa a partir de nota fiscal paga
 */
export async function createExpenseFromInvoice(
  invoiceId: string,
  additionalData: Partial<CreateExpenseData>
): Promise<Expense> {
  // Buscar dados da nota fiscal
  const { data: invoice, error: invoiceError } = await supabase
    .from('notas_fiscais')
    .select(`
      *,
      reports: relatorio_id (
        pump_id,
        client_id,
        clients: client_id (
          company_id
        )
      )
    `)
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error('Nota fiscal não encontrada');
  }

  // Criar despesa baseada na nota fiscal
  const expenseData: CreateExpenseData = {
    descricao: `Despesa da NF ${invoice.numero_nota}`,
    categoria: 'Outros', // Categoria padrão
    valor: invoice.valor,
    tipo_custo: 'variável',
    tipo_transacao: 'Saída', // Notas fiscais são sempre despesas (saídas)
    data_despesa: invoice.data_emissao,
    pump_id: invoice.reports?.pump_id || '',
    company_id: invoice.reports?.clients?.company_id || '',
    status: 'pago',
    nota_fiscal_id: invoice.id,
    observacoes: `Criada automaticamente a partir da NF ${invoice.numero_nota}`,
    ...additionalData
  };

  return createExpense(expenseData);
}

// ============================================================================
// FUNÇÕES PARA DADOS POR EMPRESA
// ============================================================================

/**
 * Busca faturamento bruto por empresa
 * NOVO: Aceita filtro de pump_prefix para filtrar por bomba específica
 */
export async function getFaturamentoBrutoPorEmpresa(filters?: { pump_prefix?: string }) {
  try {
    console.log('🔍 [getFaturamentoBrutoPorEmpresa] Buscando faturamento por empresa...', filters);
    
    let query = supabase
      .from('reports')
      .select(`
        total_value,
        company_id,
        pump_prefix,
        companies:company_id(name)
      `)
      .eq('status', 'PAGO');

    // Aplicar filtro de bomba se fornecido
    if (filters?.pump_prefix) {
      console.log('🚛 [getFaturamentoBrutoPorEmpresa] Filtrando por bomba:', filters.pump_prefix);
      query = query.eq('pump_prefix', filters.pump_prefix);
    }

    const { data, error } = await query;

    if (error) throw error;

    console.log('📊 [getFaturamentoBrutoPorEmpresa] Dados encontrados:', data?.length || 0);

    // Agrupar por empresa
    const faturamentoPorEmpresa = (data || []).reduce((acc: any, report: any) => {
      const companyId = report.company_id;
      const companyName = report.companies?.name || 'Empresa não identificada';
      
      if (!acc[companyId]) {
        acc[companyId] = {
          company_id: companyId,
          company_name: companyName,
          faturamento_bruto: 0,
          total_relatorios: 0
        };
      }
      
      acc[companyId].faturamento_bruto += report.total_value || 0;
      acc[companyId].total_relatorios += 1;
      
      return acc;
    }, {});

    const result = Object.values(faturamentoPorEmpresa);
    console.log('💰 [getFaturamentoBrutoPorEmpresa] Resultado final:', result);
    
    return result;
  } catch (error) {
    console.error('Erro ao buscar faturamento por empresa:', error);
    throw error;
  }
}

/**
 * Busca despesas por empresa
 * NOVO: Aceita filtro de pump_prefix para filtrar por bomba específica
 */
export async function getDespesasPorEmpresa(filters?: { pump_prefix?: string }) {
  try {
    console.log('🔍 [getDespesasPorEmpresa] Buscando despesas por empresa...', filters);
    
    let query = supabase
      .from('expenses')
      .select(`
        valor,
        company_id,
        pump_id,
        companies:company_id(name),
        pumps:pump_id(prefix)
      `);

    // Aplicar filtro de bomba se fornecido
    if (filters?.pump_prefix) {
      console.log('🚛 [getDespesasPorEmpresa] Filtrando por bomba:', filters.pump_prefix);
      // Primeiro, buscar o pump_id baseado no prefix
      const { data: pumpData, error: pumpError } = await supabase
        .from('pumps')
        .select('id')
        .eq('prefix', filters.pump_prefix)
        .single();
      
      if (pumpError) {
        console.error('Erro ao buscar bomba por prefix:', pumpError);
        return [];
      }
      
      if (pumpData) {
        query = query.eq('pump_id', pumpData.id);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    console.log('📊 [getDespesasPorEmpresa] Dados encontrados:', data?.length || 0);

    // Agrupar por empresa
    const despesasPorEmpresa = (data || []).reduce((acc: any, expense: any) => {
      const companyId = expense.company_id;
      const companyName = expense.companies?.name || 'Empresa não identificada';
      
      if (!acc[companyId]) {
        acc[companyId] = {
          company_id: companyId,
          company_name: companyName,
          total_despesas: 0,
          quantidade_despesas: 0
        };
      }
      
      acc[companyId].total_despesas += expense.valor || 0;
      acc[companyId].quantidade_despesas += 1;
      
      return acc;
    }, {});

    const result = Object.values(despesasPorEmpresa);
    console.log('💰 [getDespesasPorEmpresa] Resultado final:', result);
    
    return result;
  } catch (error) {
    console.error('Erro ao buscar despesas por empresa:', error);
    throw error;
  }
}

/**
 * Busca dados financeiros completos por empresa
 * NOVO: Aceita filtro de pump_prefix para filtrar por bomba específica
 */
export async function getDadosFinanceirosPorEmpresa(filters?: { pump_prefix?: string }) {
  try {
    const [faturamentoData, despesasData] = await Promise.all([
      getFaturamentoBrutoPorEmpresa(filters),
      getDespesasPorEmpresa(filters)
    ]);

    // Combinar dados por empresa
    const empresasMap = new Map();

    // Adicionar faturamento
    faturamentoData.forEach((empresa: any) => {
      empresasMap.set(empresa.company_id, {
        ...empresa,
        total_despesas: 0,
        quantidade_despesas: 0
      });
    });

    // Adicionar despesas
    despesasData.forEach((empresa: any) => {
      const existing = empresasMap.get(empresa.company_id);
      if (existing) {
        existing.total_despesas = empresa.total_despesas;
        existing.quantidade_despesas = empresa.quantidade_despesas;
      } else {
        empresasMap.set(empresa.company_id, {
          company_id: empresa.company_id,
          company_name: empresa.company_name,
          faturamento_bruto: 0,
          total_relatorios: 0,
          total_despesas: empresa.total_despesas,
          quantidade_despesas: empresa.quantidade_despesas
        });
      }
    });

    // Calcular caixa de cada empresa
    const empresasComCaixa = Array.from(empresasMap.values()).map((empresa: any) => ({
      ...empresa,
      caixa_empresa: empresa.faturamento_bruto + empresa.total_despesas // despesas são negativas
    }));

    return empresasComCaixa;
  } catch (error) {
    console.error('Erro ao buscar dados financeiros por empresa:', error);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES PARA LISTA COMPLETA DE ENTRADAS/SAÍDAS
// ============================================================================

/**
 * Busca todas as entradas (relatórios) para lista completa
 */
export async function getAllEntries(filters?: { pump_prefix?: string }) {
  try {
    console.log('🔍 [getAllEntries] Buscando todas as entradas...', filters);
    
    let query = supabase
      .from('reports')
      .select(`
        id,
        report_number,
        total_value,
        date,
        pump_prefix,
        status,
        realized_volume,
        client_id,
        pump_id,
        clients: client_id (
          name,
          company_id,
          companies: company_id (
            name
          )
        )
      `)
      .eq('status', 'PAGO')
      .order('date', { ascending: false });

    // Aplicar filtro de bomba se fornecido
    if (filters?.pump_prefix) {
      console.log('🚛 [getAllEntries] Filtrando por bomba:', filters.pump_prefix);
      query = query.eq('pump_prefix', filters.pump_prefix);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar entradas:', error);
      throw new Error('Erro ao buscar entradas');
    }

    console.log('📊 [getAllEntries] Entradas encontradas:', data?.length || 0);

    return (data || []).map(report => ({
      id: report.id,
      type: 'entrada',
      description: `Relatório ${report.report_number}`,
      value: report.total_value || 0,
      date: report.date,
      pump_prefix: report.pump_prefix,
      status: report.status,
      realized_volume: report.realized_volume,
      client_name: (report.clients as any)?.name || 'N/A',
      company_name: (report.clients as any)?.companies?.name || 'N/A',
      bomba_model: 'N/A',
      bomba_brand: 'N/A'
    }));
  } catch (error) {
    console.error('Erro ao buscar entradas:', error);
    return [];
  }
}

/**
 * Busca todas as saídas (despesas) para lista completa
 */
export async function getAllExits(filters?: { pump_prefix?: string }) {
  try {
    console.log('🔍 [getAllExits] Buscando todas as saídas...', filters);
    
    let query = supabase
      .from('expenses')
      .select(`
        id,
        descricao,
        valor,
        data_despesa,
        categoria,
        tipo_custo,
        status,
        pump_id,
        company_id
      `)
      .order('data_despesa', { ascending: false });

    // Aplicar filtro de bomba se fornecido
    if (filters?.pump_prefix) {
      console.log('🚛 [getAllExits] Filtrando por bomba:', filters.pump_prefix);
      try {
        // Primeiro, buscar o pump_id baseado no prefix
        const { data: pumpData, error: pumpError } = await supabase
          .from('pumps')
          .select('id')
          .eq('prefix', filters.pump_prefix)
          .single();
        
        if (pumpError) {
          console.error('❌ [getAllExits] Erro ao buscar bomba por prefix:', pumpError);
          // Continuar sem filtro de bomba se não conseguir encontrar
          console.log('⚠️ [getAllExits] Continuando sem filtro de bomba');
        } else if (pumpData) {
          console.log('✅ [getAllExits] Bomba encontrada:', pumpData.id);
          query = query.eq('pump_id', pumpData.id);
        } else {
          console.log('⚠️ [getAllExits] Bomba não encontrada, continuando sem filtro');
        }
      } catch (error) {
        console.error('❌ [getAllExits] Erro na busca da bomba:', error);
        // Continuar sem filtro de bomba
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [getAllExits] Erro ao buscar saídas:', error);
      throw new Error('Erro ao buscar saídas');
    }

    console.log('📊 [getAllExits] Saídas encontradas:', data?.length || 0);
    console.log('📋 [getAllExits] Dados das saídas:', data);

    return (data || []).map(expense => ({
      id: expense.id,
      type: 'saida',
      description: expense.descricao,
      value: Math.abs(expense.valor), // Saídas são sempre positivas para exibição
      date: expense.data_despesa,
      pump_prefix: 'N/A', // Simplificado para evitar problemas de relação
      status: 'Descontado', // Todas as despesas aparecem como "Descontado"
      categoria: expense.categoria,
      tipo_custo: expense.tipo_custo,
      company_name: 'N/A', // Simplificado para evitar problemas de relação
      bomba_model: 'N/A',
      bomba_brand: 'N/A'
    }));
  } catch (error) {
    console.error('Erro ao buscar saídas:', error);
    return [];
  }
}

/**
 * Busca lista completa de entradas e saídas combinadas
 */
export async function getAllEntriesAndExits(filters?: { pump_prefix?: string }) {
  try {
    console.log('🔍 [getAllEntriesAndExits] Buscando entradas e saídas...', filters);
    
    const [entries, exits] = await Promise.all([
      getAllEntries(filters),
      getAllExits(filters)
    ]);

    console.log('📊 [getAllEntriesAndExits] Entradas recebidas:', entries.length);
    console.log('📊 [getAllEntriesAndExits] Saídas recebidas:', exits.length);
    console.log('📋 [getAllEntriesAndExits] Entradas:', entries);
    console.log('📋 [getAllEntriesAndExits] Saídas:', exits);

    // Combinar e ordenar por data
    const allTransactions = [...entries, ...exits].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    console.log('📊 [getAllEntriesAndExits] Total de transações:', allTransactions.length);
    console.log('📋 [getAllEntriesAndExits] Transações combinadas:', allTransactions);

    return allTransactions;
  } catch (error) {
    console.error('Erro ao buscar entradas e saídas:', error);
    return [];
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Busca bombas disponíveis para select
 */
export async function getPumpsForSelect(companyId?: string) {
  let query = supabase
    .from('pumps')
    .select('id, prefix, model, brand')
    .order('prefix');

  if (companyId) {
    query = query.eq('owner_company_id', companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar bombas:', error);
    throw new Error('Erro ao buscar bombas');
  }

  return data || [];
}

/**
 * Busca empresas disponíveis para select
 */
export async function getCompaniesForSelect() {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Erro ao buscar empresas:', error);
    throw new Error('Erro ao buscar empresas');
  }

  return data || [];
}

/**
 * Busca estatísticas de combustível para uma bomba específica
 */
export async function getFuelStatsForPump(pumpId: string, dateRange?: { inicio: string; fim: string }) {
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('pump_id', pumpId)
    .eq('categoria', 'Diesel');

  if (dateRange?.inicio) {
    query = query.gte('data_despesa', dateRange.inicio);
  }

  if (dateRange?.fim) {
    query = query.lte('data_despesa', dateRange.fim);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar estatísticas de combustível:', error);
    throw new Error('Erro ao buscar estatísticas de combustível');
  }

  const expenses = data || [];

  return {
    total_litros: expenses.reduce((sum, exp) => sum + (exp.quantidade_litros || 0), 0),
    total_gasto: expenses.reduce((sum, exp) => sum + exp.valor, 0),
    media_preco_litro: expenses.length > 0 
      ? expenses.reduce((sum, exp) => sum + (exp.custo_por_litro || 0), 0) / expenses.length 
      : 0,
    quilometragem_total: expenses.reduce((sum, exp) => sum + (exp.quilometragem_atual || 0), 0)
  };
}

// ============================================================================
// FUNÇÕES DE FATURAMENTO BRUTO
// ============================================================================

/**
 * Busca estatísticas de faturamento bruto
 * CORRIGIDO: Busca apenas relatórios PAGOS para KPIs de faturamento bruto
 * NOVO: Aceita filtro de pump_prefix para filtrar por bomba específica
 */
export async function getFaturamentoBrutoStats(filters?: { pump_prefix?: string }) {
  try {
    console.log('🔍 [getFaturamentoBrutoStats] Buscando estatísticas de faturamento...', filters);
    
    // Buscar dados diretamente da tabela reports - APENAS relatórios PAGOS para faturamento bruto
    let query = supabase
      .from('reports')
      .select('total_value, realized_volume, date, status, pump_prefix')
      .eq('status', 'PAGO'); // RESTAURADO: Apenas relatórios PAGOS para faturamento bruto

    // Aplicar filtro de bomba se fornecido
    if (filters?.pump_prefix) {
      console.log('🚛 [getFaturamentoBrutoStats] Filtrando por bomba:', filters.pump_prefix);
      query = query.eq('pump_prefix', filters.pump_prefix);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar estatísticas de faturamento:', error);
      throw new Error('Erro ao buscar estatísticas de faturamento');
    }

    console.log('📊 [getFaturamentoBrutoStats] Dados encontrados (apenas PAGOS):', data?.length || 0);
    
    if (!data || data.length === 0) {
      console.log('⚠️ [getFaturamentoBrutoStats] Nenhum relatório PAGO encontrado');
      return {
        total_relatorios_pagos: 0,
        total_faturado: 0,
        faturado_hoje: 0,
        relatorios_hoje: 0,
        volume_total_bombeado: 0,
        faturamento_por_bomba: []
      };
    }

    // Calcular estatísticas
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const totalFaturado = data.reduce((sum, report) => sum + (report.total_value || 0), 0);
    
    // CORRIGIDO: Volume total deve incluir TODOS os relatórios, não apenas PAGOS
    // Buscar volume total de todos os relatórios separadamente, aplicando filtro se necessário
    let volumeQuery = supabase
      .from('reports')
      .select('realized_volume, pump_prefix')
      .not('realized_volume', 'is', null);

    // Aplicar filtro de bomba se fornecido
    if (filters?.pump_prefix) {
      console.log('🚛 [getFaturamentoBrutoStats] Filtrando volume por bomba:', filters.pump_prefix);
      volumeQuery = volumeQuery.eq('pump_prefix', filters.pump_prefix);
    }

    const { data: allReportsData, error: volumeError } = await volumeQuery;
    
    if (volumeError) {
      console.error('Erro ao buscar volume total:', volumeError);
    }
    
    const totalVolume = (allReportsData || []).reduce((sum, report) => sum + (report.realized_volume || 0), 0);
    console.log('💧 [getFaturamentoBrutoStats] Volume total calculado:', totalVolume);
    
    // Faturamento de hoje
    const faturadoHoje = data
      .filter(report => report.date === today)
      .reduce((sum, report) => sum + (report.total_value || 0), 0);
    
    const relatoriosHoje = data.filter(report => report.date === today).length;

    // Calcular faturamento por bomba
    const faturamentoPorBomba = data.reduce((acc, report) => {
      const pumpPrefix = report.pump_prefix || 'N/A';
      
      if (!acc[pumpPrefix]) {
        acc[pumpPrefix] = {
          bomba_prefix: pumpPrefix,
          total_faturado: 0,
          total_relatorios: 0,
          faturado_hoje: 0,
          relatorios_hoje: 0,
          volume_total: 0
        };
      }
      
      acc[pumpPrefix].total_faturado += report.total_value || 0;
      acc[pumpPrefix].total_relatorios += 1;
      acc[pumpPrefix].volume_total += report.realized_volume || 0;
      
      // Faturamento de hoje por bomba
      if (report.date === today) {
        acc[pumpPrefix].faturado_hoje += report.total_value || 0;
        acc[pumpPrefix].relatorios_hoje += 1;
      }
      
      return acc;
    }, {} as Record<string, any>);

    const faturamentoPorBombaArray = Object.values(faturamentoPorBomba)
      .sort((a: any, b: any) => b.total_faturado - a.total_faturado);
    
    console.log('💰 [getFaturamentoBrutoStats] Cálculos:', {
      totalFaturado: `${totalFaturado} (apenas PAGOS)`,
      totalVolume: `${totalVolume} (TODOS os relatórios)`,
      faturadoHoje: `${faturadoHoje} (apenas PAGOS hoje)`,
      relatoriosHoje: `${relatoriosHoje} (apenas PAGOS hoje)`,
      bombas: faturamentoPorBombaArray.length,
      today
    });

    return {
      total_relatorios_pagos: data.length,
      total_faturado: totalFaturado,
      faturado_hoje: faturadoHoje,
      relatorios_hoje: relatoriosHoje,
      volume_total_bombeado: totalVolume,
      faturamento_por_bomba: faturamentoPorBombaArray
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de faturamento:', error);
    return {
      total_relatorios_pagos: 0,
      total_faturado: 0,
      faturado_hoje: 0,
      relatorios_hoje: 0,
      volume_total_bombeado: 0,
      faturamento_por_bomba: []
    };
  }
}

/**
 * Busca dados de faturamento bruto
 */
export async function getFaturamentoBruto(limit: number = 50) {
  const { data, error } = await supabase
    .from('view_faturamento_bruto')
    .select('*')
    .limit(limit);

  if (error) {
    console.error('Erro ao buscar faturamento bruto:', error);
    throw new Error('Erro ao buscar faturamento bruto');
  }

  return data || [];
}

/**
 * Busca faturamento detalhado por bomba com filtros opcionais
 */
export async function getFaturamentoDetalhadoPorBomba(filters?: {
  pump_prefix?: string;
  data_inicio?: string;
  data_fim?: string;
  limit?: number;
}) {
  try {
    console.log('🔍 [getFaturamentoDetalhadoPorBomba] Buscando faturamento detalhado por bomba...');
    
    let query = supabase
      .from('reports')
      .select(`
        id,
        report_number,
        total_value,
        date,
        pump_prefix,
        status,
        realized_volume,
        client_id,
        pumps: pump_id (
          prefix,
          model,
          brand
        ),
        clients: client_id (
          name,
          companies: company_id (
            name
          )
        )
      `)
      .eq('status', 'PAGO')
      .not('total_value', 'is', null)
      .order('date', { ascending: false });

    // Aplicar filtros
    if (filters?.pump_prefix) {
      query = query.eq('pump_prefix', filters.pump_prefix);
    }

    if (filters?.data_inicio) {
      query = query.gte('date', filters.data_inicio);
    }

    if (filters?.data_fim) {
      query = query.lte('date', filters.data_fim);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar faturamento detalhado:', error);
      throw new Error('Erro ao buscar faturamento detalhado');
    }

    console.log('✅ [getFaturamentoDetalhadoPorBomba] Dados encontrados:', data?.length || 0);

    return (data || []).map(report => ({
      id: report.id,
      report_number: report.report_number,
      total_value: report.total_value,
      date: report.date,
      pump_prefix: report.pump_prefix,
      realized_volume: report.realized_volume,
      client_name: (report.clients as any)?.name || 'N/A',
      company_name: (report.clients as any)?.companies?.name || 'N/A',
      bomba_model: (report.pumps as any)?.model,
      bomba_brand: (report.pumps as any)?.brand,
      status: report.status
    }));
  } catch (error) {
    console.error('Erro ao buscar faturamento detalhado por bomba:', error);
    throw error;
  }
}

/**
 * Busca faturamento por período
 */
export async function getFaturamentoPorPeriodo() {
  const { data, error } = await supabase
    .from('view_faturamento_por_periodo')
    .select('*');

  if (error) {
    console.error('Erro ao buscar faturamento por período:', error);
    throw new Error('Erro ao buscar faturamento por período');
  }

  return data || [];
}

/**
 * Busca faturamento por empresa
 */
export async function getFaturamentoPorEmpresa() {
  const { data, error } = await supabase
    .from('view_faturamento_por_empresa')
    .select('*');

  if (error) {
    console.error('Erro ao buscar faturamento por empresa:', error);
    throw new Error('Erro ao buscar faturamento por empresa');
  }

  return data || [];
}

/**
 * Busca faturamento por bomba
 */
export async function getFaturamentoPorBomba() {
  const { data, error } = await supabase
    .from('view_faturamento_por_bomba')
    .select('*');

  if (error) {
    console.error('Erro ao buscar faturamento por bomba:', error);
    throw new Error('Erro ao buscar faturamento por bomba');
  }

  return data || [];
}

// ============================================================================
// FUNÇÕES DE PAGAMENTOS A RECEBER
// ============================================================================

/**
 * Busca estatísticas de pagamentos a receber
 * NOVO: Aceita filtro de pump_prefix para filtrar por bomba específica
 */
export async function getPagamentosReceberStats(filters?: { pump_prefix?: string }) {
  try {
    console.log('🔍 [getPagamentosReceberStats] Buscando estatísticas de pagamentos a receber...', filters);
    
    let query = supabase
      .from('pagamentos_receber')
      .select('status, valor_total, prazo_data, pump_prefix');

    // Aplicar filtro de bomba se fornecido
    if (filters?.pump_prefix) {
      console.log('🚛 [getPagamentosReceberStats] Filtrando por bomba:', filters.pump_prefix);
      query = query.eq('pump_prefix', filters.pump_prefix);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar estatísticas de pagamentos a receber:', error);
      throw new Error('Erro ao buscar estatísticas de pagamentos a receber');
    }

    console.log('📊 [getPagamentosReceberStats] Dados encontrados:', data?.length || 0);
    
    if (!data || data.length === 0) {
      console.log('⚠️ [getPagamentosReceberStats] Nenhum pagamento a receber encontrado');
      return {
        total_pagamentos: 0,
        total_valor: 0,
        aguardando: 0,
        proximo_vencimento: 0,
        vencido: 0,
        pago: 0,
        valor_aguardando: 0,
        valor_proximo_vencimento: 0,
        valor_vencido: 0,
        valor_pago: 0
      };
    }

    // Calcular estatísticas
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const stats = {
      total_pagamentos: data.length,
      total_valor: 0,
      aguardando: 0,
      proximo_vencimento: 0,
      vencido: 0,
      pago: 0,
      valor_aguardando: 0,
      valor_proximo_vencimento: 0,
      valor_vencido: 0,
      valor_pago: 0
    };

    data.forEach(pagamento => {
      const valor = pagamento.valor_total || 0;
      const prazoData = new Date(pagamento.prazo_data);
      
      stats.total_valor += valor;

      switch (pagamento.status) {
        case 'aguardando':
          stats.aguardando++;
          stats.valor_aguardando += valor;
          break;
        case 'proximo_vencimento':
          stats.proximo_vencimento++;
          stats.valor_proximo_vencimento += valor;
          break;
        case 'vencido':
          stats.vencido++;
          stats.valor_vencido += valor;
          break;
        case 'pago':
          stats.pago++;
          stats.valor_pago += valor;
          break;
        default:
          // Verificar se está próximo do vencimento (próximos 7 dias)
          if (prazoData <= nextWeek && prazoData >= today) {
            stats.proximo_vencimento++;
            stats.valor_proximo_vencimento += valor;
          }
          // Verificar se está vencido
          else if (prazoData < today) {
            stats.vencido++;
            stats.valor_vencido += valor;
          }
          // Caso contrário, está aguardando
          else {
            stats.aguardando++;
            stats.valor_aguardando += valor;
          }
          break;
      }
    });

    console.log('💰 [getPagamentosReceberStats] Cálculos:', stats);

    return stats;
  } catch (error) {
    console.error('Erro ao buscar estatísticas de pagamentos a receber:', error);
    return {
      total_pagamentos: 0,
      total_valor: 0,
      aguardando: 0,
      proximo_vencimento: 0,
      vencido: 0,
      pago: 0,
      valor_aguardando: 0,
      valor_proximo_vencimento: 0,
      valor_vencido: 0,
      valor_pago: 0
    };
  }
}

/**
 * Busca pagamentos próximos do vencimento
 */
export async function getPagamentosProximosVencimento() {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const { data, error } = await supabase
      .from('view_pagamentos_receber_completo')
      .select('*')
      .lte('prazo_data', nextWeek.toISOString().split('T')[0])
      .gte('prazo_data', today.toISOString().split('T')[0])
      .neq('status', 'PAGO')
      .order('prazo_data', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Erro ao buscar pagamentos próximos do vencimento:', error);
      throw new Error('Erro ao buscar pagamentos próximos do vencimento');
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pagamentos próximos do vencimento:', error);
    return [];
  }
}

// ============================================================================
// FUNÇÕES DE CUSTOS DE COLABORADORES
// ============================================================================

/**
 * Busca custos totais dos colaboradores (salários + horas extras)
 */
export async function getColaboradoresCosts() {
  try {
    console.log('🔍 [getColaboradoresCosts] Buscando custos de colaboradores...');
    
    // Buscar todos os colaboradores com seus salários
    const { data: colaboradoresData, error: colaboradoresError } = await supabase
      .from('colaboradores')
      .select('salario_fixo, valor_pagamento_1, valor_pagamento_2, tipo_contrato');

    if (colaboradoresError) {
      console.error('Erro ao buscar colaboradores:', colaboradoresError);
      throw new Error('Erro ao buscar colaboradores');
    }

    // Buscar horas extras do mês atual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
    
    const { data: horasExtrasData, error: horasExtrasError } = await supabase
      .from('colaboradores_horas_extras')
      .select('valor_calculado')
      .gte('data', startOfMonthStr);

    if (horasExtrasError) {
      console.error('Erro ao buscar horas extras:', horasExtrasError);
    }

    console.log('📊 [getColaboradoresCosts] Dados encontrados:', {
      colaboradores: colaboradoresData?.length || 0,
      horasExtras: horasExtrasData?.length || 0
    });

    // Calcular custo total de salários
    const custoSalarios = (colaboradoresData || []).reduce((total, colaborador) => {
      // Para contratos fixos, usar salario_fixo
      if (colaborador.tipo_contrato === 'fixo') {
        return total + (colaborador.salario_fixo || 0);
      }
      
      // Para diaristas, somar os valores de pagamento se existirem
      const valor1 = colaborador.valor_pagamento_1 || 0;
      const valor2 = colaborador.valor_pagamento_2 || 0;
      return total + valor1 + valor2;
    }, 0);

    // Calcular custo total de horas extras
    const custoHorasExtras = (horasExtrasData || []).reduce((total, horaExtra) => {
      return total + (horaExtra.valor_calculado || 0);
    }, 0);

    const custoTotal = custoSalarios + custoHorasExtras;

    console.log('💰 [getColaboradoresCosts] Cálculos:', {
      custoSalarios,
      custoHorasExtras,
      custoTotal,
      startOfMonthStr
    });

    return {
      custo_salarios: custoSalarios,
      custo_horas_extras: custoHorasExtras,
      custo_total: custoTotal
    };
  } catch (error) {
    console.error('Erro ao buscar custos de colaboradores:', error);
    return {
      custo_salarios: 0,
      custo_horas_extras: 0,
      custo_total: 0
    };
  }
}

