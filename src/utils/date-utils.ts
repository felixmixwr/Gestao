// =============================================
// Utilitários para manipulação de datas no fuso horário de Brasília
// =============================================

/**
 * Converte uma data ISO para o fuso horário de Brasília (UTC-3)
 */
export function toBrasiliaTime(dateString: string): Date {
  const date = new Date(dateString);
  
  // Ajustar para o fuso horário de Brasília (UTC-3)
  const brasiliaOffset = -3 * 60; // -3 horas em minutos
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
  const brasiliaTime = new Date(utcTime + (brasiliaOffset * 60000));
  
  return brasiliaTime;
}

/**
 * Converte uma data para string no formato YYYY-MM-DD no fuso horário de Brasília
 */
export function toBrasiliaDateString(dateString: string): string {
  const date = toBrasiliaTime(dateString);
  return date.toISOString().split('T')[0];
}

/**
 * Obtém os limites da semana no fuso horário de Brasília
 */
export function getWeekBoundsBrasilia(date: Date) {
  // Usar uma abordagem mais simples - criar datas locais
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day); // Domingo
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 6); // Sábado
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Formata uma data para exibição no formato brasileiro
 */
export function formatDateBR(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
}

/**
 * Converte uma string de data para Date no fuso horário de Brasília
 */
export function parseDateBR(dateString: string): Date {
  // Se a data já está no formato YYYY-MM-DD, criar diretamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  // Caso contrário, usar a função de conversão
  return toBrasiliaTime(dateString);
}

/**
 * Obtém o dia da semana (0-6) de uma data no fuso horário de Brasília
 */
export function getDayOfWeekBR(dateString: string): number {
  // Para strings no formato YYYY-MM-DD, criar data local diretamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDay();
  }
  
  // Para outros formatos, usar a conversão
  const date = toBrasiliaTime(dateString);
  return date.getDay();
}

/**
 * Converte uma data para string ISO no fuso horário de Brasília
 */
export function toBrasiliaISOString(date: Date): string {
  // Para datas locais, usar diretamente o toISOString()
  // O problema estava na conversão desnecessária
  return date.toISOString();
}
