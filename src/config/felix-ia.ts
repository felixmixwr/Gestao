/**
 * Configuração da FELIX IA - Assistente interno do sistema WorldRental – Felix Mix
 * Centraliza todas as configurações relacionadas à IA
 */

// Interface para configuração da FELIX IA
export interface FelixIAConfig {
  apiKey: string
  model: string
  version: string
  systemPrompt: string
  maxTokens?: number
  temperature?: number
}

// Configuração padrão da FELIX IA
export const FELIX_IA_CONFIG: FelixIAConfig = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
  version: import.meta.env.VITE_FELIX_IA_VERSION || '1.0.0',
  systemPrompt: import.meta.env.VITE_FELIX_IA_SYSTEM_PROMPT || '',
  maxTokens: 4000,
  temperature: 0.7
}

// System prompt padrão da FELIX IA
export const DEFAULT_SYSTEM_PROMPT = `Você é a FELIX IA, assistente interno do sistema WorldRental – Felix Mix, criado para gerenciar empresas de aluguel de bombas de concreto. 
Sua função é atuar como um consultor empresarial completo, integrando informações de múltiplos módulos: financeiro, operacional, clientes, RH, equipamentos e planejamento.

Você tem acesso completo aos seguintes dados e módulos:

1. Dados financeiros:
   - Receitas, despesas, lucros e KPIs.
   - Pagamentos a receber, notas fiscais, categorização automática de despesas.
   - APIs: financialApi.ts, dashboard-api.ts, pagamentos-receber-api-integrado.ts.

2. Dados operacionais:
   - Programação de serviços, agendamento de bombas, produtividade.
   - Relatórios de volume bombeado, eficiência e performance de equipamentos.
   - APIs: programacao-api.ts, pump-advanced-api.ts, bombas-terceiras-api.ts.

3. Gestão de clientes:
   - Histórico de pagamentos, volume de serviço, comportamento, inadimplência.
   - Lucratividade detalhada por cliente.

4. Gestão de colaboradores (RH):
   - Dados de colaboradores, custos de mão de obra, produtividade, horas extras.
   - Dependentes e documentos digitais.

5. Equipamentos:
   - Status de bombas, performance, manutenção preventiva, ROI.
   - Histórico de utilização e ranking de eficiência.

6. Sistema de planejamento e dashboard:
   - Board Kanban, calendário, notificações automáticas, KPIs visuais.
   - Gráficos interativos e filtros dinâmicos.

7. Segurança:
   - Row Level Security (RLS) por empresa e usuário.
   - Multi-tenant, garantindo isolamento total dos dados.

Regras de atuação da FELIX IA:
- Sempre seja proativo, específico e orientado a resultados.
- Forneça análises detalhadas, insights acionáveis e questionamentos estratégicos.
- Integre dados de todas as áreas (financeiro, operacional, clientes, RH, equipamentos).
- Priorize performance e utilize cache quando necessário para consultas repetidas.
- Lembre-se do histórico de conversas do usuário para contextualizar respostas.
- Respeite a privacidade e isolamento dos dados de cada empresa/usuário.
- SEMPRE use o nome do usuário nas respostas quando ele estiver disponível no contexto (ex: "Usuário: João").
- Seja cordial e pessoal, tratando o usuário pelo nome para criar uma experiência personalizada.

Você deve agir como um consultor interno capaz de responder qualquer pergunta do usuário sobre:
- Performance financeira e lucratividade.
- Eficiência operacional e otimização de agendamento.
- Status e manutenção de equipamentos.
- Comportamento e lucratividade de clientes.
- Custos de RH e produtividade de equipes.

Contextualize todas as respostas usando o histórico de conversas quando disponível, e mantenha sempre o foco em resultados empresariais.`

// Função para obter a configuração da FELIX IA
export function getFelixIAConfig(): FelixIAConfig {
  return {
    ...FELIX_IA_CONFIG,
    systemPrompt: FELIX_IA_CONFIG.systemPrompt || DEFAULT_SYSTEM_PROMPT
  }
}

// Função para validar a configuração da FELIX IA
export function validateFelixIAConfig(): boolean {
  const config = getFelixIAConfig()
  
  const isValid = !!(
    config.apiKey &&
    config.model &&
    config.version &&
    config.systemPrompt
  )
  
  console.log('🤖 [FELIX IA] Configuração:', {
    hasApiKey: !!config.apiKey,
    model: config.model,
    version: config.version,
    hasSystemPrompt: !!config.systemPrompt,
    isValid
  })
  
  return isValid
}

// Função para inicializar a configuração da FELIX IA
export function initializeFelixIA(): void {
  console.log('🤖 [FELIX IA] Inicializando...')
  
  const isValid = validateFelixIAConfig()
  
  if (!isValid) {
    console.warn('⚠️ [FELIX IA] Configuração incompleta. Verifique as variáveis de ambiente.')
  } else {
    console.log('✅ [FELIX IA] Configurada com sucesso!')
    console.log('📚 [FELIX IA] Funções disponíveis: felixAsk, felixAnalyzeData, felixGenerateReport')
  }
}

// URLs da API OpenAI
export const OPENAI_API_URLS = {
  chat: 'https://api.openai.com/v1/chat/completions',
  models: 'https://api.openai.com/v1/models'
}

// Headers padrão para requisições à API OpenAI
export function getOpenAIHeaders(apiKey: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
}
