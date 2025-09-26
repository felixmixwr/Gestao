// Tipos para o módulo de Bombas de Terceiros

export type StatusBombaTerceira = 'ativa' | 'em manutenção' | 'indisponível'

// Interface principal da empresa terceira
export interface EmpresaTerceira {
  id: string
  nome_fantasia: string
  razao_social?: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  created_at: string
  updated_at: string
}

// Interface principal da bomba terceira
export interface BombaTerceira {
  id: string
  empresa_id: string
  prefixo: string
  modelo?: string
  ano?: number
  status: StatusBombaTerceira
  valor_diaria?: number
  observacoes?: string
  created_at: string
  updated_at: string
}

// Interface para bomba terceira com dados da empresa
export interface BombaTerceiraWithEmpresa extends BombaTerceira {
  empresa_nome_fantasia: string
  empresa_razao_social?: string
  empresa_cnpj?: string
  empresa_telefone?: string
  empresa_email?: string
  empresa_endereco?: string
}

// Interface para empresa terceira com bombas associadas
export interface EmpresaTerceiraWithBombas extends EmpresaTerceira {
  bombas?: BombaTerceira[]
}

// Interface para criar empresa terceira
export interface CreateEmpresaTerceiraData {
  nome_fantasia: string
  razao_social?: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
}

// Interface para atualizar empresa terceira
export interface UpdateEmpresaTerceiraData extends Partial<CreateEmpresaTerceiraData> {
  id: string
}

// Interface para criar bomba terceira
export interface CreateBombaTerceiraData {
  empresa_id: string
  prefixo: string
  modelo?: string
  ano?: number
  status?: StatusBombaTerceira
  valor_diaria?: number
  observacoes?: string
}

// Interface para atualizar bomba terceira
export interface UpdateBombaTerceiraData extends Partial<CreateBombaTerceiraData> {
  id: string
}

// Interface para filtros de empresas terceiras
export interface EmpresaTerceiraFilters {
  search?: string
  cnpj?: string
}

// Interface para filtros de bombas terceiras
export interface BombaTerceiraFilters {
  empresa_id?: string
  status?: StatusBombaTerceira[]
  search?: string
}

// Interface para estatísticas de empresas terceiras
export interface EmpresaTerceiraStats {
  total_empresas: number
  total_bombas: number
  bombas_ativas: number
  bombas_em_manutencao: number
  bombas_indisponiveis: number
}

// Interface para estatísticas de bombas terceiras por empresa
export interface BombaTerceiraStatsByEmpresa {
  empresa_id: string
  empresa_nome: string
  total_bombas: number
  bombas_ativas: number
  bombas_em_manutencao: number
  bombas_indisponiveis: number
}

// Constantes para as opções de select
export const STATUS_BOMBA_TERCEIRA_OPTIONS: { value: StatusBombaTerceira; label: string }[] = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'em manutenção', label: 'Em Manutenção' },
  { value: 'indisponível', label: 'Indisponível' }
]

// Função para formatar CNPJ
export function formatarCNPJ(cnpj: string): string {
  // Remove caracteres não numéricos
  const numeros = cnpj.replace(/\D/g, '')
  
  // Aplica a máscara do CNPJ
  return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

// Função para validar CNPJ
export function validarCNPJ(cnpj: string): boolean {
  const numeros = cnpj.replace(/\D/g, '')
  
  // Verifica se tem 14 dígitos
  if (numeros.length !== 14) return false
  
  // Verifica se não são todos iguais
  if (/^(\d)\1+$/.test(numeros)) return false
  
  // Validação dos dígitos verificadores
  let soma = 0
  let peso = 2
  
  // Primeiro dígito verificador
  for (let i = 11; i >= 0; i--) {
    soma += parseInt(numeros[i]) * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  
  const resto = soma % 11
  const dv1 = resto < 2 ? 0 : 11 - resto
  
  if (parseInt(numeros[12]) !== dv1) return false
  
  // Segundo dígito verificador
  soma = 0
  peso = 2
  
  for (let i = 12; i >= 0; i--) {
    soma += parseInt(numeros[i]) * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  
  const resto2 = soma % 11
  const dv2 = resto2 < 2 ? 0 : 11 - resto2
  
  return parseInt(numeros[13]) === dv2
}

// Função para formatar telefone
export function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '')
  
  if (numeros.length === 10) {
    return numeros.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  } else if (numeros.length === 11) {
    return numeros.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  }
  
  return telefone
}

// Função para formatar data
export function formatarData(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR')
}

// Função para obter cor do status
export function getCorStatus(status: StatusBombaTerceira): string {
  const cores: Record<StatusBombaTerceira, string> = {
    'ativa': 'bg-green-100 text-green-800',
    'em manutenção': 'bg-yellow-100 text-yellow-800',
    'indisponível': 'bg-red-100 text-red-800'
  }
  return cores[status] || 'bg-gray-100 text-gray-800'
}

// Função para verificar se a manutenção está próxima (próximos 30 dias)
export function isManutencaoProxima(dataManutencao?: string): boolean {
  if (!dataManutencao) return false
  
  const hoje = new Date()
  const dataManutencaoObj = new Date(dataManutencao)
  const diffTime = dataManutencaoObj.getTime() - hoje.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays <= 30 && diffDays >= 0
}

// Função para obter texto de status da manutenção
export function getStatusManutencao(dataManutencao?: string): string {
  if (!dataManutencao) return 'Não agendada'
  
  const hoje = new Date()
  const dataManutencaoObj = new Date(dataManutencao)
  const diffTime = dataManutencaoObj.getTime() - hoje.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Atrasada'
  if (diffDays === 0) return 'Hoje'
  if (diffDays <= 7) return 'Esta semana'
  if (diffDays <= 30) return 'Este mês'
  
  return 'Futura'
}

// Função para obter cor do status da manutenção
export function getCorStatusManutencao(dataManutencao?: string): string {
  if (!dataManutencao) return 'bg-gray-100 text-gray-800'
  
  const hoje = new Date()
  const dataManutencaoObj = new Date(dataManutencao)
  const diffTime = dataManutencaoObj.getTime() - hoje.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'bg-red-100 text-red-800'
  if (diffDays <= 7) return 'bg-yellow-100 text-yellow-800'
  if (diffDays <= 30) return 'bg-blue-100 text-blue-800'
  
  return 'bg-green-100 text-green-800'
}
