// Status das bombas
export const PUMP_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance'
} as const

export const PUMP_STATUS_LABELS = {
  [PUMP_STATUS.ACTIVE]: 'Ativa',
  [PUMP_STATUS.INACTIVE]: 'Inativa',
  [PUMP_STATUS.MAINTENANCE]: 'Manutenção'
} as const

// Cores para os status das bombas
export const PUMP_STATUS_COLORS = {
  [PUMP_STATUS.ACTIVE]: 'green',
  [PUMP_STATUS.INACTIVE]: 'gray',
  [PUMP_STATUS.MAINTENANCE]: 'yellow'
} as const

// Configurações da aplicação
export const APP_CONFIG = {
  COMPANY_NAME: import.meta.env.VITE_OWNER_COMPANY_NAME || 'Felix Mix',
  SECONDARY_COMPANY_NAME: import.meta.env.VITE_SECOND_COMPANY_NAME || 'WorldRental',
  ITEMS_PER_PAGE: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
} as const

// Rotas da aplicação
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CLIENTS: '/clients',
  CLIENT_NEW: '/clients/new',
  CLIENT_DETAIL: '/clients/:id',
  PUMPS: '/pumps',
  PUMP_NEW: '/pumps/new',
  PUMP_DETAIL: '/pumps/:id',
  REPORTS: '/reports',
  REPORT_NEW: '/reports/new',
  REPORT_DETAIL: '/reports/:id',
  NOTES: '/notes'
} as const

// Mensagens de erro comuns
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet e tente novamente.',
  UNAUTHORIZED: 'Você não tem permissão para realizar esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION_ERROR: 'Dados inválidos. Verifique os campos e tente novamente.',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente mais tarde.',
  UNKNOWN_ERROR: 'Erro desconhecido. Tente novamente.'
} as const

// Mensagens de sucesso
export const SUCCESS_MESSAGES = {
  CREATED: 'Registro criado com sucesso!',
  UPDATED: 'Registro atualizado com sucesso!',
  DELETED: 'Registro excluído com sucesso!',
  SAVED: 'Dados salvos com sucesso!'
} as const








