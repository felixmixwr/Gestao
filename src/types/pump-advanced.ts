// Tipos e funções utilitárias para o módulo de bombas avançado

// Tipo para KPIs da bomba
export interface PumpKPIs {
  total_volume_pumped?: number
  total_diesel_consumed?: number
  total_revenue?: number
  total_costs?: number
  total_maintenance_cost?: number
  total_diesel_cost?: number
  total_investment_cost?: number
  next_maintenance_date?: string
  maintenance_status?: string
  efficiency_ratio?: number
}

// Tipo para estatísticas do dashboard de bombas
export interface PumpDashboardStats {
  total_pumps: number
  active_pumps: number
  pumps_in_maintenance: number
  total_volume_pumped: number
  total_diesel_consumed: number
  total_revenue: number
  total_costs: number
  efficiency_ratio: number
}

// Função para verificar se a manutenção está vencida
export const isMaintenanceDue = (nextMaintenanceDate?: string | null): boolean => {
  if (!nextMaintenanceDate) return false
  const maintenanceDate = new Date(nextMaintenanceDate)
  const today = new Date()
  return maintenanceDate <= today
}

// Função para obter status da manutenção
export const getMaintenanceStatus = (nextMaintenanceDate?: string | null): string => {
  if (!nextMaintenanceDate) return 'Sem data'
  if (isMaintenanceDue(nextMaintenanceDate)) return 'Vencida'
  
  const maintenanceDate = new Date(nextMaintenanceDate)
  const today = new Date()
  const diffTime = maintenanceDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 7) return 'Próxima'
  return 'Agendada'
}

// Função para obter cor do status da bomba
export const getPumpStatusColor = (status: string): string => {
  switch (status) {
    case 'Ativa': return 'text-green-600'
    case 'Em Manutenção': return 'text-yellow-600'
    case 'Inativa': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

// Função para obter ícone da bomba baseado no status
export const getPumpIcon = (status: string): string => {
  switch (status) {
    case 'Ativa': return '⚙️'
    case 'Em Manutenção': return '🔧'
    case 'Inativa': return '⏹️'
    default: return '⚙️'
  }
}

// Função para formatar volume
export const formatVolume = (volume?: number | null): string => {
  if (!volume) return '0 m³'
  return `${volume.toLocaleString('pt-BR')} m³`
}

// Função para formatar litros
export const formatLiters = (liters?: number | null): string => {
  if (!liters) return '0 L'
  return `${liters.toLocaleString('pt-BR')} L`
}

// Função para formatar moeda (re-export da utils/formatters)
export const formatCurrency = (value?: number | null): string => {
  if (!value) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Função para formatar data
export const formatDate = (date?: string | null): string => {
  if (!date) return 'Sem data'
  
  // Se for formato ISO (YYYY-MM-DD), usar conversão segura para evitar diferenças de fuso horário
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('pt-BR');
  }
  
  // Para outros formatos, usar conversão normal
  return new Date(date).toLocaleDateString('pt-BR')
}

// Função para obter cor do tipo de manutenção
export const getMaintenanceTypeColor = (type?: string): string => {
  switch (type) {
    case 'Preventiva': return 'bg-blue-100 text-blue-800'
    case 'Corretiva': return 'bg-red-100 text-red-800'
    case 'Preditiva': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Função para obter cor do status de manutenção
export const getMaintenanceStatusColor = (status?: string): string => {
  switch (status) {
    case 'Agendada': return 'bg-yellow-100 text-yellow-800'
    case 'Em Andamento': return 'bg-blue-100 text-blue-800'
    case 'Concluída': return 'bg-green-100 text-green-800'
    case 'Cancelada': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Função para obter cor da categoria de investimento
export const getInvestmentCategoryColor = (category?: string): string => {
  switch (category) {
    case 'Melhoria': return 'bg-green-100 text-green-800'
    case 'Expansão': return 'bg-blue-100 text-blue-800'
    case 'Manutenção': return 'bg-yellow-100 text-yellow-800'
    case 'Segurança': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Função para obter ícone de manutenção
export const getMaintenanceIcon = (type?: string): string => {
  switch (type) {
    case 'Preventiva': return '🔧'
    case 'Corretiva': return '⚠️'
    case 'Preditiva': return '📊'
    default: return '🔧'
  }
}

// Função para obter ícone de diesel
export const getDieselIcon = (): string => {
  return '⛽'
}

// Função para obter ícone de investimento
export const getInvestmentIcon = (category?: string): string => {
  switch (category) {
    case 'Melhoria': return '⬆️'
    case 'Expansão': return '📈'
    case 'Manutenção': return '🔧'
    case 'Segurança': return '🛡️'
    default: return '💰'
  }
}

// Tipos para dados de bombas
export interface PumpDetails {
  id: string
  prefix: string
  model?: string
  brand?: string
  status: string
  owner_company_id: string
  year?: number
  kpis?: PumpKPIs
  maintenances?: Maintenance[]
  diesel_entries?: DieselEntry[]
  investments?: Investment[]
  recent_maintenances?: Maintenance[]
  recent_diesel_entries?: DieselEntry[]
  recent_investments?: Investment[]
  recent_reports?: any[]
}

export interface Maintenance {
  id: string
  os_name: string
  type: string
  description: string
  date: string
  scheduled_date?: string
  status: string
  value: number
  cost?: number
  pump_id: string
  next_maintenance_date?: string
}

export interface DieselEntry {
  id: string
  liters_filled: number
  liters?: number
  cost_per_liter: number
  total_cost: number
  date: string
  current_mileage?: number
  pump_id: string
  payment_method?: string
  discount_type?: string
  discount_value?: number
  notes?: string
}

export interface Investment {
  id: string
  name: string
  description: string
  category: string
  value: number
  date: string
  pump_id: string
  supplier?: string
}