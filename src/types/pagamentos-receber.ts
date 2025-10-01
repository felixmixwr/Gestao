// Tipos para o módulo de Pagamentos a Receber

export type FormaPagamento = 'sem_forma' | 'pix' | 'boleto' | 'a_vista'
export type StatusPagamento = 'aguardando' | 'proximo_vencimento' | 'vencido' | 'pago'
export type TipoEmpresa = 'interna' | 'terceira'

// Interface principal do pagamento a receber
export interface PagamentoReceber {
  id: string
  relatorio_id: string
  cliente_id: string
  empresa_id?: string
  empresa_tipo?: TipoEmpresa
  valor_total: number
  forma_pagamento: FormaPagamento
  prazo_data?: string
  prazo_dias?: number
  status: StatusPagamento
  observacoes?: string
  created_at: string
  updated_at: string
}

// Interface para pagamento com dados relacionados
export interface PagamentoReceberCompleto extends PagamentoReceber {
  // Dados do cliente
  cliente_nome: string
  cliente_email?: string
  cliente_telefone?: string
  
  // Dados do relatório
  relatorio_data: string
  relatorio_valor: number
  
  // Dados da empresa
  empresa_nome?: string
  empresa_cnpj?: string
}

// Interface para criar pagamento
export interface CreatePagamentoReceberData {
  relatorio_id: string
  cliente_id: string
  empresa_id?: string
  empresa_tipo?: TipoEmpresa
  valor_total: number
  forma_pagamento: FormaPagamento
  prazo_data?: string
  prazo_dias?: number
  observacoes?: string
}

// Interface para atualizar pagamento
export interface UpdatePagamentoReceberData extends Partial<CreatePagamentoReceberData> {
  id: string
  status?: StatusPagamento
}

// Interface para filtros de pagamentos
export interface PagamentoReceberFilters {
  status?: StatusPagamento[]
  forma_pagamento?: FormaPagamento[]
  cliente_id?: string
  empresa_id?: string
  empresa_tipo?: TipoEmpresa
  data_inicio?: string
  data_fim?: string
  valor_min?: number
  valor_max?: number
}

// Interface para estatísticas de pagamentos
export interface PagamentoReceberStats {
  total_pagamentos: number
  total_valor: number
  aguardando: number
  proximo_vencimento: number
  vencido: number
  pago: number
  valor_aguardando: number
  valor_proximo_vencimento: number
  valor_vencido: number
  valor_pago: number
}

// Interface para histórico de alterações
export interface HistoricoPagamento {
  id: string
  pagamento_id: string
  status_anterior?: StatusPagamento
  status_novo: StatusPagamento
  observacao?: string
  usuario_id?: string
  created_at: string
}

// Constantes para as opções de select
export const FORMA_PAGAMENTO_OPTIONS: { value: FormaPagamento; label: string }[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'a_vista', label: 'À Vista' }
]

export const STATUS_PAGAMENTO_OPTIONS: { value: StatusPagamento; label: string }[] = [
  { value: 'aguardando', label: 'Aguardando' },
  { value: 'proximo_vencimento', label: 'Próximo do Vencimento' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'pago', label: 'Pago' }
]

export const TIPO_EMPRESA_OPTIONS: { value: TipoEmpresa; label: string }[] = [
  { value: 'interna', label: 'Empresa Interna' },
  { value: 'terceira', label: 'Empresa Terceira' }
]

// Função para obter a cor do status
export function getCorStatusPagamento(status: StatusPagamento): string {
  switch (status) {
    case 'aguardando':
      return 'bg-gray-100 text-gray-800'
    case 'proximo_vencimento':
      return 'bg-yellow-100 text-yellow-800'
    case 'vencido':
      return 'bg-red-100 text-red-800'
    case 'pago':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Função para obter a cor da forma de pagamento
export function getCorFormaPagamento(forma: FormaPagamento): string {
  switch (forma) {
    case 'sem_forma':
      return 'bg-yellow-100 text-yellow-800'
    case 'pix':
      return 'bg-blue-100 text-blue-800'
    case 'boleto':
      return 'bg-purple-100 text-purple-800'
    case 'a_vista':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Função para formatar texto da forma de pagamento
export function getTextoFormaPagamento(forma: FormaPagamento): string {
  switch (forma) {
    case 'sem_forma':
      return 'Sem forma'
    case 'pix':
      return 'PIX'
    case 'boleto':
      return 'Boleto'
    case 'a_vista':
      return 'À Vista'
    default:
      return (forma as string).toUpperCase()
  }
}

// Função para formatar valor monetário
export function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

// Função para formatar data
export function formatarData(data: string): string {
  // Se a data está no formato YYYY-MM-DD, criar diretamente para evitar problemas de fuso horário
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const [year, month, day] = data.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day) // Mês é 0-indexado
    return dateObj.toLocaleDateString('pt-BR')
  }
  
  // Para outros formatos, usar a conversão normal
  return new Date(data).toLocaleDateString('pt-BR')
}

// Função para calcular dias até vencimento
export function calcularDiasVencimento(prazoData?: string): number | null {
  if (!prazoData) return null
  
  const hoje = new Date()
  const vencimento = new Date(prazoData)
  const diffTime = vencimento.getTime() - hoje.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

// Função para obter texto do status com dias
export function getTextoStatusComDias(pagamento: PagamentoReceber): string {
  const dias = calcularDiasVencimento(pagamento.prazo_data)
  
  switch (pagamento.status) {
    case 'aguardando':
      if (dias !== null) {
        return dias > 0 ? `Aguardando (${dias} dias)` : 'Aguardando'
      }
      return 'Aguardando'
    case 'proximo_vencimento':
      if (dias !== null) {
        return dias > 0 ? `Vence em ${dias} dias` : 'Vence hoje'
      }
      return 'Próximo do vencimento'
    case 'vencido':
      if (dias !== null) {
        return dias < 0 ? `Vencido há ${Math.abs(dias)} dias` : 'Vencido'
      }
      return 'Vencido'
    case 'pago':
      return 'Pago'
    default:
      return 'Aguardando'
  }
}

// Função para validar dados do pagamento
export function validarPagamentoReceber(data: CreatePagamentoReceberData): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!data.relatorio_id) {
    errors.relatorio_id = 'Relatório é obrigatório'
  }

  if (!data.cliente_id) {
    errors.cliente_id = 'Cliente é obrigatório'
  }

  if (!data.valor_total || data.valor_total <= 0) {
    errors.valor_total = 'Valor deve ser maior que zero'
  }

  if (!data.forma_pagamento) {
    errors.forma_pagamento = 'Forma de pagamento é obrigatória'
  }

  if (data.prazo_data && data.prazo_dias) {
    errors.prazo_data = 'Defina apenas prazo por data OU por dias'
  }

  if (!data.prazo_data && !data.prazo_dias) {
    errors.prazo_data = 'Defina um prazo (data ou dias)'
  }

  return errors
}

// Função para gerar resumo do pagamento
export function gerarResumoPagamento(pagamento: PagamentoReceberCompleto): string {
  const valor = formatarValor(pagamento.valor_total)
  const forma = FORMA_PAGAMENTO_OPTIONS.find(f => f.value === pagamento.forma_pagamento)?.label || pagamento.forma_pagamento
  const prazo = pagamento.prazo_data ? formatarData(pagamento.prazo_data) : `${pagamento.prazo_dias} dias`
  
  return `${valor} via ${forma} - Vencimento: ${prazo}`
}
