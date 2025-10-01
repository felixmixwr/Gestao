// TESTE COM JWT CORRETO - Execute no console do dashboard
// Este script usa o JWT do usuário logado

(async function() {
  try {
    console.log('🧪 Testando notificação com JWT correto...');
    
    // Obter o JWT do usuário logado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.access_token) {
      alert('❌ Usuário não está logado ou sessão inválida');
      return;
    }
    
    console.log('✅ JWT obtido do usuário logado');
    
    const response = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        userIds: ['7f8e5032-a10a-4905-85fe-78cca2b29e05'],
        title: '🎉 Teste Final - Notificações Push',
        body: 'Parabéns! O sistema de notificações está funcionando perfeitamente!',
        data: {
          type: 'test_final',
          timestamp: new Date().toISOString(),
          message: 'Sistema de notificações operacional'
        },
        url: '/'
      })
    });
    
    const result = await response.json();
    console.log('📱 Resultado do teste:', result);
    
    if (result.success > 0) {
      alert('🎉 TESTE BEM-SUCEDIDO!\n\n' + 
            `Notificação enviada com sucesso!\n` +
            `✅ Sucessos: ${result.success}\n` +
            `❌ Falhas: ${result.failed}\n\n` +
            'O sistema de notificações está 100% funcional!');
    } else {
      alert('❌ TESTE FALHOU\n\n' + 
            `Detalhes: ${JSON.stringify(result)}\n\n` +
            'Verifique o console para mais informações.');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    alert('❌ Erro: ' + error.message);
  }
})();
