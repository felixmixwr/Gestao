import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Configuração do OpenAI
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
})

// Configuração do Supabase (server-side)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// System prompt para o Felix IA
const SYSTEM_PROMPT = `Você é Felix IA, um assistente consultivo especializado em obras de concreto e operações de bombeamento. 

Você trabalha para a WorldRental/Felix Mix, uma empresa que aluga bombas de concreto para obras. Suas principais responsabilidades são:

1. **Análise de Custos**: Analisar gastos com combustível, manutenção, despesas operacionais
2. **Relatórios de Manutenção**: Histórico de manutenções, próximas manutenções preventivas
3. **Performance das Bombas**: Volume bombeado, eficiência, tempo de operação
4. **Análise Financeira**: Receitas, custos, margens de lucro por projeto

**Regras importantes:**
- Se a pergunta requer dados internos, chame uma das funções fornecidas
- Sempre forneça números comparativos claros e % de variação quando possível
- Se não houver dados, diga "Não há registros..." e sugira próximos passos
- Use linguagem técnica mas acessível
- Sempre responda em português brasileiro
- Quando apropriado, sugira gráficos e visualizações para os dados

**Contexto da empresa:**
- Bombas de concreto de diferentes capacidades (m³/h)
- Operações em obras de construção civil
- Gestão de equipe (motoristas, operadores, mecânicos)
- Controle financeiro rigoroso de custos operacionais`

// Definições das funções para OpenAI Function Calling
const FUNCTION_DEFINITIONS = [
  {
    name: 'getPumpExpenses',
    description: 'Obter gastos de uma bomba específica em um período',
    parameters: {
      type: 'object',
      properties: {
        pumpId: {
          type: 'string',
          description: 'ID da bomba'
        },
        startDate: {
          type: 'string',
          description: 'Data de início no formato YYYY-MM-DD'
        },
        endDate: {
          type: 'string',
          description: 'Data de fim no formato YYYY-MM-DD'
        }
      },
      required: ['pumpId', 'startDate', 'endDate']
    }
  },
  {
    name: 'getDieselUsage',
    description: 'Obter consumo de diesel de uma bomba em um período',
    parameters: {
      type: 'object',
      properties: {
        pumpId: {
          type: 'string',
          description: 'ID da bomba'
        },
        startDate: {
          type: 'string',
          description: 'Data de início no formato YYYY-MM-DD'
        },
        endDate: {
          type: 'string',
          description: 'Data de fim no formato YYYY-MM-DD'
        }
      },
      required: ['pumpId', 'startDate', 'endDate']
    }
  },
  {
    name: 'getMaintenanceHistory',
    description: 'Obter histórico de manutenções de uma bomba',
    parameters: {
      type: 'object',
      properties: {
        pumpId: {
          type: 'string',
          description: 'ID da bomba'
        }
      },
      required: ['pumpId']
    }
  }
]

// Funções server-side para consultar Supabase
async function getPumpExpenses(pumpId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('pump_id', pumpId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: data || [],
      summary: {
        total: data?.reduce((sum, expense) => sum + expense.value, 0) || 0,
        count: data?.length || 0,
        categories: data?.reduce((acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.value
          return acc
        }, {}) || {}
      }
    }
  } catch (error) {
    console.error('Error fetching pump expenses:', error)
    return { success: false, error: error.message }
  }
}

async function getDieselUsage(pumpId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('pump_diesel_entries')
      .select('*')
      .eq('pump_id', pumpId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: false })

    if (error) throw error

    const totalLiters = data?.reduce((sum, entry) => sum + entry.liters, 0) || 0
    const totalCost = data?.reduce((sum, entry) => sum + entry.cost, 0) || 0

    return {
      success: true,
      data: data || [],
      summary: {
        totalLiters,
        totalCost,
        averageCostPerLiter: totalLiters > 0 ? totalCost / totalLiters : 0,
        entries: data?.length || 0
      }
    }
  } catch (error) {
    console.error('Error fetching diesel usage:', error)
    return { success: false, error: error.message }
  }
}

async function getMaintenanceHistory(pumpId) {
  try {
    const { data, error } = await supabase
      .from('pump_maintenances')
      .select('*')
      .eq('pump_id', pumpId)
      .order('maintenance_date', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: data || [],
      summary: {
        total: data?.reduce((sum, maintenance) => sum + maintenance.value, 0) || 0,
        count: data?.length || 0,
        lastMaintenance: data?.[0] || null
      }
    }
  } catch (error) {
    console.error('Error fetching maintenance history:', error)
    return { success: false, error: error.message }
  }
}

export default async function handler(req, res) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { userId, message } = req.body

    if (!userId || !message) {
      return res.status(400).json({ error: 'userId e message são obrigatórios' })
    }

    // Verificar se a API key do OpenAI está configurada
    if (!process.env.VITE_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key não configurada' })
    }

    // Primeira chamada para OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      functions: FUNCTION_DEFINITIONS,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 1000
    })

    const assistantMessage = completion.choices[0].message

    // Se o modelo quer chamar uma função
    if (assistantMessage.function_call) {
      const { name, arguments: args } = assistantMessage.function_call
      const parsedArgs = JSON.parse(args)

      let functionResult

      // Chamar a função correspondente
      switch (name) {
        case 'getPumpExpenses':
          functionResult = await getPumpExpenses(parsedArgs.pumpId, parsedArgs.startDate, parsedArgs.endDate)
          break
        case 'getDieselUsage':
          functionResult = await getDieselUsage(parsedArgs.pumpId, parsedArgs.startDate, parsedArgs.endDate)
          break
        case 'getMaintenanceHistory':
          functionResult = await getMaintenanceHistory(parsedArgs.pumpId)
          break
        default:
          functionResult = { success: false, error: 'Função não encontrada' }
      }

      // Segunda chamada para OpenAI com o resultado da função
      const finalCompletion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
          { role: 'assistant', content: assistantMessage.content || '', function_call: assistantMessage.function_call },
          { 
            role: 'function', 
            name: name, 
            content: JSON.stringify(functionResult) 
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })

      const finalMessage = finalCompletion.choices[0].message

      return res.status(200).json({
        content: finalMessage.content,
        data: functionResult.success ? functionResult : null
      })
    }

    // Se não há function call, retornar resposta direta
    return res.status(200).json({
      content: assistantMessage.content
    })

  } catch (error) {
    console.error('Error in felix-ia API:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
