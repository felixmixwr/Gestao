// TESTE VIA SUPABASE CLIENT - Sem CORS
// Execute este script no console (página principal do app)

(async function() {
  try {
    console.log('🔍 Testando via Supabase Client...');
    
    // Verificar se supabase está disponível
    if (typeof supabase === 'undefined') {
      alert('❌ Supabase não encontrado. Execute este script na página principal do app.');
      return;
    }
    
    console.log('✅ Supabase client encontrado');
    
    // Testar a Edge Function via Supabase client
    console.log('📱 Invocando Edge Function via Supabase...');
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        userIds: ['7f8e5032-a10a-4905-85fe-78cca2b29e05'],
        title: '🎉 Teste via Supabase Client!',
        body: 'Testando notificação através do cliente Supabase...',
        data: {
          type: 'supabase_client_test',
          timestamp: new Date().toISOString()
        },
        url: '/'
      }
    });
    
    console.log('📱 Resultado:', { data, error });
    
    if (error) {
      console.error('❌ Erro da Edge Function:', error);
      alert('❌ ERRO DA EDGE FUNCTION\n\n' +
            `Código: ${error.status}\n` +
            `Mensagem: ${error.message}\n\n` +
            'Verifique se a Edge Function está deployada corretamente.');
      return;
    }
    
    if (data && data.success > 0) {
      alert('🎉 SUCESSO VIA SUPABASE CLIENT!\n\n' +
            `✅ Sucessos: ${data.success}\n` +
            `❌ Falhas: ${data.failed}\n\n` +
            'Notificações funcionando através do cliente Supabase!');
    } else {
      alert('❌ SEM SUCESSO\n\n' +
            `Resultado: ${JSON.stringify(data)}\n\n` +
            'Verifique se o token está salvo no banco.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
    alert('❌ Erro: ' + error.message);
  }
})();
