// TESTE COM CORREÇÃO DE CORS
// Execute este script no console

(async function() {
  try {
    console.log('🧪 Teste com correção de CORS...');
    
    // Primeiro, testar se a Edge Function está respondendo
    console.log('📡 Testando preflight OPTIONS...');
    const preflightResponse = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/send-notification', {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzOTU4OSwiZXhwIjoyMDc0MjE1NTg5fQ.J62KlgzuNfh5GgTWwmNsa8len7QnqctP_BlNvAHeWyY'
      }
    });
    
    console.log('📡 Preflight status:', preflightResponse.status);
    console.log('📡 Preflight headers:', Object.fromEntries(preflightResponse.headers.entries()));
    
    if (!preflightResponse.ok) {
      alert('❌ PROBLEMA DE CORS\n\n' +
            'Status: ' + preflightResponse.status + '\n' +
            'A Edge Function não está respondendo corretamente ao preflight.\n\n' +
            'Verifique se a Edge Function foi redeployada com as correções de CORS.');
      return;
    }
    
    // Agora testar o POST
    console.log('📱 Testando POST...');
    const response = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzOTU4OSwiZXhwIjoyMDc0MjE1NTg5fQ.J62KlgzuNfh5GgTWwmNsa8len7QnqctP_BlNvAHeWyY'
      },
      body: JSON.stringify({
        userIds: ['7f8e5032-a10a-4905-85fe-78cca2b29e05'],
        title: '🎉 Teste CORS Corrigido!',
        body: 'Agora o CORS está funcionando corretamente!',
        data: {
          type: 'cors_test',
          timestamp: new Date().toISOString()
        },
        url: '/'
      })
    });
    
    console.log('📱 POST status:', response.status);
    console.log('📱 POST headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('📱 Resultado:', result);
    
    if (result.success > 0) {
      alert('🎉 SUCESSO! CORS CORRIGIDO!\n\n' +
            `✅ Sucessos: ${result.success}\n` +
            `❌ Falhas: ${result.failed}\n\n` +
            'Notificações push funcionando!');
    } else {
      alert('❌ AINDA COM PROBLEMA\n\n' +
            `Status: ${response.status}\n` +
            `Resultado: ${JSON.stringify(result)}\n\n` +
            'Verifique os logs da Edge Function.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    alert('❌ Erro: ' + error.message + '\n\n' +
          'Verifique se a Edge Function foi redeployada.');
  }
})();
