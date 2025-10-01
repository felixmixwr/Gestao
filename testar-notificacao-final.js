// 🎯 TESTE FINAL COM USER ID CORRETO
// Execute este script no console (qualquer página)

(async function() {
  try {
    console.log('🎯 TESTE FINAL - User ID Correto...');
    console.log('🔍 User ID correto: bc1e8df8-08da-4520-98ef-2d0755300049');
    
    const response = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzOTU4OSwiZXhwIjoyMDc0MjE1NTg5fQ.J62KlgzuNfh5GgTWwmNsa8len7QnqctP_BlNvAHeWyY'
      },
      body: JSON.stringify({
        userIds: ['bc1e8df8-08da-4520-98ef-2d0755300049'], // ✅ User ID CORRETO
        title: '🎉 TESTE FINAL - SUCESSO!',
        body: 'Notificação push funcionando perfeitamente!',
        data: {
          type: 'final_test_success',
          timestamp: new Date().toISOString(),
          test: 'user_id_correto'
        },
        url: '/'
      })
    });
    
    console.log('📱 Status da resposta:', response.status);
    console.log('📱 Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('🎯 Resultado final:', result);
    
    if (response.ok) {
      if (result.success > 0) {
        alert('🎉 SUCESSO TOTAL!\n\n' +
              `✅ Notificações enviadas: ${result.success}\n` +
              `❌ Falhas: ${result.failed}\n\n` +
              '🎯 O sistema de notificações push está 100% funcional!\n' +
              '📱 Você deve receber a notificação no seu dispositivo.\n\n' +
              'O problema era o User ID incorreto.\n' +
              'Agora está usando o ID correto: bc1e8df8-08da-4520-98ef-2d0755300049');
      } else if (result.message) {
        alert('⚠️ RESPOSTA DA FUNÇÃO\n\n' +
              `Mensagem: ${result.message}\n\n` +
              'A função está funcionando, mas ainda não encontrou tokens.\n' +
              'Verifique se o token está ativo no banco.');
      } else {
        alert('❓ RESPOSTA INESPERADA\n\n' +
              `Resultado: ${JSON.stringify(result)}\n\n` +
              'Verifique os logs da Edge Function.');
      }
    } else {
      alert('❌ ERRO HTTP\n\n' +
            `Status: ${response.status}\n` +
            `Resultado: ${JSON.stringify(result)}\n\n` +
            'Verifique os logs da Edge Function.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    alert('❌ Erro: ' + error.message);
  }
})();
