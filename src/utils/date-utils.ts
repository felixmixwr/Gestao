/**
 * Utilitários para manipulação de datas sem problemas de fuso horário
 */

/**
 * Obtém a data atual no formato YYYY-MM-DD no fuso horário local
 * Evita problemas de fuso horário que ocorrem com toISOString()
 */
export function getCurrentDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Converte uma data para string no formato YYYY-MM-DD no fuso horário local
 * @param date - Data a ser convertida
 */
export function formatDateToLocalString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Converte uma string de data YYYY-MM-DD para Date no fuso horário local
 * @param dateString - String de data no formato YYYY-MM-DD
 */
export function parseLocalDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Adiciona dias a uma data e retorna no formato YYYY-MM-DD
 * @param date - Data base
 * @param days - Número de dias a adicionar (pode ser negativo)
 */
export function addDaysToDateString(date: Date, days: number): string {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + days)
  return formatDateToLocalString(newDate)
}

/**
 * Obtém o primeiro dia do mês atual no formato YYYY-MM-DD
 */
export function getFirstDayOfCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

/**
 * Obtém o último dia do mês atual no formato YYYY-MM-DD
 */
export function getLastDayOfCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const lastDay = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

/**
 * Obtém o primeiro dia da semana atual (segunda-feira) no formato YYYY-MM-DD
 */
export function getFirstDayOfCurrentWeek(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Se domingo, volta 6 dias; senão, calcula para segunda
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  return formatDateToLocalString(monday)
}

/**
 * Obtém o último dia da semana atual (domingo) no formato YYYY-MM-DD
 */
export function getLastDayOfCurrentWeek(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const sundayOffset = dayOfWeek === 0 ? 0 : 7 - dayOfWeek // Se domingo, não move; senão, vai para domingo
  const sunday = new Date(now)
  sunday.setDate(now.getDate() + sundayOffset)
  return formatDateToLocalString(sunday)
}

/**
 * Formata uma data de forma segura, retornando string vazia se inválida
 * @param date - Data a ser formatada (pode ser string ou Date)
 */
export function formatDateSafe(date: string | Date | null | undefined): string {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return ''
    
    return formatDateToLocalString(dateObj)
  } catch (error) {
    console.warn('Erro ao formatar data:', error)
    return ''
  }
}

/**
 * Converte uma data para string no formato brasileiro (DD/MM/YYYY)
 * @param date - Data a ser convertida
 */
export function toBrasiliaDateString(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Converte uma string de data no formato brasileiro (DD/MM/YYYY) para Date
 * @param dateString - String de data no formato DD/MM/YYYY
 */
export function parseDateBR(dateString: string): Date {
  const [day, month, year] = dateString.split('/').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Obtém os limites da semana (segunda a domingo) para uma data específica
 * @param date - Data de referência
 */
export function getWeekBoundsBrasilia(date: Date): { start: Date; end: Date } {
  const dayOfWeek = date.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Se domingo, volta 6 dias; senão, calcula para segunda
  
  const start = new Date(date)
  start.setDate(date.getDate() + mondayOffset)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

/**
 * Obtém o nome do dia da semana em português
 * @param date - Data
 */
export function getDayOfWeekBR(date: Date): string {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  return days[date.getDay()]
}