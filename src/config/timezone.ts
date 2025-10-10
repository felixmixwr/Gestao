/**
 * Configuração centralizada de timezone para o sistema WorldRental – Felix Mix
 * Garante que todas as operações de data/hora sejam consistentes
 */

// Timezone padrão do sistema
export const SYSTEM_TIMEZONE = 'America/Sao_Paulo'

// Configuração de timezone para o ambiente
export const TIMEZONE_CONFIG = {
  // Timezone principal do sistema
  primary: SYSTEM_TIMEZONE,
  
  // Timezone para exibição (frontend)
  display: SYSTEM_TIMEZONE,
  
  // Timezone para armazenamento (backend/database)
  storage: 'UTC',
  
  // Configurações de formatação
  formats: {
    date: 'dd/MM/yyyy',
    time: 'HH:mm',
    datetime: 'dd/MM/yyyy HH:mm',
    iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
    input: 'yyyy-MM-dd',
    inputDateTime: "yyyy-MM-dd'T'HH:mm"
  }
}

// Função para obter o timezone do sistema
export function getSystemTimezone(): string {
  return import.meta.env.VITE_TIMEZONE || SYSTEM_TIMEZONE
}

// Função para verificar se estamos no ambiente correto
export function validateTimezoneConfig(): boolean {
  const envTimezone = import.meta.env.VITE_TIMEZONE
  const systemTimezone = getSystemTimezone()
  
  console.log('🌍 [Timezone] Configuração:', {
    env: envTimezone,
    system: systemTimezone,
    default: SYSTEM_TIMEZONE
  })
  
  return systemTimezone === SYSTEM_TIMEZONE
}

// Configurar timezone no início da aplicação
export function initializeTimezone(): void {
  // Definir timezone no ambiente se disponível
  if (typeof process !== 'undefined' && process.env) {
    process.env.TZ = SYSTEM_TIMEZONE
  }
  
  // Log da configuração
  console.log('🌍 [Timezone] Inicializado:', {
    timezone: SYSTEM_TIMEZONE,
    timestamp: new Date().toISOString()
  })
  
  // Validar configuração
  validateTimezoneConfig()
}




