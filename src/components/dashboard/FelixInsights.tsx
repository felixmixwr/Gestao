import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Bot,
  RefreshCw,
  BarChart3,
  Activity
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { felixAnalyzeData, felixAnalyzeFinancial } from '../../lib/felix-ia'
import { getFinancialData } from '../../lib/felix-supabase'
import { useAuth } from '../../lib/auth-hooks'

// Interface para insights da FELIX IA
interface FelixInsight {
  id: string
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  title: string
  description: string
  value?: string
  change?: {
    value: number
    period: string
  }
  icon: React.ReactNode
}

// Interface para dados de gráficos
interface ChartData {
  name: string
  value: number
  color?: string
}

// Interface para resposta da FELIX IA
interface FelixAnalysis {
  insights: FelixInsight[]
  charts: {
    revenue: ChartData[]
    expenses: ChartData[]
    trends: ChartData[]
  }
  summary: string
}

const FelixInsights: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<FelixAnalysis | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Função para gerar insights baseados na análise da FELIX IA
  const generateInsights = (felixResponse: any): FelixInsight[] => {
    const insights: FelixInsight[] = []
    
    // Extrair insights do texto da resposta da FELIX IA
    const content = felixResponse.content || felixResponse.analysis || ''
    
    // Padrões para identificar insights
    const patterns = [
      {
        type: 'positive' as const,
        keywords: ['aumento', 'crescimento', 'melhoria', 'positivo', 'lucro', 'receita'],
        icon: <TrendingUp className="h-5 w-5" />
      },
      {
        type: 'negative' as const,
        keywords: ['queda', 'redução', 'diminuição', 'negativo', 'prejuízo', 'perda'],
        icon: <TrendingDown className="h-5 w-5" />
      },
      {
        type: 'warning' as const,
        keywords: ['atenção', 'cuidado', 'risco', 'alerta', 'crítico'],
        icon: <AlertTriangle className="h-5 w-5" />
      },
      {
        type: 'neutral' as const,
        keywords: ['estável', 'mantém', 'constante', 'regular'],
        icon: <Activity className="h-5 w-5" />
      }
    ]

    // Gerar insights baseados no conteúdo
    patterns.forEach(pattern => {
      if (pattern.keywords.some(keyword => content.toLowerCase().includes(keyword))) {
        insights.push({
          id: `insight-${pattern.type}-${insights.length}`,
          type: pattern.type,
          title: `Análise ${pattern.type === 'positive' ? 'Positiva' : pattern.type === 'negative' ? 'Negativa' : pattern.type === 'warning' ? 'de Atenção' : 'Neutra'}`,
          description: content.substring(0, 150) + '...',
          icon: pattern.icon
        })
      }
    })

    // Se não encontrou insights específicos, criar um insight geral
    if (insights.length === 0) {
      insights.push({
        id: 'insight-general',
        type: 'neutral',
        title: 'Análise Financeira',
        description: content.substring(0, 150) + '...',
        icon: <BarChart3 className="h-5 w-5" />
      })
    }

    return insights.slice(0, 4) // Máximo 4 insights
  }

  // Função para gerar dados de gráficos baseados na análise
  const generateChartData = (felixResponse: any): FelixAnalysis['charts'] => {
    // Dados mockados baseados na análise (em produção, extrair do response)
    const revenue = [
      { name: 'Jan', value: 45000, color: '#10B981' },
      { name: 'Fev', value: 52000, color: '#10B981' },
      { name: 'Mar', value: 48000, color: '#F59E0B' },
      { name: 'Abr', value: 61000, color: '#10B981' },
      { name: 'Mai', value: 55000, color: '#10B981' },
      { name: 'Jun', value: 67000, color: '#10B981' }
    ]

    const expenses = [
      { name: 'Combustível', value: 15000, color: '#EF4444' },
      { name: 'Manutenção', value: 8000, color: '#F59E0B' },
      { name: 'Salários', value: 25000, color: '#3B82F6' },
      { name: 'Outros', value: 5000, color: '#6B7280' }
    ]

    const trends = [
      { name: 'Semana 1', value: 12000 },
      { name: 'Semana 2', value: 15000 },
      { name: 'Semana 3', value: 11000 },
      { name: 'Semana 4', value: 18000 }
    ]

    return { revenue, expenses, trends }
  }

  // Função para executar análise da FELIX IA
  const runAnalysis = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🤖 [FELIX INSIGHTS] Iniciando análise financeira...')
      
      // Executar análise financeira integrada
      const felixResponse = await felixAnalyzeFinancial()
      
      if (!felixResponse.success) {
        throw new Error(felixResponse.error || 'Erro na análise da FELIX IA')
      }

      // Gerar insights e dados de gráficos
      const insights = generateInsights(felixResponse)
      const charts = generateChartData(felixResponse)

      const newAnalysis: FelixAnalysis = {
        insights,
        charts,
        summary: felixResponse.content || felixResponse.analysis || 'Análise financeira concluída.'
      }

      setAnalysis(newAnalysis)
      setLastUpdate(new Date())
      
      console.log('✅ [FELIX INSIGHTS] Análise concluída com sucesso')
      
    } catch (err) {
      console.error('❌ [FELIX INSIGHTS] Erro na análise:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  // Executar análise inicial
  useEffect(() => {
    runAnalysis()
  }, [runAnalysis])

  // Atualização automática a cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 [FELIX INSIGHTS] Atualização automática...')
      runAnalysis()
    }, 60000) // 60 segundos

    return () => clearInterval(interval)
  }, [runAnalysis])

  // Função para navegar para FELIX IA com contexto
  const handleExploreWithFelix = () => {
    const contextData = {
      source: 'dashboard-insights',
      analysis: analysis?.summary,
      timestamp: new Date().toISOString()
    }
    
    // Navegar para FELIX IA com dados contextuais
    navigate('/felix-ia', { 
      state: { 
        context: contextData,
        initialMessage: 'Analise os insights do dashboard e forneça recomendações específicas.'
      }
    })
  }

  // Cores para diferentes tipos de insights
  const getInsightColors = (type: FelixInsight['type']) => {
    switch (type) {
      case 'positive':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          text: 'text-green-800'
        }
      case 'negative':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          text: 'text-red-800'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-800'
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          text: 'text-blue-800'
        }
    }
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bot className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">FELIX Insights</h3>
          </div>
          <button
            onClick={runAnalysis}
            className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Tentar novamente</span>
          </button>
        </div>
        
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Erro ao carregar insights</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bot className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">FELIX Insights</h3>
            <p className="text-sm text-gray-500">
              Análise inteligente dos dados financeiros
              {lastUpdate && (
                <span className="ml-2">
                  • Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {loading && !analysis ? (
        // Loading inicial
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* Cards de Insights */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Principais Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {analysis.insights.map((insight, index) => {
                  const colors = getInsightColors(insight.type)
                  return (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border-2 ${colors.bg} ${colors.border}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${colors.icon}`}>
                          {insight.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className={`text-sm font-medium ${colors.text} mb-1`}>
                            {insight.title}
                          </h5>
                          <p className="text-xs text-gray-600 line-clamp-3">
                            {insight.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Gráficos Explicativos */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Análise Visual</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Receitas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Receitas Mensais</h5>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analysis.charts.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico de Despesas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Distribuição de Despesas</h5>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={analysis.charts.expenses}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analysis.charts.expenses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Botão para Explorar com FELIX IA */}
          <div className="flex justify-center pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExploreWithFelix}
              className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Bot className="h-5 w-5" />
              <span className="font-medium">Explorar com FELIX IA</span>
            </motion.button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default FelixInsights
