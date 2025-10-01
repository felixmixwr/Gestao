// TESTE SIMPLES - Sem usar supabase global
// Execute este script no console

(async function() {
  try {
    console.log('🧪 Teste simples de notificação...');
    
    // Teste direto da Edge Function
    const response = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzOTU4OSwiZXhwIjoyMDc0MjE1NTg5fQ.J62KlgzuNfh5GgTWwmNsa8len7QnqctP_BlNvAHeWyY'
      },
      body: JSON.stringify({
        userIds: ['7f8e5032-a10a-4905-85fe-78cca2b29e05'],
        title: '🎉 Teste Simples - Notificações',
        body: 'Teste direto da Edge Function funcionando!',
        data: {
          type: 'test_simples',
          timestamp: new Date().toISOString()
        },
        url: '/'
      })
    });
    
    const result = await response.json();
    console.log('📱 Resultado:', result);
    
    if (result.success > 0) {
      alert('🎉 TESTE SIMPLES BEM-SUCEDIDO!\n\n' + 
            `✅ Sucessos: ${result.success}\n` +
            `❌ Falhas: ${result.failed}\n\n` +
            'Sistema de notificações funcionando!');
    } else {
      alert('❌ TESTE SIMPLES FALHOU\n\n' + 
            `Detalhes: ${JSON.stringify(result)}\n\n` +
            'Verifique se o token foi salvo no banco.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    alert('❌ Erro: ' + error.message);
  }
})();
