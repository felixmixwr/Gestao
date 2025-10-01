// TESTE DIRETO DA EDGE FUNCTION - Sem CORS
// Execute este script no console

(async function() {
  try {
    console.log('🔍 Testando Edge Function diretamente...');
    
    // Teste 1: Verificar se a Edge Function existe
    console.log('📡 Teste 1: Verificando se a função existe...');
    try {
      const testResponse = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/send-notification', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzOTU4OSwiZXhwIjoyMDc0MjE1NTg5fQ.J62KlgzuNfh5GgTWwmNsa8len7QnqctP_BlNvAHeWyY'
        }
      });
      console.log('📡 GET Status:', testResponse.status);
      console.log('📡 GET Headers:', Object.fromEntries(testResponse.headers.entries()));
    } catch (error) {
      console.error('❌ Erro no GET:', error);
    }
    
    // Teste 2: Verificar OPTIONS
    console.log('📡 Teste 2: Verificando OPTIONS...');
    try {
      const optionsResponse = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/send-notification', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://www.felixmix.com.br',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization, content-type'
        }
      });
      console.log('📡 OPTIONS Status:', optionsResponse.status);
      console.log('📡 OPTIONS Headers:', Object.fromEntries(optionsResponse.headers.entries()));
    } catch (error) {
      console.error('❌ Erro no OPTIONS:', error);
    }
    
    // Teste 3: POST sem CORS (usando no-cors)
    console.log('📡 Teste 3: POST com no-cors...');
    try {
      const noCorsResponse = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/send-notification', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzOTU4OSwiZXhwIjoyMDc0MjE1NTg5fQ.J62KlgzuNfh5GgTWwmNsa8len7QnqctP_BlNvAHeWyY'
        },
        body: JSON.stringify({
          userIds: ['7f8e5032-a10a-4905-85fe-78cca2b29e05'],
          title: '🔍 Teste No-CORS',
          body: 'Testando sem CORS...',
          data: { type: 'no_cors_test' }
        })
      });
      console.log('📡 No-CORS Status:', noCorsResponse.status);
      console.log('📡 No-CORS Type:', noCorsResponse.type);
    } catch (error) {
      console.error('❌ Erro no no-cors:', error);
    }
    
    // Teste 4: Verificar se a função está realmente deployada
    console.log('📡 Teste 4: Verificando deploy...');
    try {
      const deployTest = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzOTU4OSwiZXhwIjoyMDc0MjE1NTg5fQ.J62KlgzuNfh5GgTWwmNsa8len7QnqctP_BlNvAHeWyY'
        }
      });
      console.log('📡 Functions Status:', deployTest.status);
      if (deployTest.ok) {
        const functionsList = await deployTest.text();
        console.log('📡 Functions List:', functionsList);
      }
    } catch (error) {
      console.error('❌ Erro ao listar functions:', error);
    }
    
    alert('🔍 DIAGNÓSTICO CONCLUÍDO\n\nVerifique o console para detalhes completos.\n\nSe todos os testes falharam, a Edge Function pode não estar deployada corretamente.');
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    alert('❌ Erro no diagnóstico: ' + error.message);
  }
})();
