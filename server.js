import express from 'express'
import cors from 'cors'
import { createRequire } from 'module'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' })

const require = createRequire(import.meta.url)
const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Modo de teste (sem OpenAI)
const TEST_MODE = process.env.TEST_MODE === 'true' || !process.env.VITE_OPENAI_API_KEY

// Simular respostas da IA para testes
const MOCK_RESPONSES = {
  'teste': 'Olá! Sou o Felix IA em modo de teste. Como posso ajudá-lo com análises de bombas e custos?',
  'gastos': 'Em modo de teste, posso simular análises de gastos. Para dados reais, configure sua chave da OpenAI.',
  'manutenção': 'Histórico de manutenções disponível em modo de teste. Configure OpenAI para análises detalhadas.'
}

// Importar a função do Felix IA
let felixIAHandler
if (!TEST_MODE) {
  try {
    const felixIAModule = await import('./api/felix-ia.js')
    felixIAHandler = felixIAModule.default
  } catch (error) {
    console.error('Erro ao importar módulo Felix IA:', error)
  }
}

// Simular Vercel Request/Response para nossa função
app.post('/api/felix-ia', async (req, res) => {
  try {
    const { userId, message } = req.body

    if (!userId || !message) {
      return res.status(400).json({ error: 'userId e message são obrigatórios' })
    }

    // Modo de teste
    if (TEST_MODE) {
      const response = MOCK_RESPONSES[message.toLowerCase()] || 
        `Modo de teste ativo! Mensagem recebida: "${message}". Configure VITE_OPENAI_API_KEY para usar a IA real.`
      
      return res.status(200).json({
        content: response,
        testMode: true
      })
    }

    // Modo normal com OpenAI
    if (!felixIAHandler) {
      return res.status(500).json({ error: 'Módulo Felix IA não carregado' })
    }

    // Converter Express req/res para formato Vercel
    const vercelReq = {
      method: req.method,
      body: req.body,
      headers: req.headers,
      query: req.query,
      url: req.url
    }

    const vercelRes = {
      status: (code) => ({
        json: (data) => {
          res.status(code).json(data)
        }
      })
    }

    await felixIAHandler(vercelReq, vercelRes)
  } catch (error) {
    console.error('Error in API handler:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor de API rodando em http://localhost:${PORT}`)
  console.log(`📡 Endpoint Felix IA: http://localhost:${PORT}/api/felix-ia`)
  console.log(`🧪 Modo de teste: ${TEST_MODE ? 'ATIVO' : 'DESATIVADO'}`)
  if (TEST_MODE) {
    console.log(`💡 Configure VITE_OPENAI_API_KEY para usar a IA real`)
  }
})
