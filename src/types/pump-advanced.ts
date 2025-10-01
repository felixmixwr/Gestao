// Tipos avançados para o módulo de Bombas com KPIs, manutenção, diesel e investimentos

import { Database } from '../lib/supabase'

// Tipos base do banco de dados
export type Pump = Database['public']['Tables']['pumps']['Row'] & {
  company_name?: string
}

export type PumpStatus = 'Disponível' | 'Em Uso' | 'Em Manutenção'

// Tipos para manutenção
export type MaintenanceType = 'preventiva' | 'corretiva'

export interface Maintenance {
  id: string
  pump_id: string
  os_name: string // Nome da Ordem de Serviço
  type: MaintenanceType
  date: string // YYYY-MM-DD format
  value: number
  description?: string
  next_maintenance_date?: string // Para manutenções preventivas
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada'
  created_at: string
  updated_at: string
}

// Tipos para abastecimento de diesel
export interface DieselEntry {
  id: string
  pump_id: string
  date: string // YYYY-MM-DD format
  current_mileage?: number // Quilometragem atual (opcional)
  liters_filled: number // Quantidade de litros abastecidos
  cost_per_liter: number // Custo por litro
  total_cost: number // Valor total calculado automaticamente
  payment_method: 'cartao' | 'pix' // Forma de pagamento
  discount_type?: 'fixed' | 'percentage' // Tipo de desconto
  discount_value?: number // Valor do desconto (fixo ou percentual)
  fuel_station?: string // Posto de combustível
  notes?: string
  created_at: string
  updated_at: string
}

// Tipos para investimentos
export interface Investment {
  id: string
  pump_id: string
  name: string // Nome do investimento/OS
  date: string // YYYY-MM-DD format
  value: number
  category: 'equipamento' | 'melhoria' | 'upgrade' | 'outros'
  description?: string
  supplier?: string
  warranty_period?: number // Em meses
  created_at: string
  updated_at: string
}

// Tipos para KPIs da bomba
export interface PumpKPIs {
  pump_id: string
  total_volume_pumped: number // Total de m³ bombeados
  total_diesel_consumed: number // Total de litros de diesel consumidos
  total_maintenance_cost: number // Custo total de manutenções
  total_investment_cost: number // Custo total de investimentos
  total_diesel_cost: number // Custo total de diesel
  last_maintenance_date?: string
  next_maintenance_date?: string
  current_mileage?: number
  average_consumption_per_m3?: number // Consumo médio de diesel por m³
  maintenance_frequency_days?: number // Frequência de manutenções em dias
  last_updated: string
}

// Tipos para dados completos da bomba
export interface PumpDetails extends Pump {
  kpis: PumpKPIs
  maintenances: Maintenance[]
  diesel_entries: DieselEntry[]
  investments: Investment[]
  recent_reports?: Array<{
    id: string
    report_number: string
    client_name: string
    volume_pumped: number
    date: string
  }>
}

// Tipos para formulários
export interface CreateMaintenanceData {
  pump_id: string
  os_name: string
  type: MaintenanceType
  date: string
  value: number
  description?: string
  next_maintenance_date?: string
  status?: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada'
}

export interface CreateDieselEntryData {
  pump_id: string
  date: string
  current_mileage?: number // Quilometragem atual (opcional)
  liters_filled: number
  cost_per_liter: number
  payment_method: 'cartao' | 'pix' // Forma de pagamento (obrigatório)
  discount_type?: 'fixed' | 'percentage' // Tipo de desconto (opcional)
  discount_value?: number // Valor do desconto (opcional)
  fuel_station?: string
  notes?: string
}

export interface CreateInvestmentData {
  pump_id: string
  name: string
  date: string
  value: number
  category: 'equipamento' | 'melhoria' | 'upgrade' | 'outros'
  description?: string
  supplier?: string
  warranty_period?: number
}

// Tipos para atualização
export interface UpdateMaintenanceData extends Partial<CreateMaintenanceData> {
  id: string
}

export interface UpdateDieselEntryData extends Partial<CreateDieselEntryData> {
  id: string
}

export interface UpdateInvestmentData extends Partial<CreateInvestmentData> {
  id: string
}

// Tipos para filtros
export interface PumpFilters {
  status?: PumpStatus[]
  company_id?: string
  search?: string
  maintenance_due?: boolean // Bombas com manutenção próxima
  low_fuel?: boolean // Bombas com pouco combustível
}

// Tipos para estatísticas do dashboard
export interface PumpDashboardStats {
  total_pumps: number
  available_pumps: number
  in_service_pumps: number
  in_maintenance_pumps: number
  total_volume_pumped: number
  total_diesel_consumed: number
  total_maintenance_cost: number
  total_investment_cost: number
  maintenance_due_count: number
  average_consumption_per_m3: number
}

// Tipos para gráficos
export interface PumpChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }>
}

// Tipos para integração com financeiro
export interface FinancialIntegration {
  expense_id: string
  pump_id: string
  type: 'maintenance' | 'diesel' | 'investment'
  description: string
  value: number
  date: string
  reference_id: string // ID da manutenção, diesel ou investimento
}

// Tipos para integração com programação/calendário
export interface CalendarEvent {
  id: string
  pump_id: string
  title: string
  date: string
  type: 'maintenance' | 'diesel' | 'investment'
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada'
  color: 'red' | 'yellow' | 'green' | 'blue'
  reference_id: string
}

// Constantes para opções de select
export const MAINTENANCE_TYPE_OPTIONS: { value: MaintenanceType; label: string; color: string }[] = [
  { value: 'preventiva', label: 'Preventiva', color: 'bg-blue-100 text-blue-800' },
  { value: 'corretiva', label: 'Corretiva', color: 'bg-red-100 text-red-800' }
]

export const MAINTENANCE_STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'agendada', label: 'Agendada', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'em_andamento', label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  { value: 'concluida', label: 'Concluída', color: 'bg-green-100 text-green-800' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-100 text-red-800' }
]

export const INVESTMENT_CATEGORY_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'equipamento', label: 'Equipamento', color: 'bg-purple-100 text-purple-800' },
  { value: 'melhoria', label: 'Melhoria', color: 'bg-green-100 text-green-800' },
  { value: 'upgrade', label: 'Upgrade', color: 'bg-blue-100 text-blue-800' },
  { value: 'outros', label: 'Outros', color: 'bg-gray-100 text-gray-800' }
]

export const PUMP_STATUS_OPTIONS: { value: PumpStatus; label: string; color: string }[] = [
  { value: 'Disponível', label: 'Disponível', color: 'bg-green-100 text-green-800' },
  { value: 'Em Uso', label: 'Em Uso', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Em Manutenção', label: 'Em Manutenção', color: 'bg-red-100 text-red-800' }
]

// Funções utilitárias
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatVolume(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(value) + ' m³'
}

export function formatLiters(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(value) + ' L'
}

export function formatDate(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    return dateObj.toLocaleDateString('pt-BR')
  }
  return new Date(date).toLocaleDateString('pt-BR')
}

export function getMaintenanceTypeColor(type: MaintenanceType): string {
  const option = MAINTENANCE_TYPE_OPTIONS.find(t => t.value === type)
  return option?.color || 'bg-gray-100 text-gray-800'
}

export function getMaintenanceStatusColor(status: string): string {
  const option = MAINTENANCE_STATUS_OPTIONS.find(s => s.value === status)
  return option?.color || 'bg-gray-100 text-gray-800'
}

export function getInvestmentCategoryColor(category: string): string {
  const option = INVESTMENT_CATEGORY_OPTIONS.find(c => c.value === category)
  return option?.color || 'bg-gray-100 text-gray-800'
}

export function getPumpStatusColor(status: PumpStatus): string {
  const option = PUMP_STATUS_OPTIONS.find(s => s.value === status)
  return option?.color || 'bg-gray-100 text-gray-800'
}

// Função para calcular se a manutenção está próxima
export function isMaintenanceDue(date?: string, daysThreshold: number = 30): boolean {
  if (!date) return false
  
  const today = new Date()
  const maintenanceDate = new Date(date)
  const diffTime = maintenanceDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays <= daysThreshold && diffDays >= 0
}

// Função para obter status da manutenção
export function getMaintenanceStatus(date?: string): { status: string; color: string; days: number } {
  if (!date) {
    return { status: 'Não agendada', color: 'text-gray-500', days: 0 }
  }
  
  const today = new Date()
  const maintenanceDate = new Date(date)
  const diffTime = maintenanceDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return { status: 'Atrasada', color: 'text-red-600', days: Math.abs(diffDays) }
  }
  if (diffDays === 0) {
    return { status: 'Hoje', color: 'text-orange-600', days: 0 }
  }
  if (diffDays <= 7) {
    return { status: 'Esta semana', color: 'text-yellow-600', days: diffDays }
  }
  if (diffDays <= 30) {
    return { status: 'Este mês', color: 'text-blue-600', days: diffDays }
  }
  
  return { status: 'Futura', color: 'text-green-600', days: diffDays }
}

// Função para calcular consumo médio de diesel por m³
export function calculateAverageConsumption(dieselLiters: number, volumeM3: number): number {
  if (volumeM3 === 0) return 0
  return dieselLiters / volumeM3
}

// Função para obter ícone baseado no tipo
export function getMaintenanceIcon(type: MaintenanceType): string {
  return type === 'preventiva' ? '🛠️' : '🔧'
}

export function getDieselIcon(): string {
  return '⛽'
}

export function getInvestmentIcon(category: string): string {
  const icons: Record<string, string> = {
    'equipamento': '🔧',
    'melhoria': '⬆️',
    'upgrade': '🚀',
    'outros': '📦'
  }
  return icons[category] || '📦'
}

export function getPumpIcon(status: PumpStatus): string {
  const icons: Record<PumpStatus, string> = {
    'Disponível': '✅',
    'Em Uso': '🔄',
    'Em Manutenção': '🔧'
  }
  return icons[status] || '❓'
}

// Interface para notificações de bomba
export interface PumpNotification {
  id: string
  pump_id: string
  type: 'maintenance_due' | 'maintenance_overdue' | 'low_fuel' | 'investment_warranty_expiring'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  created_at: string
  read: boolean
}

// Interface para alertas
export interface PumpAlert {
  pump_id: string
  type: 'maintenance' | 'fuel' | 'investment'
  severity: 'info' | 'warning' | 'error'
  message: string
  action_required: boolean
  created_at: string
}
