/**
 * Página da FELIX IA - Interface de Chat
 * Layout em estilo "copiloto lateral" para interação com a IA
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  TrendingUp, 
  BarChart3, 
  FileText,
  MessageSquare,
  Sparkles,
  Clock,
  ChevronRight,
  Activity,
  Users
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { 
  felixAsk, 
  felixAnalyzeFinancial, 
  felixAnalyzePumps, 
  felixAnalyzeCollaborators,
  felixAnalyzeReports,
  felixGenerateExecutiveReport,
  felixAnalyzeFinancialTrends,
  felixAnalyzeOperations,
  felixAnalyzeProgramacao,
  felixAnalyzeDashboard,
  felixAnalyzeAdvancedPumps,
  felixAnalyzePlanner,
  felixAnalyzeCompleteFinancial
} from '../lib/felix-ia'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth-hooks'
import { Layout } from '../components/Layout'

// Interface para mensagens do chat
interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date | string
  isTyping?: boolean
}

// Interface para histórico do chat
interface ChatHistory {
  id: string
  user_id: string
  company_id: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

// Sugestões rápidas
const QUICK_SUGGESTIONS = [
  {
    id: 'programacao-analysis',
    title: 'Programação de amanhã',
    description: 'Agendamentos e cronograma',
    icon: Clock,
    action: 'programacao'
  },
  {
    id: 'financial-summary',
    title: 'Resumo financeiro',
    description: 'Análise completa das finanças',
    icon: TrendingUp,
    action: 'financial'
  },
  {
    id: 'pump-analysis',
    title: 'Análise de bombas',
    description: 'Status e performance avançada',
    icon: Activity,
    action: 'pumps'
  },
  {
    id: 'executive-report',
    title: 'Relatório executivo',
    description: 'Visão geral completa do sistema',
    icon: FileText,
    action: 'executive'
  }
]

export default function FelixIAPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [userCompanyId, setUserCompanyId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll automático para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Carregar histórico do chat e dados do usuário
  useEffect(() => {
    if (user) {
      loadUserData()
      loadChatHistory()
    }
  }, [user])

  // Buscar dados do usuário (nome e company_id)
  const loadUserData = async () => {
    if (!user) return

    try {
      // Buscar nome do usuário na tabela users ou colaboradores
      const { data: userData, error } = await supabase
        .from('users')
        .select('name, company_id')
        .eq('id', user.id)
        .single()

      if (userData) {
        setUserName(userData.name || user.email?.split('@')[0] || 'Usuário')
        setUserCompanyId(userData.company_id || 'default')
      } else {
        // Fallback: tentar buscar em colaboradores
        const { data: colaboradorData } = await supabase
          .from('colaboradores')
          .select('nome, company_id')
          .eq('user_id', user.id)
          .single()

        if (colaboradorData) {
          setUserName(colaboradorData.nome || user.email?.split('@')[0] || 'Usuário')
          setUserCompanyId(colaboradorData.company_id || 'default')
        } else {
          // Fallback final: usar email
          setUserName(user.email?.split('@')[0] || 'Usuário')
          setUserCompanyId(user.user_metadata?.company_id || 'default')
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error)
      setUserName(user.email?.split('@')[0] || 'Usuário')
      setUserCompanyId('default')
    }
  }

  // Carregar histórico do chat do Supabase
  const loadChatHistory = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('felix_chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Erro ao carregar histórico:', error)
        return
      }

      if (data && data.length > 0) {
        const chatHistory = data[0]
        // Converter timestamps de string para Date
        const messagesWithDates = (chatHistory.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
        }))
        setMessages(messagesWithDates)
      } else {
        // Mensagem de boas-vindas personalizada
        const welcomeMessage = userName 
          ? `Olá **${userName}**! 👋

Sou a **FELIX IA**, sua assistente empresarial pessoal para o WorldRental – Felix Mix. 

Estou aqui para ajudá-lo com:
- 📊 **Análises financeiras** e relatórios
- 🚛 **Performance das bombas** e equipamentos  
- 👥 **Gestão de colaboradores** e RH
- 📈 **Insights operacionais** e otimizações

Como posso ajudá-lo hoje, ${userName}?`
          : `Olá! Sou a **FELIX IA**, sua assistente empresarial para o WorldRental – Felix Mix. 

Estou aqui para ajudar você com:
- 📊 **Análises financeiras** e relatórios
- 🚛 **Performance das bombas** e equipamentos  
- 👥 **Gestão de colaboradores** e RH
- 📈 **Insights operacionais** e otimizações

Como posso ajudá-lo hoje?`

        setMessages([{
          id: 'welcome',
          type: 'assistant',
          content: welcomeMessage,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Erro ao carregar histórico do chat:', error)
    }
  }

  // Salvar histórico do chat no Supabase
  const saveChatHistory = async (newMessages: ChatMessage[]) => {
    if (!user) return

    try {
      // Converter timestamps de Date para string para salvar no Supabase
      const messagesForSave = newMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
      }))

      const chatData = {
        user_id: user.id,
        company_id: userCompanyId || user.user_metadata?.company_id || 'default',
        messages: messagesForSave,
        updated_at: new Date().toISOString()
      }

      // Verificar se já existe histórico
      const { data: existing } = await supabase
        .from('felix_chat_history')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (existing && existing.length > 0) {
        // Atualizar histórico existente
        await supabase
          .from('felix_chat_history')
          .update(chatData)
          .eq('id', existing[0].id)
      } else {
        // Criar novo histórico
        await supabase
          .from('felix_chat_history')
          .insert([{
            ...chatData,
            created_at: new Date().toISOString()
          }])
      }
    } catch (error) {
      console.error('Erro ao salvar histórico do chat:', error)
    }
  }

  // Enviar mensagem
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      // Simular delay de digitação
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Determinar qual função usar baseada no contexto da pergunta
      let response
      const question = content.trim().toLowerCase()
      
      if (question.includes('programação') || question.includes('agendamento') || question.includes('amanhã') || question.includes('hoje') || question.includes('agenda') || question.includes('cronograma')) {
        console.log('📅 [FELIX IA] Usando análise de programação...')
        response = await felixAnalyzeProgramacao()
      } else if (question.includes('dashboard') || question.includes('métricas') || question.includes('kpi') || question.includes('indicador')) {
        console.log('📊 [FELIX IA] Usando análise do dashboard...')
        response = await felixAnalyzeDashboard()
      } else if (question.includes('bomba') || question.includes('equipamento') || question.includes('prefixo') || question.includes('manutenção') || question.includes('diesel') || question.includes('kpi')) {
        console.log('🚛 [FELIX IA] Usando análise avançada de bombas...')
        response = await felixAnalyzeAdvancedPumps()
      } else if (question.includes('planner') || question.includes('tarefa') || question.includes('nota') || question.includes('organização') || question.includes('produtividade pessoal')) {
        console.log('📋 [FELIX IA] Usando análise do planner...')
        response = await felixAnalyzePlanner()
      } else if (question.includes('financeiro') || question.includes('receita') || question.includes('despesa') || question.includes('lucro') || question.includes('pagamento') || question.includes('custo')) {
        console.log('💰 [FELIX IA] Usando análise financeira completa...')
        response = await felixAnalyzeCompleteFinancial()
      } else if (question.includes('colaborador') || question.includes('funcionário') || question.includes('rh') || question.includes('salário') || question.includes('equipe')) {
        console.log('👥 [FELIX IA] Usando análise de colaboradores...')
        response = await felixAnalyzeCollaborators()
      } else if (question.includes('relatório') || question.includes('serviço') || question.includes('cliente') || question.includes('volume')) {
        console.log('📊 [FELIX IA] Usando análise de relatórios...')
        response = await felixAnalyzeReports()
      } else if (question.includes('executivo') || question.includes('completo') || question.includes('resumo') || question.includes('geral')) {
        console.log('📋 [FELIX IA] Usando relatório executivo...')
        response = await felixGenerateExecutiveReport()
      } else if (question.includes('tendência') || question.includes('análise') || question.includes('performance') || question.includes('evolução')) {
        console.log('📈 [FELIX IA] Usando análise de tendências...')
        response = await felixAnalyzeFinancialTrends()
      } else if (question.includes('operação') || question.includes('produtividade') || question.includes('eficência') || question.includes('processo')) {
        console.log('⚙️ [FELIX IA] Usando análise operacional...')
        response = await felixAnalyzeOperations()
      } else {
        console.log('💬 [FELIX IA] Usando análise geral...')
        // Adicionar contexto do usuário na pergunta
        const contextualQuestion = userName 
          ? `${content.trim()} (Usuário: ${userName})`
          : content.trim()
        response = await felixAsk(contextualQuestion)
      }
      
      console.log('🔍 [FELIX IA] Resposta recebida:', response)
      
      // Processar resposta da FELIX IA
      let messageContent = 'Desculpe, não consegui processar sua solicitação.'
      
      if (response.success && response.data) {
        console.log('🔍 [FELIX IA] Dados da resposta:', response.data)
        
        // Construir resposta formatada com insights e recomendações
        let formattedResponse = ''
        
        // Verificar se response é um objeto estruturado
        const responseData = response.data.response
        console.log('🔍 [FELIX IA] Resposta principal (tipo):', typeof responseData)
        
        // Se response for um objeto estruturado (tem resumo_executivo, metricas, etc)
        if (responseData && typeof responseData === 'object' && responseData.resumo_executivo) {
          console.log('📊 [FELIX IA] Usando resposta estruturada')
          
          // Resumo Executivo
          if (responseData.resumo_executivo) {
            formattedResponse += `## 📋 Resumo Executivo\n\n${responseData.resumo_executivo}\n`
          }
          
          // Métricas
          if (responseData.metricas) {
            formattedResponse += `\n## 📊 Métricas\n\n`
            Object.entries(responseData.metricas).forEach(([key, value]) => {
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              formattedResponse += `• **${label}:** ${value}\n`
            })
          }
          
          // Insights
          if (responseData.insights && responseData.insights.length > 0) {
            formattedResponse += `\n## 💡 Insights\n\n${responseData.insights.map((insight: string) => `• ${insight}`).join('\n')}\n`
          }
          
          // Oportunidades
          if (responseData.oportunidades && responseData.oportunidades.length > 0) {
            formattedResponse += `\n## 🎯 Oportunidades\n\n${responseData.oportunidades.map((op: string) => `• ${op}`).join('\n')}\n`
          }
          
          // Recomendações
          if (responseData.recomendações && responseData.recomendações.length > 0) {
            formattedResponse += `\n## ✅ Recomendações\n\n${responseData.recomendações.map((rec: string) => `• ${rec}`).join('\n')}\n`
          }
          
          // Alertas
          if (responseData.alertas && responseData.alertas.length > 0) {
            formattedResponse += `\n## ⚠️ Alertas\n\n${responseData.alertas.map((alert: string) => `• ${alert}`).join('\n')}`
          }
        } 
        // Se for uma string simples
        else if (typeof responseData === 'string') {
          formattedResponse = responseData
        }
        // Fallback para análise
        else if (response.data.analysis) {
          formattedResponse = response.data.analysis
        }
        
        // Se ainda não há conteúdo, usar mensagem padrão
        if (!formattedResponse || formattedResponse.trim() === '') {
          formattedResponse = 'Olá! Como posso ajudá-lo hoje?'
        }
        
        // Adicionar análise adicional se disponível (e não for redundante)
        if (response.data.analysis && 
            !formattedResponse.includes(response.data.analysis) &&
            response.data.analysis !== 'Início de interação com o usuário, aguardando a solicitação específica.') {
          formattedResponse += `\n\n## 📊 Análise Detalhada\n\n${response.data.analysis}`
        }
        
        // Adicionar insights adicionais (da raiz do response.data)
        if (response.data.insights && 
            response.data.insights.length > 0 && 
            !formattedResponse.includes('## 💡 Insights')) {
          formattedResponse += `\n\n## 💡 Insights Adicionais\n\n${response.data.insights.map((insight: string) => `• ${insight}`).join('\n')}`
        }
        
        // Adicionar recomendações adicionais (da raiz do response.data)
        if (response.data.recommendations && 
            response.data.recommendations.length > 0 && 
            !formattedResponse.includes('## ✅ Recomendações')) {
          formattedResponse += `\n\n## 🎯 Recomendações Adicionais\n\n${response.data.recommendations.map((rec: string) => `• ${rec}`).join('\n')}`
        }
        
        messageContent = formattedResponse
        console.log('✅ [FELIX IA] Conteúdo final formatado')
      } else if (response.error) {
        messageContent = `Erro: ${response.error}`
        console.log('❌ [FELIX IA] Erro na resposta:', response.error)
      } else {
        console.log('⚠️ [FELIX IA] Resposta sem dados válidos:', response)
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: messageContent,
        timestamp: new Date()
      }

      const finalMessages = [...newMessages, assistantMessage]
      setMessages(finalMessages)
      
      // Salvar no Supabase
      await saveChatHistory(finalMessages)

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
        timestamp: new Date()
      }

      const finalMessages = [...newMessages, errorMessage]
      setMessages(finalMessages)
      await saveChatHistory(finalMessages)
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  // Executar sugestão rápida
  const executeQuickSuggestion = async (suggestion: typeof QUICK_SUGGESTIONS[0]) => {
    let prompt = ''
    
    switch (suggestion.action) {
      case 'programacao':
        prompt = 'Mostre a programação de amanhã, incluindo agendamentos, bombas utilizadas e cronograma de serviços.'
        break
      case 'financial':
        prompt = 'Gere um resumo financeiro completo da empresa, incluindo receitas, despesas, lucros e principais indicadores de performance.'
        break
      case 'pumps':
        prompt = 'Analise o status e performance avançada das bombas disponíveis, incluindo KPIs, manutenção e diesel.'
        break
      case 'executive':
        prompt = 'Gere um relatório executivo completo do sistema, integrando dados financeiros, operacionais e de RH.'
        break
      case 'collaborators':
        prompt = 'Analise os dados dos colaboradores, custos de RH, produtividade e oportunidades de otimização.'
        break
      default:
        prompt = suggestion.title
    }

    await sendMessage(prompt)
  }

  // Formatar timestamp
  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <Layout>
      <div className="flex h-full bg-gray-50">
        {/* Sidebar - Copiloto Lateral */}
        <motion.div 
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="w-80 bg-white border-r border-gray-200 flex flex-col"
        >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">FELIX IA</h1>
              <p className="text-sm text-gray-500">Assistente Empresarial</p>
            </div>
          </div>
        </div>

        {/* Sugestões Rápidas */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Sugestões Rápidas</h3>
          <div className="space-y-3">
            {QUICK_SUGGESTIONS.map((suggestion) => {
              const Icon = suggestion.icon
              return (
                <motion.button
                  key={suggestion.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => executeQuickSuggestion(suggestion)}
                  disabled={isLoading}
                  className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{suggestion.title}</p>
                      <p className="text-xs text-gray-500">{suggestion.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Estatísticas</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Mensagens hoje</span>
              <span className="text-sm font-medium text-gray-900">{messages.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-6">
          <div className="text-xs text-gray-500 text-center">
            <p>FELIX IA v1.0.0</p>
            <p>Powered by OpenAI GPT-4o-mini</p>
          </div>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Conversa com FELIX IA</h2>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{formatTime(new Date())}</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-blue-600' 
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}>
                      {message.type === 'assistant' ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }) => <h1 className="text-lg font-semibold mb-2">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="text-sm">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                              pre: ({ children }) => <pre className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto">{children}</pre>,
                              table: ({ children }) => <table className="min-w-full border-collapse border border-gray-300 text-sm">{children}</table>,
                              th: ({ children }) => <th className="border border-gray-300 bg-gray-100 px-2 py-1 text-left font-semibold">{children}</th>,
                              td: ({ children }) => <td className="border border-gray-300 px-2 py-1">{children}</td>,
                              blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600">{children}</blockquote>
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-start"
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">FELIX IA está digitando...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(inputValue)}
                placeholder="Digite sua pergunta para a FELIX IA..."
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="font-medium">Enviar</span>
                </>
              )}
            </motion.button>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Pressione Enter para enviar</span>
              <span>•</span>
              <span>Shift + Enter para nova linha</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Powered by FELIX IA</span>
            </div>
          </div>
        </div>
      </div> {/* fim Main Chat Area */}
      </div> {/* fim flex h-full */}
    </Layout>
  )
}
