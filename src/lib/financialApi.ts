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
 */
export async function getVolumeDiarioComBombas() {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('🔍 [getVolumeDiarioComBombas] Buscando dados para:', today);
    
    const { data, error } = await supabase
      .from('reports')
      .select('pump_prefix, realized_volume, total_value, date, status')
      .eq('date', today);
      // REMOVIDO: .eq('status', 'PAGO') - Agora busca TODOS os relatórios

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
 */
export async function getVolumeSemanalComBombas() {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('reports')
      .select('pump_prefix, realized_volume, total_value, date, status')
      .gte('date', startOfWeekStr);
      // REMOVIDO: .eq('status', 'PAGO') - Agora busca TODOS os relatórios

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
 */
export async function getVolumeMensalComBombas() {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('reports')
      .select('pump_prefix, realized_volume, total_value, date, status')
      .gte('date', startOfMonthStr);
      // REMOVIDO: .eq('status', 'PAGO') - Agora busca TODOS os relatórios

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
 * Cria uma nova despesa
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

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      ...expenseData,
      valor: -Math.abs(expenseData.valor), // Garantir que seja negativo (saída de dinheiro)
      company_id: finalCompanyId, // Usar company_id da bomba se disponível
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar despesa:', error);
    throw new Error('Erro ao criar despesa');
  }

  return data;
}

/**
 * Atualiza uma despesa existente
 */
export async function updateExpense(expenseData: UpdateExpenseData): Promise<Expense> {
  const { id, ...updateData } = expenseData;

  // Se o valor está sendo atualizado, garantir que seja negativo
  if (updateData.valor !== undefined) {
    updateData.valor = -Math.abs(updateData.valor);
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
    console.error('Erro ao atualizar despesa:', error);
    throw new Error('Erro ao atualizar despesa');
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

  // Calcular total de despesas
  const total_despesas = expenses.reduce((sum, expense) => sum + expense.valor, 0);

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
 * Busca faturamento bruto por empresa (baseado na empresa proprietária da bomba)
 */
export async function getFaturamentoBrutoPorEmpresa() {
  try {
    // Primeiro, buscar todos os relatórios pagos
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('total_value, pump_id')
      .eq('status', 'PAGO');

    if (reportsError) throw reportsError;

    if (!reports || reports.length === 0) {
      return [];
    }

    // Buscar todas as bombas únicas
    const pumpIds = [...new Set(reports.map(r => r.pump_id))];
    const { data: pumps, error: pumpsError } = await supabase
      .from('pumps')
      .select('id, owner_company_id, companies:owner_company_id(name)')
      .in('id', pumpIds);

    if (pumpsError) throw pumpsError;

    // Criar mapa de pump_id para empresa
    const pumpToCompany = new Map();
    pumps?.forEach((pump: any) => {
      pumpToCompany.set(pump.id, {
        company_id: pump.owner_company_id,
        company_name: pump.companies?.name || 'Empresa não identificada'
      });
    });

    // Agrupar por empresa proprietária da bomba
    const faturamentoPorEmpresa = reports.reduce((acc: any, report: any) => {
      const companyInfo = pumpToCompany.get(report.pump_id);
      
      if (!companyInfo) {
        console.warn('Relatório sem empresa proprietária da bomba:', report);
        return acc;
      }
      
      const { company_id, company_name } = companyInfo;
      
      if (!acc[company_id]) {
        acc[company_id] = {
          company_id: company_id,
          company_name: company_name,
          faturamento_bruto: 0,
          total_relatorios: 0
        };
      }
      
      acc[company_id].faturamento_bruto += report.total_value || 0;
      acc[company_id].total_relatorios += 1;
      
      return acc;
    }, {});

    return Object.values(faturamentoPorEmpresa);
  } catch (error) {
    console.error('Erro ao buscar faturamento por empresa:', error);
    throw error;
  }
}

/**
 * Busca despesas por empresa
 */
export async function getDespesasPorEmpresa() {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        valor,
        company_id,
        companies:company_id(name)
      `);

    if (error) throw error;

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

    return Object.values(despesasPorEmpresa);
  } catch (error) {
    console.error('Erro ao buscar despesas por empresa:', error);
    throw error;
  }
}

/**
 * Busca dados financeiros completos por empresa
 */
export async function getDadosFinanceirosPorEmpresa() {
  try {
    const [faturamentoData, despesasData] = await Promise.all([
      getFaturamentoBrutoPorEmpresa(),
      getDespesasPorEmpresa()
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
 */
export async function getFaturamentoBrutoStats() {
  try {
    console.log('🔍 [getFaturamentoBrutoStats] Buscando estatísticas de faturamento...');
    
    // Buscar dados diretamente da tabela reports - APENAS relatórios PAGOS para faturamento bruto
    const { data, error } = await supabase
      .from('reports')
      .select('total_value, realized_volume, date, status')
      .eq('status', 'PAGO'); // RESTAURADO: Apenas relatórios PAGOS para faturamento bruto

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
        volume_total_bombeado: 0
      };
    }

    // Calcular estatísticas
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const totalFaturado = data.reduce((sum, report) => sum + (report.total_value || 0), 0);
    
    // CORRIGIDO: Volume total deve incluir TODOS os relatórios, não apenas PAGOS
    // Buscar volume total de todos os relatórios separadamente
    const { data: allReportsData, error: volumeError } = await supabase
      .from('reports')
      .select('realized_volume')
      .not('realized_volume', 'is', null);
    
    if (volumeError) {
      console.error('Erro ao buscar volume total:', volumeError);
    }
    
    const totalVolume = (allReportsData || []).reduce((sum, report) => sum + (report.realized_volume || 0), 0);
    
    // Faturamento de hoje
    const faturadoHoje = data
      .filter(report => report.date === today)
      .reduce((sum, report) => sum + (report.total_value || 0), 0);
    
    const relatoriosHoje = data.filter(report => report.date === today).length;
    
    console.log('💰 [getFaturamentoBrutoStats] Cálculos:', {
      totalFaturado: `${totalFaturado} (apenas PAGOS)`,
      totalVolume: `${totalVolume} (TODOS os relatórios)`,
      faturadoHoje: `${faturadoHoje} (apenas PAGOS hoje)`,
      relatoriosHoje: `${relatoriosHoje} (apenas PAGOS hoje)`,
      today
    });

    return {
      total_relatorios_pagos: data.length,
      total_faturado: totalFaturado,
      faturado_hoje: faturadoHoje,
      relatorios_hoje: relatoriosHoje,
      volume_total_bombeado: totalVolume
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de faturamento:', error);
    return {
      total_relatorios_pagos: 0,
      total_faturado: 0,
      faturado_hoje: 0,
      relatorios_hoje: 0,
      volume_total_bombeado: 0
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
 */
export async function getPagamentosReceberStats() {
  try {
    console.log('🔍 [getPagamentosReceberStats] Buscando estatísticas de pagamentos a receber...');
    
    const { data, error } = await supabase
      .from('pagamentos_receber')
      .select('status, valor_total, prazo_data');

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
      .neq('status', 'pago')
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

