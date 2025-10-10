/**
 * FELIX IA - Cliente OpenAI para o sistema WorldRental – Felix Mix
 * Assistente interno especializado em análise empresarial e consultoria
 */

import { getFelixIAConfig, OPENAI_API_URLS, getOpenAIHeaders } from '../config/felix-ia'
import { 
  getReportsForAnalysis, 
  getFinancialData, 
  getPumpStatus, 
  getCollaboratorsData,
  getAllDataForAnalysis,
  getProgramacaoData,
  getDashboardData,
  getAdvancedPumpData,
  getPlannerData,
  getCompleteFinancialData,
  getAllSystemData
} from './felix-supabase'

// Interface para resposta estruturada da FELIX IA
export interface FelixResponse {
  success: boolean
  data?: any
  analysis?: string
  insights?: string[]
  recommendations?: string[]
  error?: string
  timestamp: string
  model: string
}

// Interface para contexto de análise
export interface AnalysisContext {
  data: any
  goal: string
  timeframe?: string
  filters?: Record<string, any>
  user_id?: string
  company_id?: string
}

// Interface para contexto de relatório
export interface ReportContext {
  report_type: string
  data: any
  period: string
  metrics?: Record<string, any>
  user_id?: string
  company_id?: string
}

// Cliente OpenAI configurado
let felixClient: any = null

/**
 * Inicializa o cliente OpenAI usando as variáveis de ambiente
 * @returns Cliente OpenAI configurado ou null se houver erro
 */
export function createFelixClient(): any {
  try {
    const config = getFelixIAConfig()
    
    if (!config.apiKey) {
      console.error('❌ [FELIX IA] API Key não encontrada')
      return null
    }

    // Configurar cliente OpenAI
    felixClient = {
      apiKey: config.apiKey,
      model: config.model,
      systemPrompt: config.systemPrompt,
      headers: getOpenAIHeaders(config.apiKey),
      baseURL: OPENAI_API_URLS.chat
    }

    console.log('✅ [FELIX IA] Cliente inicializado com sucesso')
    return felixClient
  } catch (error) {
    console.error('❌ [FELIX IA] Erro ao inicializar cliente:', error)
    return null
  }
}

/**
 * Envia prompt para o modelo e retorna resposta JSON estruturada
 * @param prompt - Pergunta ou solicitação para a FELIX IA
 * @param context - Contexto adicional (opcional)
 * @returns Resposta estruturada da FELIX IA
 */
export async function felixAsk(prompt: string, context?: object): Promise<FelixResponse> {
  try {
    // Inicializar cliente se necessário
    if (!felixClient) {
      felixClient = createFelixClient()
      if (!felixClient) {
        return createErrorResponse('Cliente FELIX IA não inicializado')
      }
    }

    // Preparar contexto adicional
    const contextString = context ? `\n\nContexto adicional:\n${JSON.stringify(context, null, 2)}` : ''
    
    // Construir prompt completo com instrução para resposta em JSON
    const fullPrompt = `${felixClient.systemPrompt}\n\n${prompt}${contextString}\n\nPor favor, responda em português brasileiro com tom profissional e estruturado. IMPORTANTE: Sua resposta deve ser um JSON válido com a seguinte estrutura: {"success": true, "data": {"response": "sua resposta aqui", "analysis": "análise detalhada", "insights": ["insight1", "insight2"], "recommendations": ["recomendação1", "recomendação2"]}, "timestamp": "data_atual", "model": "gpt-4o-mini"}`

    // Fazer requisição para OpenAI
    const response = await fetch(felixClient.baseURL, {
      method: 'POST',
      headers: felixClient.headers,
      body: JSON.stringify({
        model: felixClient.model,
        messages: [
          {
            role: 'system',
            content: felixClient.systemPrompt + '\n\nIMPORTANTE: Sempre responda em formato JSON válido.'
          },
          {
            role: 'user',
            content: prompt + contextString + '\n\nPor favor, responda em formato JSON com a estrutura: {"success": true, "data": {"response": "sua resposta", "analysis": "análise", "insights": [], "recommendations": []}, "timestamp": "data", "model": "gpt-4o-mini"}'
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ [FELIX IA] Erro na API OpenAI:', errorData)
      return createErrorResponse(`Erro na API: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      return createErrorResponse('Resposta vazia da FELIX IA')
    }

    // Tentar fazer parse do JSON
    let parsedContent
    try {
      parsedContent = JSON.parse(content)
    } catch (parseError) {
      // Se não for JSON válido, tratar como texto simples
      parsedContent = {
        analysis: content,
        insights: [],
        recommendations: []
      }
    }

    console.log('🔍 [FELIX IA] Conteúdo parseado:', parsedContent)
    console.log('🔍 [FELIX IA] Content original:', content)

    // Verificar se o JSON está aninhado no campo 'analysis' ou no content original
    let finalData = parsedContent
    console.log('🔍 [FELIX IA] Verificando JSON aninhado...')
    console.log('🔍 [FELIX IA] parsedContent.analysis existe?', !!parsedContent.analysis)
    console.log('🔍 [FELIX IA] parsedContent.analysis é string?', typeof parsedContent.analysis === 'string')
    console.log('🔍 [FELIX IA] parsedContent.analysis começa com {?', parsedContent.analysis?.startsWith?.('{'))
    console.log('🔍 [FELIX IA] parsedContent.analysis (primeiros 100 chars):', parsedContent.analysis?.substring?.(0, 100))
    
    // Verificar se o JSON aninhado está no content original
    console.log('🔍 [FELIX IA] Content original é string?', typeof content === 'string')
    console.log('🔍 [FELIX IA] Content original começa com {?', content?.startsWith?.('{'))
    console.log('🔍 [FELIX IA] Content original (primeiros 100 chars):', content?.substring?.(0, 100))
    
    // Verificar se o JSON aninhado está no campo 'analysis'
    if (parsedContent.analysis && typeof parsedContent.analysis === 'string' && parsedContent.analysis.startsWith('{')) {
      try {
        const nestedJson = JSON.parse(parsedContent.analysis)
        console.log('🔍 [FELIX IA] JSON aninhado detectado no analysis:', nestedJson)
        
        // Se o JSON aninhado tem a estrutura esperada, usar ele
        if (nestedJson.success !== undefined && nestedJson.data) {
          finalData = nestedJson.data
          console.log('✅ [FELIX IA] Usando dados do JSON aninhado (analysis)')
          console.log('🔍 [FELIX IA] Dados aninhados:', nestedJson.data)
          console.log('🔍 [FELIX IA] Response aninhado:', nestedJson.data.response)
        }
      } catch (nestedParseError) {
        console.warn('⚠️ [FELIX IA] Não foi possível parsear JSON aninhado (analysis):', nestedParseError)
      }
    }
    // Verificar se o JSON aninhado está no content original
    else if (content && typeof content === 'string' && content.startsWith('{')) {
      try {
        const nestedJson = JSON.parse(content)
        console.log('🔍 [FELIX IA] JSON aninhado detectado no content:', nestedJson)
        
        // Se o JSON aninhado tem a estrutura esperada, usar ele
        if (nestedJson.success !== undefined && nestedJson.data) {
          finalData = nestedJson.data
          console.log('✅ [FELIX IA] Usando dados do JSON aninhado (content)')
          console.log('🔍 [FELIX IA] Dados aninhados:', nestedJson.data)
          console.log('🔍 [FELIX IA] Response aninhado:', nestedJson.data.response)
        }
      } catch (nestedParseError) {
        console.warn('⚠️ [FELIX IA] Não foi possível parsear JSON aninhado (content):', nestedParseError)
      }
    } else {
      console.log('⚠️ [FELIX IA] JSON aninhado não detectado - condições não atendidas')
    }

    console.log('✅ [FELIX IA] Resposta final processada:', finalData)
    
    return {
      success: true,
      data: finalData,
      analysis: finalData.analysis || content,
      insights: finalData.insights || [],
      recommendations: finalData.recommendations || [],
      timestamp: new Date().toISOString(),
      model: felixClient.model
    }

  } catch (error) {
    console.error('❌ [FELIX IA] Erro em felixAsk:', error)
    return createErrorResponse(`Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Envia dados tabulares para análise e retorna insights estruturados
 * @param data - Dados para análise (relatórios, finanças, etc.)
 * @param goal - Objetivo da análise
 * @returns Análise estruturada dos dados
 */
export async function felixAnalyzeData(data: any, goal: string): Promise<FelixResponse> {
  try {
    // Preparar prompt específico para análise de dados
    const analysisPrompt = `
Analise os seguintes dados empresariais do sistema WorldRental – Felix Mix:

OBJETIVO DA ANÁLISE: ${goal}

DADOS FORNECIDOS:
${JSON.stringify(data, null, 2)}

Por favor, forneça uma análise estruturada incluindo:

1. **Resumo Executivo**: Principais descobertas e tendências
2. **Insights Principais**: 3-5 insights mais relevantes
3. **Métricas de Performance**: KPIs e indicadores importantes
4. **Oportunidades**: Áreas de melhoria identificadas
5. **Recomendações**: Ações específicas e acionáveis
6. **Alertas**: Pontos de atenção ou riscos identificados

Responda em formato JSON estruturado com as seguintes chaves:
- "resumo_executivo": string
- "insights": array de strings
- "metricas": object com KPIs
- "oportunidades": array de strings
- "recomendações": array de strings
- "alertas": array de strings
`

    return await felixAsk(analysisPrompt, { data_type: 'tabular_analysis', goal })

  } catch (error) {
    console.error('❌ [FELIX IA] Erro em felixAnalyzeData:', error)
    return createErrorResponse(`Erro na análise de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Gera resumo em linguagem natural de relatórios técnicos
 * @param context - Contexto do relatório
 * @returns Resumo estruturado em linguagem natural
 */
export async function felixGenerateReport(context: ReportContext): Promise<FelixResponse> {
  try {
    // Preparar prompt específico para geração de relatórios
    const reportPrompt = `
Gere um relatório executivo em linguagem natural para o sistema WorldRental – Felix Mix:

TIPO DE RELATÓRIO: ${context.report_type}
PERÍODO: ${context.period}

DADOS DO RELATÓRIO:
${JSON.stringify(context.data, null, 2)}

MÉTRICAS ADICIONAIS:
${context.metrics ? JSON.stringify(context.metrics, null, 2) : 'Nenhuma métrica adicional fornecida'}

Por favor, gere um relatório estruturado incluindo:

1. **Introdução**: Contexto e período analisado
2. **Principais Resultados**: Destaques dos dados apresentados
3. **Análise Detalhada**: Interpretação dos números e tendências
4. **Conclusões**: Principais descobertas
5. **Próximos Passos**: Recomendações para ação

O relatório deve ser:
- Escrito em português brasileiro
- Tom profissional e executivo
- Focado em insights acionáveis
- Estruturado para tomada de decisão

Responda em formato JSON estruturado com as seguintes chaves:
- "introdução": string
- "principais_resultados": string
- "análise_detalhada": string
- "conclusões": string
- "próximos_passos": string
- "resumo_executivo": string (versão condensada)
`

    return await felixAsk(reportPrompt, { 
      data_type: 'report_generation', 
      report_type: context.report_type,
      period: context.period 
    })

  } catch (error) {
    console.error('❌ [FELIX IA] Erro em felixGenerateReport:', error)
    return createErrorResponse(`Erro na geração de relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Cria resposta de erro padronizada
 * @param errorMessage - Mensagem de erro
 * @returns Resposta de erro estruturada
 */
function createErrorResponse(errorMessage: string): FelixResponse {
  return {
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString(),
    model: 'gpt-4o-mini'
  }
}

/**
 * Valida se o cliente FELIX IA está configurado corretamente
 * @returns true se configurado, false caso contrário
 */
export function isFelixConfigured(): boolean {
  const config = getFelixIAConfig()
  return !!(config.apiKey && config.model && config.systemPrompt)
}

/**
 * Obtém informações do cliente FELIX IA
 * @returns Informações de configuração (sem expor API key)
 */
export function getFelixInfo(): { model: string; version: string; configured: boolean } {
  const config = getFelixIAConfig()
  return {
    model: config.model,
    version: config.version,
    configured: isFelixConfigured()
  }
}

/**
 * Função utilitária para logging padronizado
 * @param level - Nível do log (info, warn, error)
 * @param message - Mensagem do log
 * @param data - Dados adicionais (opcional)
 */
function logFelix(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
  const timestamp = new Date().toISOString()
  const logMessage = `[FELIX IA] ${message}`
  
  switch (level) {
    case 'info':
      console.log(`✅ ${logMessage}`, data || '')
      break
    case 'warn':
      console.warn(`⚠️ ${logMessage}`, data || '')
      break
    case 'error':
      console.error(`❌ ${logMessage}`, data || '')
      break
  }
}

// ========================================
// FUNÇÕES INTEGRADAS COM SUPABASE
// ========================================

/**
 * Analisa dados financeiros do sistema
 * @param companyId - ID da empresa (opcional)
 * @returns Análise financeira estruturada
 */
export async function felixAnalyzeFinancial(companyId?: string): Promise<FelixResponse> {
  try {
    console.log('💰 [FELIX IA] Iniciando análise financeira...')
    
    const financialData = await getFinancialData(companyId)
    
    return await felixAnalyzeData(
      financialData,
      'Analisar performance financeira, identificar tendências, oportunidades de crescimento e pontos de atenção'
    )
  } catch (error) {
    console.error('❌ [FELIX IA] Erro na análise financeira:', error)
    return createErrorResponse(`Erro na análise financeira: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Analisa status e performance das bombas
 * @param companyId - ID da empresa (opcional)
 * @returns Análise operacional das bombas
 */
export async function felixAnalyzePumps(companyId?: string): Promise<FelixResponse> {
  try {
    console.log('🚛 [FELIX IA] Iniciando análise das bombas...')
    
    const pumpData = await getPumpStatus(companyId)
    
    return await felixAnalyzeData(
      pumpData,
      'Analisar performance das bombas, identificar gargalos operacionais, otimizar utilização e planejar manutenções'
    )
  } catch (error) {
    console.error('❌ [FELIX IA] Erro na análise das bombas:', error)
    return createErrorResponse(`Erro na análise das bombas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Analisa dados de colaboradores e RH
 * @param companyId - ID da empresa (opcional)
 * @returns Análise de recursos humanos
 */
export async function felixAnalyzeCollaborators(companyId?: string): Promise<FelixResponse> {
  try {
    console.log('👥 [FELIX IA] Iniciando análise de colaboradores...')
    
    const collaboratorsData = await getCollaboratorsData(companyId)
    
    return await felixAnalyzeData(
      collaboratorsData,
      'Analisar custos de RH, produtividade da equipe, otimizar recursos humanos e identificar oportunidades de melhoria'
    )
  } catch (error) {
    console.error('❌ [FELIX IA] Erro na análise de colaboradores:', error)
    return createErrorResponse(`Erro na análise de colaboradores: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Analisa relatórios de serviços
 * @param limit - Número máximo de relatórios (padrão: 50)
 * @param companyId - ID da empresa (opcional)
 * @returns Análise dos relatórios
 */
export async function felixAnalyzeReports(limit: number = 50, companyId?: string): Promise<FelixResponse> {
  try {
    console.log('📊 [FELIX IA] Iniciando análise de relatórios...')
    
    const reportsData = await getReportsForAnalysis(limit, companyId)
    
    return await felixAnalyzeData(
      reportsData,
      'Analisar performance dos serviços, identificar padrões de clientes, otimizar programação e melhorar eficiência operacional'
    )
  } catch (error) {
    console.error('❌ [FELIX IA] Erro na análise de relatórios:', error)
    return createErrorResponse(`Erro na análise de relatórios: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Gera relatório executivo completo do sistema
 * @param companyId - ID da empresa (opcional)
 * @returns Relatório executivo completo
 */
export async function felixGenerateExecutiveReport(companyId?: string): Promise<FelixResponse> {
  try {
    console.log('📋 [FELIX IA] Gerando relatório executivo completo...')
    
    const allData = await getAllDataForAnalysis(companyId)
    
    if (!allData) {
      return createErrorResponse('Não foi possível carregar os dados para o relatório')
    }
    
    const reportContext = {
      report_type: 'Relatório Executivo Completo',
      period: allData.metadata.periodo,
      data: allData,
      metrics: {
        total_receitas: allData.financeiro.resumo.total_receitas,
        total_despesas: allData.financeiro.resumo.total_despesas,
        lucro_liquido: allData.financeiro.resumo.lucro_liquido,
        bombas_ativas: allData.bombas.resumo.bombas_ativas,
        volume_total: allData.bombas.resumo.volume_total_mes,
        colaboradores_total: allData.colaboradores.produtividade.total_colaboradores,
        relatorios_periodo: allData.relatorios.length
      }
    }
    
    return await felixGenerateReport(reportContext)
  } catch (error) {
    console.error('❌ [FELIX IA] Erro na geração do relatório executivo:', error)
    return createErrorResponse(`Erro na geração do relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Analisa dados de programação (agendamentos)
 * @param companyId - ID da empresa (opcional)
 * @returns Análise da programação
 */
export async function felixAnalyzeProgramacao(companyId?: string): Promise<FelixResponse> {
  try {
    console.log('📅 [FELIX IA] Iniciando análise de programação...')
    
    const programacaoData = await getProgramacaoData(companyId)
    
    return await felixAnalyzeData(
      programacaoData,
      'Analisar programação de serviços, otimizar agendamentos, identificar conflitos e melhorar eficiência operacional'
    )
  } catch (error) {
    console.error('❌ [FELIX IA] Erro na análise de programação:', error)
    return createErrorResponse(`Erro na análise de programação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Analisa dados do dashboard
 * @param companyId - ID da empresa (opcional)
 * @returns Análise do dashboard
 */
export async function felixAnalyzeDashboard(companyId?: string): Promise<FelixResponse> {
  try {
    console.log('📊 [FELIX IA] Iniciando análise do dashboard...')
    
    const dashboardData = await getDashboardData(companyId)
    
    return await felixAnalyzeData(
      dashboardData,
      'Analisar métricas do dashboard, identificar tendências operacionais e oportunidades de melhoria'
    )
  } catch (error) {
    console.error('❌ [FELIX IA] Erro na análise do dashboard:', error)
    return createErrorResponse(`Erro na análise do dashboard: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Analisa dados avançados das bombas
 * @param companyId - ID da empresa (opcional)
 * @returns Análise avançada das bombas
 */
export async function felixAnalyzeAdvancedPumps(companyId?: string): Promise<FelixResponse> {
  try {
    console.log('🚛 [FELIX IA] Iniciando análise avançada das bombas...')
    
    const advancedPumpData = await getAdvancedPumpData(companyId)
    
    return await felixAnalyzeData(
      advancedPumpData,
      'Analisar performance avançada das bombas, KPIs, manutenção, diesel e investimentos'
    )
  } catch (error) {
    console.error('❌ [FELIX IA] Erro na análise avançada das bombas:', error)
    return createErrorResponse(`Erro na análise avançada das bombas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Analisa dados do planner (tarefas e notas)
 * @param companyId - ID da empresa (opcional)
 * @returns Análise do planner
 */
export async function felixAnalyzePlanner(companyId?: string): Promise<FelixResponse> {
  try {
    console.log('📋 [FELIX IA] Iniciando análise do planner...')
    
    const plannerData = await getPlannerData(companyId)
    
    return await felixAnalyzeData(
      plannerData,
      'Analisar tarefas, notas, produtividade pessoal e organização do trabalho'
    )
  } catch (error) {
    console.error('❌ [FELIX IA] Erro na análise do planner:', error)
    return createErrorResponse(`Erro na análise do planner: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Analisa dados financeiros completos
 * @param companyId - ID da empresa (opcional)
 * @returns Análise financeira completa
 */
export async function felixAnalyzeCompleteFinancial(companyId?: string): Promise<FelixResponse> {
  try {
    console.log('💰 [FELIX IA] Iniciando análise financeira completa...')
    
    const completeFinancialData = await getCompleteFinancialData(companyId)
    
    return await felixAnalyzeData(
      completeFinancialData,
      'Analisar dados financeiros completos, incluindo receitas, despesas, pagamentos a receber e custos de RH'
    )
  } catch (error) {
    console.error('❌ [FELIX IA] Erro na análise financeira completa:', error)
    return createErrorResponse(`Erro na análise financeira completa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Função de conveniência para análise rápida de tendências financeiras
 * @param companyId - ID da empresa (opcional)
 * @returns Análise de tendências financeiras
 */
export async function felixAnalyzeFinancialTrends(companyId?: string): Promise<FelixResponse> {
  return await felixAnalyzeFinancial(companyId)
}

/**
 * Função de conveniência para análise operacional completa
 * @param companyId - ID da empresa (opcional)
 * @returns Análise operacional completa
 */
export async function felixAnalyzeOperations(companyId?: string): Promise<FelixResponse> {
  try {
    console.log('⚙️ [FELIX IA] Iniciando análise operacional completa...')
    
    const [pumpData, reportsData] = await Promise.all([
      getPumpStatus(companyId),
      getReportsForAnalysis(30, companyId)
    ])
    
    const operationalData = {
      bombas: pumpData,
      relatorios: reportsData,
      resumo: {
        utilizacao_bombas: pumpData.resumo.utilizacao_media,
        volume_total: pumpData.resumo.volume_total_mes,
        servicos_periodo: reportsData.length,
        eficiencia_operacional: reportsData.length > 0 ? 
          pumpData.resumo.volume_total_mes / reportsData.length : 0
      }
    }
    
    return await felixAnalyzeData(
      operationalData,
      'Analisar eficiência operacional, otimizar programação de bombas, identificar gargalos e melhorar produtividade'
    )
  } catch (error) {
    console.error('❌ [FELIX IA] Erro na análise operacional:', error)
    return createErrorResponse(`Erro na análise operacional: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

// Inicializar cliente automaticamente
if (typeof window !== 'undefined') {
  // Só inicializar no browser
  createFelixClient()
}
