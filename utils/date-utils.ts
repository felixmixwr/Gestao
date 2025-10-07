/**
 * Utilitários para manipulação de datas com fuso horário America/Sao_Paulo
 * Padronizado para o sistema WorldRental – Felix Mix
 */

import { format, formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { parseISO, startOfDay, endOfDay, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isToday, isValid } from 'date-fns';

// Timezone padrão do sistema
export const TIMEZONE = 'America/Sao_Paulo';

/**
 * Obtém a data atual no formato YYYY-MM-DD no fuso horário America/Sao_Paulo
 * Evita problemas de fuso horário que ocorrem com toISOString()
 */
export function getCurrentDateString(): string {
  const now = toZonedTime(new Date(), TIMEZONE)
  return format(now, 'yyyy-MM-dd', { timeZone: TIMEZONE })
}

/**
 * Converte uma data para string no formato YYYY-MM-DD no fuso horário America/Sao_Paulo
 * @param date - Data a ser convertida
 */
export function formatDateToLocalString(date: Date): string {
  const zonedDate = toZonedTime(date, TIMEZONE)
  return format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE })
}

/**
 * Converte uma string de data YYYY-MM-DD para Date no fuso horário America/Sao_Paulo
 * @param dateString - String de data no formato YYYY-MM-DD
 */
export function parseLocalDateString(dateString: string): Date {
  const date = parseISO(dateString)
  return toZonedTime(date, TIMEZONE)
}

/**
 * Adiciona dias a uma data e retorna no formato YYYY-MM-DD no timezone America/Sao_Paulo
 * @param date - Data base
 * @param days - Número de dias a adicionar (pode ser negativo)
 */
export function addDaysToDateString(date: Date, days: number): string {
  const zonedDate = toZonedTime(date, TIMEZONE)
  const newDate = addDays(zonedDate, days)
  return format(newDate, 'yyyy-MM-dd', { timeZone: TIMEZONE })
}

/**
 * Obtém o primeiro dia do mês atual no formato YYYY-MM-DD no timezone America/Sao_Paulo
 */
export function getFirstDayOfCurrentMonth(): string {
  const now = toZonedTime(new Date(), TIMEZONE)
  const startOfMonthDate = startOfMonth(now)
  return format(startOfMonthDate, 'yyyy-MM-dd', { timeZone: TIMEZONE })
}

/**
 * Obtém o último dia do mês atual no formato YYYY-MM-DD no timezone America/Sao_Paulo
 */
export function getLastDayOfCurrentMonth(): string {
  const now = toZonedTime(new Date(), TIMEZONE)
  const endOfMonthDate = endOfMonth(now)
  return format(endOfMonthDate, 'yyyy-MM-dd', { timeZone: TIMEZONE })
}

/**
 * Obtém o primeiro dia da semana atual (segunda-feira) no formato YYYY-MM-DD no timezone America/Sao_Paulo
 */
export function getFirstDayOfCurrentWeek(): string {
  const now = toZonedTime(new Date(), TIMEZONE)
  const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 }) // Segunda-feira
  return format(startOfWeekDate, 'yyyy-MM-dd', { timeZone: TIMEZONE })
}

/**
 * Obtém o último dia da semana atual (domingo) no formato YYYY-MM-DD no timezone America/Sao_Paulo
 */
export function getLastDayOfCurrentWeek(): string {
  const now = toZonedTime(new Date(), TIMEZONE)
  const endOfWeekDate = endOfWeek(now, { weekStartsOn: 1 }) // Segunda-feira
  return format(endOfWeekDate, 'yyyy-MM-dd', { timeZone: TIMEZONE })
}

/**
 * Formata uma data de forma segura, retornando string vazia se inválida no timezone America/Sao_Paulo
 * @param date - Data a ser formatada (pode ser string ou Date)
 */
export function formatDateSafe(date: string | Date | null | undefined): string {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    
    // Usar formato brasileiro para consistência visual
    return toBrasiliaDateString(dateObj)
  } catch (error) {
    console.warn('Erro ao formatar data:', error)
    return ''
  }
}

/**
 * Converte uma data para string no formato brasileiro (DD/MM/YYYY) no timezone America/Sao_Paulo
 * @param date - Data a ser convertida
 */
export function toBrasiliaDateString(date: Date): string {
  const zonedDate = toZonedTime(date, TIMEZONE)
  return format(zonedDate, 'dd/MM/yyyy', { timeZone: TIMEZONE })
}

/**
 * Converte uma string de data no formato brasileiro (DD/MM/YYYY) para Date no timezone America/Sao_Paulo
 * @param dateString - String de data no formato DD/MM/YYYY
 */
export function parseDateBR(dateString: string): Date {
  try {
    if (!dateString || typeof dateString !== 'string') {
      console.error('❌ [parseDateBR] Data inválida:', dateString);
      return toZonedTime(new Date(), TIMEZONE); // Retorna data atual se inválida
    }
    
    const [day, month, year] = dateString.split('/').map(Number);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      console.error('❌ [parseDateBR] Erro ao converter números:', { day, month, year });
      return toZonedTime(new Date(), TIMEZONE); // Retorna data atual se conversão falhou
    }
    
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2100) {
      console.error('❌ [parseDateBR] Valores de data inválidos:', { day, month, year });
      return toZonedTime(new Date(), TIMEZONE); // Retorna data atual se valores inválidos
    }
    
    const date = new Date(year, month - 1, day);
    
    if (isNaN(date.getTime())) {
      console.error('❌ [parseDateBR] Data resultante inválida:', date);
      return toZonedTime(new Date(), TIMEZONE); // Retorna data atual se objeto Date inválido
    }
    
    console.log('✅ [parseDateBR] Data válida:', { dateString, day, month, year, date });
    return toZonedTime(date, TIMEZONE);
  } catch (error) {
    console.error('❌ [parseDateBR] Erro geral:', error);
    return toZonedTime(new Date(), TIMEZONE); // Retorna data atual em caso de erro
  }
}

/**
 * Obtém os limites da semana (segunda a domingo) para uma data específica no timezone America/Sao_Paulo
 * @param date - Data de referência
 */
export function getWeekBoundsBrasilia(date: Date): { start: Date; end: Date } {
  const zonedDate = toZonedTime(date, TIMEZONE)
  const start = startOfWeek(zonedDate, { weekStartsOn: 1 }) // Segunda-feira
  const end = endOfWeek(zonedDate, { weekStartsOn: 1 }) // Domingo
  
  return { 
    start: fromZonedTime(start, TIMEZONE), 
    end: fromZonedTime(end, TIMEZONE) 
  }
}

/**
 * Obtém o nome do dia da semana em português no timezone America/Sao_Paulo
 * @param date - Data
 */
export function getDayOfWeekBR(date: Date): string {
  const zonedDate = toZonedTime(date, TIMEZONE)
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  return days[zonedDate.getDay()]
}