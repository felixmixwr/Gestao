// Script simplificado para testar notificações
// Execute no console do navegador

async function testSimpleNotification() {
  try {
    console.log('🧪 Testando notificação simples...');
    
    // Verificar se há subscription ativa
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.error('❌ Service Worker não registrado');
      return;
    }
    
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      console.error('❌ Push subscription não encontrada');
      return;
    }
    
    console.log('✅ Subscription encontrada:', subscription.endpoint);
    
    // Enviar notificação de teste
    const response = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2Mzk1ODksImV4cCI6MjA3NDIxNTU4OX0.2mX7bKdKjKjKjKjKjKjKjKjKjKjKjKjKjKjKjKjKjKjK'
      },
      body: JSON.stringify({
        userIds: ['7f8e5032-a10a-4905-85fe-78cca2b29e05'],
        title: '🧪 Teste de Notificação',
        body: 'Esta é uma notificação de teste!',
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        },
        url: '/'
      })
    });
    
    const result = await response.json();
    console.log('📱 Resultado da notificação:', result);
    
    if (result.success > 0) {
      alert('✅ Notificação enviada com sucesso!');
    } else {
      alert('❌ Falha ao enviar notificação: ' + JSON.stringify(result));
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    alert('❌ Erro: ' + error.message);
  }
}

// Executar teste
testSimpleNotification();
