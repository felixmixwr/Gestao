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
// FUNÇÕES DE DESPESAS
// ============================================================================

/**
 * Busca todas as despesas com filtros opcionais
 */
export async function getExpenses(filters?: ExpenseFilters): Promise<ExpenseWithRelations[]> {
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
    query = query.eq('company_id', filters.company_id);
  }

  if (filters?.pump_id) {
    query = query.eq('pump_id', filters.pump_id);
  }

  if (filters?.categoria && filters.categoria.length > 0) {
    query = query.in('categoria', filters.categoria);
  }

  if (filters?.tipo_custo && filters.tipo_custo.length > 0) {
    query = query.in('tipo_custo', filters.tipo_custo);
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters?.data_inicio) {
    query = query.gte('data_despesa', filters.data_inicio);
  }

  if (filters?.data_fim) {
    query = query.lte('data_despesa', filters.data_fim);
  }

  if (filters?.search) {
    query = query.ilike('descricao', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar despesas:', error);
    throw new Error('Erro ao buscar despesas');
  }

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
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      ...expenseData,
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
        bomba_prefix: expense.pumps?.prefix || 'N/A',
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
        company_name: expense.companies?.name || 'N/A',
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
    empresa_nome: invoice.reports?.clients?.companies?.name,
    bomba_prefix: invoice.reports?.pumps?.prefix
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
