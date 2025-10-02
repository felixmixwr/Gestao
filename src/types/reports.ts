export type ReportStatus = 'ENVIADO_FINANCEIRO' | 'RECEBIDO_FINANCEIRO' | 'AGUARDANDO_APROVACAO' | 'NOTA_EMITIDA' | 'AGUARDANDO_PAGAMENTO' | 'PAGO'

export interface Report {
  id: string
  report_number: string
  date: string
  client_id: string | null
  client_rep_name: string | null
  work_address: string | null
  pump_prefix: string | null
  realized_volume: number | null
  total_value: number | null
  status: ReportStatus
  whatsapp_digits: string | null
  company_id: string
  created_at: string | null
  updated_at: string | null
  pump_id: string | null
  driver_name: string | null
  assistant1_name: string | null
  assistant2_name: string | null
  service_company_id: string | null
  paid_at: string | null
}

export interface ReportWithRelations extends Report {
  planned_volume?: number | null
  observations?: string | null
  clients?: {
    id: string
    name: string
    email: string | null
    phone: string | null
    company_name: string | null
  }
  pumps?: {
    id: string
    prefix: string
    model: string | null
    brand: string | null
    is_terceira?: boolean
    empresa_nome?: string
  }
  companies?: {
    id: string
    name: string
  }
}

export interface CreateReportData {
  date: string
  client_id: string
  client_rep_name: string
  client_phone?: string
  work_address: string
  pump_id: string
  pump_prefix: string
  pump_owner_company_id: string
  planned_volume?: number
  realized_volume: number
  team?: string
  total_value: number
  observations?: string
}

export interface ReportFilters {
  status?: ReportStatus[]
  dateFrom?: string
  dateTo?: string
  pump_prefix?: string
  client_id?: string
  // Novos campos de busca
  searchTerm?: string
  searchType?: 'id' | 'date' | 'client' | 'pump' | 'volume' | 'value' | 'company'
  report_number?: string
  client_name?: string
  company_name?: string
  pump_name?: string
  volume_min?: number
  volume_max?: number
  value_min?: number
  value_max?: number
}

export interface NoteData {
  nf_number: string
  nf_date: string
  nf_value: number
  report_id: string
}
