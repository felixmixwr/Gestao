// Script para diagnosticar a Edge Function
// Execute no console

(async function() {
  try {
    console.log('🔍 Diagnosticando Edge Function...');
    
    // Teste 1: Verificar se a Edge Function está respondendo
    console.log('📡 Teste 1: Verificando se a Edge Function responde...');
    const testResponse = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzOTU4OSwiZXhwIjoyMDc0MjE1NTg5fQ.J62KlgzuNfh5GgTWwmNsa8len7QnqctP_BlNvAHeWyY'
      },
      body: JSON.stringify({
        userIds: ['7f8e5032-a10a-4905-85fe-78cca2b29e05'],
        title: '🔍 Teste de Diagnóstico',
        body: 'Testando conexão com banco de dados...',
        data: {
          type: 'diagnostic',
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const testResult = await testResponse.json();
    console.log('📱 Resultado do diagnóstico:', testResult);
    
    // Teste 2: Verificar logs da Edge Function
    console.log('📋 Teste 2: Verificando logs...');
    const logsResponse = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/send-notification/logs', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzOTU4OSwiZXhwIjoyMDc0MjE1NTg5fQ.J62KlgzuNfh5GgTWwmNsa8len7QnqctP_BlNvAHeWyY'
      }
    });
    
    if (logsResponse.ok) {
      const logs = await logsResponse.json();
      console.log('📝 Logs da Edge Function:', logs);
    } else {
      console.log('⚠️ Não foi possível acessar logs');
    }
    
    // Teste 3: Verificar se o problema é com o user_id
    console.log('👤 Teste 3: Testando com todos os usuários...');
    const allUsersResponse = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzOTU4OSwiZXhwIjoyMDc0MjE1NTg5fQ.J62KlgzuNfh5GgTWwmNsa8len7QnqctP_BlNvAHeWyY'
      },
      body: JSON.stringify({
        userIds: [], // Array vazio para buscar todos os usuários
        title: '🔍 Teste Global',
        body: 'Testando envio para todos os usuários ativos...',
        data: {
          type: 'global_test',
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const allUsersResult = await allUsersResponse.json();
    console.log('🌍 Resultado do teste global:', allUsersResult);
    
    // Resumo do diagnóstico
    console.log('📊 RESUMO DO DIAGNÓSTICO:');
    console.log('- Edge Function responde:', testResponse.ok);
    console.log('- Status do teste:', testResponse.status);
    console.log('- Resultado:', testResult);
    
    alert('🔍 DIAGNÓSTICO CONCLUÍDO\n\n' +
          'Verifique o console para detalhes completos.\n\n' +
          'Resultado: ' + JSON.stringify(testResult));
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    alert('❌ Erro no diagnóstico: ' + error.message);
  }
})();
