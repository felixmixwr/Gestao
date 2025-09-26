import { ReportStatus } from '../types/reports'

// Mapeamento dos status financeiros com labels e cores
export const statusMap = {
  ENVIADO_FINANCEIRO: { 
    label: "Enviado ao Financeiro", 
    color: "red",
    variant: "danger" as const
  },
  RECEBIDO_FINANCEIRO: { 
    label: "Recebido pelo Financeiro", 
    color: "indigo",
    variant: "info" as const
  },
  AGUARDANDO_APROVACAO: { 
    label: "Aguardando Aprovação", 
    color: "orange",
    variant: "warning" as const
  },
  NOTA_EMITIDA: { 
    label: "Nota Emitida", 
    color: "blue",
    variant: "info" as const
  },
  AGUARDANDO_PAGAMENTO: { 
    label: "Aguardando Pagamento", 
    color: "yellow",
    variant: "warning" as const
  },
  PAGO: { 
    label: "Pago", 
    color: "green",
    variant: "success" as const
  },
} as const

// Função para obter informações do status
export const getStatusInfo = (status: ReportStatus) => {
  return statusMap[status] || { 
    label: status, 
    color: "gray",
    variant: "info" as const
  }
}

// Função para obter label legível do status
export const getStatusLabel = (status: ReportStatus): string => {
  return getStatusInfo(status).label
}

// Função para obter cor do status
export const getStatusColor = (status: ReportStatus): string => {
  return getStatusInfo(status).color
}

// Função para obter variant do Badge
export const getStatusVariant = (status: ReportStatus): 'danger' | 'warning' | 'success' | 'info' => {
  return getStatusInfo(status).variant
}

// Regras de negócio: quais status são permitidos a partir do status atual
export const getNextAllowedStatuses = (currentStatus: ReportStatus): ReportStatus[] => {
  const statusFlow: Record<ReportStatus, ReportStatus[]> = {
    ENVIADO_FINANCEIRO: ['RECEBIDO_FINANCEIRO'],
    RECEBIDO_FINANCEIRO: ['AGUARDANDO_APROVACAO'],
    AGUARDANDO_APROVACAO: ['NOTA_EMITIDA'],
    NOTA_EMITIDA: ['AGUARDANDO_PAGAMENTO'],
    AGUARDANDO_PAGAMENTO: ['PAGO'],
    PAGO: [] // Status final, não pode avançar mais
  }
  
  return statusFlow[currentStatus] || []
}

// Função para verificar se uma transição de status é válida
export const isStatusTransitionValid = (fromStatus: ReportStatus, toStatus: ReportStatus): boolean => {
  return getNextAllowedStatuses(fromStatus).includes(toStatus)
}

// Opções de status para dropdowns - MOSTRA TODOS OS STATUS
export const getStatusOptions = (currentStatus?: ReportStatus) => {
  const allStatuses = Object.keys(statusMap) as ReportStatus[]
  
  return allStatuses.map(status => ({
    value: status,
    label: getStatusLabel(status),
    disabled: status === currentStatus // Desabilita o status atual
  }))
}

// Função para obter o status padrão (quando um relatório é criado)
export const getDefaultStatus = (): ReportStatus => 'ENVIADO_FINANCEIRO'

// Função para obter todas as opções de status para filtros
export const getAllStatusOptions = () => {
  return [
    { value: '', label: 'Todos os status' },
    ...Object.keys(statusMap).map(status => ({
      value: status,
      label: getStatusLabel(status as ReportStatus)
    }))
  ]
}
