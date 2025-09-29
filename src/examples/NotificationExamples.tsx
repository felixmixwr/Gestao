import { useSendNotification } from '../hooks/useSendNotification'
import { useNotifications } from '../hooks/useNotifications'

// Exemplo de como usar as notificações push no seu componente
export function ExampleNotificationUsage() {
  const { 
    sendProgramacaoNotification,
    sendReportNotification,
    sendFinanceiroNotification,
    sendBombaNotification 
  } = useSendNotification()

  const { 
    isSupported, 
    permission, 
    initializeNotifications,
    sendLocalNotification 
  } = useNotifications()

  // Exemplo: Enviar notificação quando criar uma programação
  const handleCreateProgramacao = async (programacaoData: any) => {
    try {
      // Sua lógica de criação aqui...
      console.log('Criando programação:', programacaoData)
      
      // Enviar notificação push
      const result = await sendProgramacaoNotification(programacaoData)
      
      if (result.success) {
        console.log('Notificação enviada com sucesso!')
      } else {
        console.error('Erro ao enviar notificação:', result.error)
      }
    } catch (error) {
      console.error('Erro ao criar programação:', error)
    }
  }

  // Exemplo: Enviar notificação quando criar um relatório
  const handleCreateReport = async (reportData: any) => {
    try {
      // Sua lógica de criação aqui...
      console.log('Criando relatório:', reportData)
      
      // Enviar notificação push
      const result = await sendReportNotification(reportData)
      
      if (result.success) {
        console.log('Notificação de relatório enviada!')
      }
    } catch (error) {
      console.error('Erro ao criar relatório:', error)
    }
  }

  // Exemplo: Enviar notificação quando atualizar dados financeiros
  const handleUpdateFinanceiro = async (financeiroData: any) => {
    try {
      // Sua lógica de atualização aqui...
      console.log('Atualizando dados financeiros:', financeiroData)
      
      // Enviar notificação push
      const result = await sendFinanceiroNotification(financeiroData)
      
      if (result.success) {
        console.log('Notificação financeira enviada!')
      }
    } catch (error) {
      console.error('Erro ao atualizar financeiro:', error)
    }
  }

  // Exemplo: Enviar notificação quando atualizar bomba
  const handleUpdateBomba = async (bombaData: any) => {
    try {
      // Sua lógica de atualização aqui...
      console.log('Atualizando bomba:', bombaData)
      
      // Enviar notificação push
      const result = await sendBombaNotification(bombaData)
      
      if (result.success) {
        console.log('Notificação de bomba enviada!')
      }
    } catch (error) {
      console.error('Erro ao atualizar bomba:', error)
    }
  }

  // Exemplo: Enviar notificação local para testes
  const handleTestLocalNotification = () => {
    if (permission === 'granted') {
      sendLocalNotification({
        title: 'Teste de Notificação',
        body: 'Esta é uma notificação de teste local',
        icon: '/icons/notification.png',
        url: '/programacao'
      })
    } else {
      console.log('Permissão de notificação não concedida')
    }
  }

  // Exemplo: Inicializar notificações quando o componente monta
  useEffect(() => {
    if (isSupported && permission === 'default') {
      initializeNotifications()
    }
  }, [isSupported, permission, initializeNotifications])

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Exemplos de Notificações</h2>
      
      <div className="space-y-2">
        <p><strong>Suporte:</strong> {isSupported ? '✅ Suportado' : '❌ Não suportado'}</p>
        <p><strong>Permissão:</strong> {permission}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => handleCreateProgramacao({ id: 1, cliente: 'Cliente Teste' })}
          className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Testar Programação
        </button>
        
        <button 
          onClick={() => handleCreateReport({ id: 1, titulo: 'Relatório Teste' })}
          className="p-3 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Testar Relatório
        </button>
        
        <button 
          onClick={() => handleUpdateFinanceiro({ id: 1, descricao: 'Movimentação Teste' })}
          className="p-3 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Testar Financeiro
        </button>
        
        <button 
          onClick={() => handleUpdateBomba({ id: 1, nome: 'Bomba Teste' })}
          className="p-3 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Testar Bomba
        </button>
        
        <button 
          onClick={handleTestLocalNotification}
          className="p-3 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Teste Local
        </button>
        
        <button 
          onClick={initializeNotifications}
          className="p-3 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Inicializar Notificações
        </button>
      </div>
    </div>
  )
}

// Exemplo de integração em componentes existentes
export function ProgramacaoFormWithNotifications() {
  const { sendProgramacaoNotification } = useSendNotification()

  const handleSubmit = async (formData: any) => {
    try {
      // Sua lógica de submit aqui...
      const response = await fetch('/api/programacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        // Enviar notificação de sucesso
        await sendProgramacaoNotification({
          id: result.id,
          cliente: formData.cliente,
          data: formData.data,
          hora: formData.hora
        })
        
        // Mostrar toast de sucesso
        console.log('Programação criada com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao criar programação:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Seus campos de formulário aqui */}
      <button type="submit">Criar Programação</button>
    </form>
  )
}
