import { useEffect, useState } from 'react'
// import { supabase } from '../lib/supabase' // Removido import não utilizado
import { createTables, testConnection, getSetupInstructions } from '../lib/simple-db-setup'
import { Layout } from '../components/Layout'
import { Button } from '../components/Button'
import { useToast } from '../lib/toast-hooks'

export default function Test() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()

  useEffect(() => {
    testConnectionHandler()
  }, [])

  const testConnectionHandler = async () => {
    try {
      setConnectionStatus('checking')
      const result = await testConnection()
      
      if (result.success) {
        setConnectionStatus('connected')
        setError(null)
        addToast({ message: 'Conexão com Supabase funcionando!', type: 'success' })
      } else {
        throw new Error(result.error as string)
      }
    } catch (err: any) {
      setConnectionStatus('error')
      setError(err.message)
      addToast({ message: `Erro na conexão: ${err.message}`, type: 'error' })
    }
  }

  const setupDb = async () => {
    try {
      setConnectionStatus('checking')
      addToast({ message: 'Configurando banco de dados...', type: 'info' })
      
      const result = await createTables()
      
      if (result.success) {
        setConnectionStatus('connected')
        setError(null)
        addToast({ message: 'Banco de dados configurado com sucesso!', type: 'success' })
      } else {
        throw new Error(result.error as string)
      }
    } catch (err: any) {
      setConnectionStatus('error')
      setError(err.message)
      addToast({ message: `Erro na configuração: ${err.message}`, type: 'error' })
    }
  }

  const showInstructions = async () => {
    const instructions = await getSetupInstructions()
    addToast({ 
      message: 'Instruções no console do navegador', 
      type: 'info',
      duration: 10000
    })
    console.log(instructions.message)
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'checking': return 'text-yellow-600'
      case 'connected': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'checking': return 'Verificando conexão...'
      case 'connected': return 'Conectado com sucesso!'
      case 'error': return 'Erro na conexão'
      default: return 'Desconhecido'
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Teste de Conexão
            </h2>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Status da Conexão
                </h3>
                <p className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </p>
                {error && (
                  <p className="text-sm text-red-600 mt-2">
                    Erro: {error}
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <Button onClick={testConnectionHandler} loading={connectionStatus === 'checking'}>
                  Testar Conexão
                </Button>
                <Button 
                  onClick={setupDb} 
                  loading={connectionStatus === 'checking'}
                  variant="secondary"
                >
                  Configurar Banco
                </Button>
                <Button 
                  onClick={showInstructions}
                  variant="outline"
                >
                  Ver Instruções
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-2">
                  Informações do Ambiente
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Supabase URL:</span> 
                    <span className="ml-2 text-gray-600">
                      {import.meta.env.VITE_SUPABASE_URL ? 'Configurada' : 'Não configurada'}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Supabase Key:</span> 
                    <span className="ml-2 text-gray-600">
                      {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada'}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Empresa Principal:</span> 
                    <span className="ml-2 text-gray-600">
                      {import.meta.env.VITE_OWNER_COMPANY_NAME}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Empresa Secundária:</span> 
                    <span className="ml-2 text-gray-600">
                      {import.meta.env.VITE_SECOND_COMPANY_NAME}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
