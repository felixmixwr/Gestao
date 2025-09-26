// Tipos para o módulo de Colaboradores

export type ColaboradorFuncao = 
  | 'Motorista Operador de Bomba'
  | 'Auxiliar de Bomba'
  | 'Programador'
  | 'Administrador Financeiro'
  | 'Fiscal de Obras'
  | 'Mecânico'

export type ColaboradorTipoContrato = 'fixo' | 'diarista'

export type TipoDocumento = 
  | 'CNH'
  | 'RG'
  | 'Comprovante Residência'
  | 'Reservista'
  | 'Título Eleitor'
  | 'CTPS'
  | 'PIS'
  | 'Outros'

export type TipoDiaHoraExtra = 'segunda-sexta' | 'sabado'

// Interface principal do colaborador
export interface Colaborador {
  id: string
  nome: string
  funcao: ColaboradorFuncao
  tipo_contrato: ColaboradorTipoContrato
  salario_fixo: number
  data_pagamento_1?: string
  data_pagamento_2?: string
  valor_pagamento_1?: number
  valor_pagamento_2?: number
  equipamento_vinculado_id?: string
  registrado: boolean
  vale_transporte: boolean
  qtd_passagens_por_dia?: number
  cpf?: string
  telefone?: string
  email?: string
  company_id: string
  created_at: string
  updated_at: string
}

// Interface para dependentes
export interface ColaboradorDependente {
  id: string
  colaborador_id: string
  nome_completo: string
  data_nascimento: string
  local_nascimento?: string
  tipo_dependente?: string
  created_at: string
}

// Interface para documentos
export interface ColaboradorDocumento {
  id: string
  colaborador_id: string
  tipo_documento: TipoDocumento
  dados_texto?: Record<string, any>
  arquivo_url?: string
  created_at: string
}

// Interface para horas extras
export interface ColaboradorHoraExtra {
  id: string
  colaborador_id: string
  data: string
  horas: number
  valor_calculado: number
  tipo_dia: TipoDiaHoraExtra
  created_at: string
}

// Interface para colaborador com relações
export interface ColaboradorWithRelations extends Colaborador {
  dependentes?: ColaboradorDependente[]
  documentos?: ColaboradorDocumento[]
  horas_extras?: ColaboradorHoraExtra[]
  equipamento_vinculado?: {
    id: string
    prefix: string
    model?: string
    brand?: string
  }
}

// Interface para criar colaborador
export interface CreateColaboradorData {
  nome: string
  funcao: ColaboradorFuncao
  tipo_contrato: ColaboradorTipoContrato
  salario_fixo: number
  data_pagamento_1?: string
  data_pagamento_2?: string
  valor_pagamento_1?: number
  valor_pagamento_2?: number
  equipamento_vinculado_id?: string
  registrado: boolean
  vale_transporte: boolean
  qtd_passagens_por_dia?: number
  cpf?: string
  telefone?: string
  email?: string
}

// Interface para atualizar colaborador
export interface UpdateColaboradorData extends Partial<CreateColaboradorData> {
  id: string
}

// Interface para criar dependente
export interface CreateDependenteData {
  colaborador_id: string
  nome_completo: string
  data_nascimento: string
  local_nascimento?: string
  tipo_dependente?: string
}

// Interface para criar documento
export interface CreateDocumentoData {
  colaborador_id: string
  tipo_documento: TipoDocumento
  dados_texto?: Record<string, any>
  arquivo_url?: string
}

// Interface para criar hora extra
export interface CreateHoraExtraData {
  colaborador_id: string
  data: string
  horas: number
  tipo_dia: TipoDiaHoraExtra
}

// Interface para filtros de colaboradores
export interface ColaboradorFilters {
  funcao?: ColaboradorFuncao[]
  tipo_contrato?: ColaboradorTipoContrato[]
  equipamento_vinculado_id?: string
  registrado?: boolean
  vale_transporte?: boolean
  search?: string
}

// Interface para estatísticas de colaboradores
export interface ColaboradorStats {
  total: number
  por_funcao: Record<ColaboradorFuncao, number>
  por_tipo_contrato: Record<ColaboradorTipoContrato, number>
  registrados: number
  com_vale_transporte: number
  vinculados_bomba: number
}

// Constantes para as opções de select
export const COLABORADOR_FUNCOES: { value: ColaboradorFuncao; label: string }[] = [
  { value: 'Motorista Operador de Bomba', label: 'Motorista Operador de Bomba' },
  { value: 'Auxiliar de Bomba', label: 'Auxiliar de Bomba' },
  { value: 'Programador', label: 'Programador' },
  { value: 'Administrador Financeiro', label: 'Administrador Financeiro' },
  { value: 'Fiscal de Obras', label: 'Fiscal de Obras' },
  { value: 'Mecânico', label: 'Mecânico' }
]

export const TIPOS_CONTRATO: { value: ColaboradorTipoContrato; label: string }[] = [
  { value: 'fixo', label: 'Fixo' },
  { value: 'diarista', label: 'Diarista' }
]

export const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'CNH', label: 'CNH' },
  { value: 'RG', label: 'RG' },
  { value: 'Comprovante Residência', label: 'Comprovante Residência' },
  { value: 'Reservista', label: 'Reservista' },
  { value: 'Título Eleitor', label: 'Título Eleitor' },
  { value: 'CTPS', label: 'CTPS' },
  { value: 'PIS', label: 'PIS' },
  { value: 'Outros', label: 'Outros' }
]

export const TIPOS_DIA_HORA_EXTRA: { value: TipoDiaHoraExtra; label: string }[] = [
  { value: 'segunda-sexta', label: 'Segunda a Sexta' },
  { value: 'sabado', label: 'Sábado' }
]

// Função para calcular valor das horas extras
// Nova fórmula: FIXO/220+50%
// Exemplo: 2000/220 = 9,09 + 50% = 13,63
export function calcularValorHoraExtra(
  salarioFixo: number,
  horas: number,
  tipoDia: TipoDiaHoraExtra
): number {
  // Valor base por hora: salário fixo dividido por 220 horas mensais
  const valorHoraBase = salarioFixo / 220
  
  // Aplicar adicional de 50% sobre o valor base
  console.log('Tipo de dia:', tipoDia)
  const valorHoraExtra = valorHoraBase * 1.5

  return horas * valorHoraExtra
}

// Função para formatar salário
export function formatarSalario(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

// Função para formatar data
export function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR')
}

// Função para obter cor da função
export function getCorFuncao(funcao: ColaboradorFuncao): string {
  const cores: Record<ColaboradorFuncao, string> = {
    'Motorista Operador de Bomba': 'bg-blue-100 text-blue-800',
    'Auxiliar de Bomba': 'bg-green-100 text-green-800',
    'Programador': 'bg-purple-100 text-purple-800',
    'Administrador Financeiro': 'bg-yellow-100 text-yellow-800',
    'Fiscal de Obras': 'bg-orange-100 text-orange-800',
    'Mecânico': 'bg-red-100 text-red-800'
  }
  return cores[funcao] || 'bg-gray-100 text-gray-800'
}

// Função para obter cor do tipo de contrato
export function getCorTipoContrato(tipo: ColaboradorTipoContrato): string {
  return tipo === 'fixo' 
    ? 'bg-green-100 text-green-800'
    : 'bg-blue-100 text-blue-800'
}
