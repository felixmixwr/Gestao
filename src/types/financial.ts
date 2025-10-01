// Tipos para o módulo financeiro

export type ExpenseCategory = 'Mão de obra' | 'Diesel' | 'Manutenção' | 'Imposto' | 'Outros';
export type ExpenseType = 'fixo' | 'variável';
export type ExpenseStatus = 'pendente' | 'pago' | 'cancelado';

// Interface principal da despesa
export interface Expense {
  id: string;
  descricao: string;
  categoria: ExpenseCategory;
  valor: number;
  tipo_custo: ExpenseType;
  data_despesa: string; // YYYY-MM-DD format
  pump_id: string;
  company_id: string;
  status: ExpenseStatus;
  quilometragem_atual?: number; // Para despesas de diesel
  quantidade_litros?: number; // Para despesas de diesel
  custo_por_litro?: number; // Para despesas de diesel
  nota_fiscal_id?: string; // Link para nota fiscal se aplicável
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

// Interface para despesa com dados relacionados
export interface ExpenseWithRelations extends Expense {
  bomba_prefix?: string;
  bomba_model?: string;
  bomba_brand?: string;
  company_name?: string;
  nota_fiscal_numero?: string;
}

// Interface para criar despesa
export interface CreateExpenseData {
  descricao: string;
  categoria: ExpenseCategory;
  valor: number;
  tipo_custo: ExpenseType;
  data_despesa: string;
  pump_id: string;
  company_id: string;
  status?: ExpenseStatus;
  quilometragem_atual?: number;
  quantidade_litros?: number;
  custo_por_litro?: number;
  nota_fiscal_id?: string;
  observacoes?: string;
}

// Interface para atualizar despesa
export interface UpdateExpenseData extends Partial<CreateExpenseData> {
  id: string;
}

// Interface para filtros de despesas
export interface ExpenseFilters {
  company_id?: string;
  pump_id?: string;
  categoria?: ExpenseCategory[];
  tipo_custo?: ExpenseType[];
  status?: ExpenseStatus[];
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}

// Interface para estatísticas financeiras
export interface FinancialStats {
  total_despesas: number;
  total_por_categoria: Record<ExpenseCategory, number>;
  total_por_bomba: Array<{
    pump_id: string;
    bomba_prefix: string;
    total: number;
  }>;
  total_por_empresa: Array<{
    company_id: string;
    company_name: string;
    total: number;
  }>;
  despesas_por_periodo: Array<{
    periodo: string;
    total: number;
  }>;
  despesas_por_tipo: Record<ExpenseType, number>;
}

// Interface para dados de gráficos
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

// Interface para relatório financeiro
export interface FinancialReport {
  periodo: {
    inicio: string;
    fim: string;
  };
  resumo: FinancialStats;
  despesas: ExpenseWithRelations[];
  graficos: {
    pizza_categoria: ChartData;
    barra_bomba: ChartData;
    linha_tempo: ChartData;
  };
}

// Interface para dados de combustível específicos
export interface FuelExpenseData {
  quilometragem_atual: number;
  quantidade_litros: number;
  custo_por_litro: number;
  valor_total: number; // Calculado automaticamente
}

// Interface para integração com notas fiscais
export interface InvoiceIntegration {
  nota_fiscal_id: string;
  numero_nota: string;
  valor: number;
  data_emissao: string;
  data_vencimento: string;
  status: 'Faturada' | 'Paga' | 'Cancelada';
  empresa_nome?: string;
  bomba_prefix?: string;
}

// Constantes para as opções de select
export const EXPENSE_CATEGORY_OPTIONS: { value: ExpenseCategory; label: string; color: string }[] = [
  { value: 'Mão de obra', label: 'Mão de obra', color: 'bg-green-100 text-green-800' },
  { value: 'Diesel', label: 'Diesel', color: 'bg-blue-100 text-blue-800' },
  { value: 'Manutenção', label: 'Manutenção', color: 'bg-orange-100 text-orange-800' },
  { value: 'Imposto', label: 'Imposto', color: 'bg-red-100 text-red-800' },
  { value: 'Outros', label: 'Outros', color: 'bg-gray-100 text-gray-800' }
];

export const EXPENSE_TYPE_OPTIONS: { value: ExpenseType; label: string }[] = [
  { value: 'fixo', label: 'Fixo' },
  { value: 'variável', label: 'Variável' }
];

export const EXPENSE_STATUS_OPTIONS: { value: ExpenseStatus; label: string; color: string }[] = [
  { value: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'pago', label: 'Pago', color: 'bg-green-100 text-green-800' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
];

// Funções utilitárias
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(date: string): string {
  // Se a data está no formato YYYY-MM-DD, criar diretamente para evitar problemas de fuso horário
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day) // Mês é 0-indexado
    return dateObj.toLocaleDateString('pt-BR')
  }
  
  // Para outros formatos, usar a conversão normal
  return new Date(date).toLocaleDateString('pt-BR')
}

export function getCategoryColor(categoria: ExpenseCategory): string {
  const category = EXPENSE_CATEGORY_OPTIONS.find(c => c.value === categoria);
  return category?.color || 'bg-gray-100 text-gray-800';
}

export function getStatusColor(status: ExpenseStatus): string {
  const statusOption = EXPENSE_STATUS_OPTIONS.find(s => s.value === status);
  return statusOption?.color || 'bg-gray-100 text-gray-800';
}

export function calculateFuelTotal(quantidade_litros: number, custo_por_litro: number): number {
  return quantidade_litros * custo_por_litro;
}

export function getExpenseIcon(categoria: ExpenseCategory): string {
  const icons: Record<ExpenseCategory, string> = {
    'Mão de obra': '👷',
    'Diesel': '⛽',
    'Manutenção': '🔧',
    'Imposto': '📋',
    'Outros': '📦'
  };
  return icons[categoria] || '📦';
}

// Validação de formulário com Zod
export const expenseFormSchema = {
  descricao: { required: true, minLength: 3, maxLength: 255 },
  categoria: { required: true },
  valor: { required: true, min: 0.01 },
  tipo_custo: { required: true },
  data_despesa: { required: true },
  pump_id: { required: true },
  company_id: { required: true },
  quilometragem_atual: { min: 0 },
  quantidade_litros: { min: 0 },
  custo_por_litro: { min: 0 }
};

// Interface para paginação
export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedExpenses {
  data: ExpenseWithRelations[];
  pagination: PaginationParams;
}

// Interface para exportação
export interface ExportOptions {
  format: 'excel' | 'pdf';
  filters?: ExpenseFilters;
  includeCharts?: boolean;
  dateRange?: {
    inicio: string;
    fim: string;
  };
}

// Interface para notificações financeiras
export interface FinancialNotification {
  id: string;
  type: 'expense_created' | 'expense_updated' | 'budget_alert' | 'payment_due';
  title: string;
  message: string;
  expense_id?: string;
  created_at: string;
  read: boolean;
}

// Interface para alertas de orçamento
export interface BudgetAlert {
  categoria: ExpenseCategory;
  limite_mensal: number;
  gasto_atual: number;
  percentual_utilizado: number;
  status: 'ok' | 'alerta' | 'limite_excedido';
}
