/**
 * Formata um valor numérico como moeda brasileira (R$)
 */
export function formatCurrency(value: number): string {
  // Usar formatação nativa que já inclui o sinal de menos no lugar correto
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata uma data para o formato ISO8601
 */
export function formatDateISO(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toISOString()
}

/**
 * Remove todos os caracteres não numéricos de um telefone
 * e adiciona o código do país (55) se necessário
 */
export function phoneToDigits(phone: string): string {
  // Remove todos os caracteres não numéricos
  const digits = phone.replace(/\D/g, '')
  
  // Se tem 10 ou 11 dígitos, adiciona o código do país (55)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }
  
  return digits
}

/**
 * Gera um número de relatório único
 * Formato: RPT-YYYYMMDD-XXXX (onde XXXX são 4 dígitos aleatórios)
 */
export function generateReportNumber(date: Date, sequence: number): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const seq = String(sequence).padStart(4, '0')
  
  return `RPT-${year}${month}${day}-${seq}`
}

/**
 * Formata uma data para exibição brasileira
 */
export function formatDateBR(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR').format(dateObj)
}

/**
 * Formata uma data e hora para exibição brasileira
 */
export function formatDateTimeBR(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(dateObj)
}

/**
 * Calcula a diferença em horas entre duas datas
 */
export function calculateHoursBetween(startDate: Date, endDate: Date): number {
  const diffInMs = endDate.getTime() - startDate.getTime()
  return Math.round(diffInMs / (1000 * 60 * 60)) // Converte para horas
}

/**
 * Valida se um email tem formato válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida se um telefone tem formato válido (mínimo 10 dígitos)
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}








