// TESTE DIRETO DA EDGE FUNCTION - Sem Supabase Client
// Execute este script no console (qualquer página)

(async function() {
  try {
    console.log('🔍 Testando Edge Function diretamente...');
    
    // Teste direto da Edge Function usando fetch
    const response = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzOTU4OSwiZXhwIjoyMDc0MjE1NTg5fQ.J62KlgzuNfh5GgTWwmNsa8len7QnqctP_BlNvAHeWyY'
      },
      body: JSON.stringify({
        userIds: ['7f8e5032-a10a-4905-85fe-78cca2b29e05'],
        title: '🎉 Teste Direto da Edge Function!',
        body: 'Testando sem usar o cliente Supabase...',
        data: {
          type: 'direct_test',
          timestamp: new Date().toISOString()
        },
        url: '/'
      })
    });
    
    console.log('📱 Status da resposta:', response.status);
    console.log('📱 Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('📱 Resultado completo:', result);
    
    if (response.ok) {
      if (result.success > 0) {
        alert('🎉 SUCESSO TOTAL!\n\n' +
              `✅ Notificações processadas: ${result.success}\n` +
              `❌ Falhas: ${result.failed}\n\n` +
              'A Edge Function está funcionando perfeitamente!');
      } else if (result.message) {
        alert('⚠️ RESPOSTA DA FUNÇÃO\n\n' +
              `Mensagem: ${result.message}\n\n` +
              'A função está funcionando, mas não encontrou tokens ativos.\n' +
              'Verifique se o token foi salvo corretamente no banco.');
      } else {
        alert('❓ RESPOSTA INESPERADA\n\n' +
              `Resultado: ${JSON.stringify(result)}\n\n` +
              'Verifique os logs da Edge Function no Supabase Dashboard.');
      }
    } else {
      alert('❌ ERRO HTTP\n\n' +
            `Status: ${response.status}\n` +
            `Resultado: ${JSON.stringify(result)}\n\n` +
            'Verifique os logs da Edge Function.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    
    if (error.message.includes('CORS')) {
      alert('❌ ERRO CORS\n\n' +
            'Ainda há problemas de CORS com a Edge Function.\n\n' +
            'Verifique se:\n' +
            '1. A Edge Function foi deployada corretamente\n' +
            '2. As configurações de CORS estão corretas\n' +
            '3. A função está respondendo ao OPTIONS');
    } else {
      alert('❌ Erro: ' + error.message);
    }
  }
})();
