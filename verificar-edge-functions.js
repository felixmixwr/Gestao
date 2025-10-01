// Script para verificar se a Edge Function existe
// Execute no console

(async function() {
  try {
    console.log('🔍 Verificando Edge Functions...');
    
    // Verificar se supabase está disponível
    if (typeof supabase === 'undefined') {
      alert('❌ Supabase não encontrado. Execute na página principal.');
      return;
    }
    
    console.log('✅ Supabase client encontrado');
    
    // Listar todas as Edge Functions
    console.log('📋 Listando Edge Functions...');
    try {
      // Tentar acessar a lista de functions
      const response = await fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzOTU4OSwiZXhwIjoyMDc0MjE1NTg5fQ.J62KlgzuNfh5GgTWwmNsa8len7QnqctP_BlNvAHeWyY'
        }
      });
      
      console.log('📋 Status da lista:', response.status);
      if (response.ok) {
        const text = await response.text();
        console.log('📋 Resposta:', text);
      } else {
        console.log('❌ Erro ao listar functions:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Erro ao listar functions:', error);
    }
    
    // Testar se a função send-notification existe
    console.log('📱 Testando função send-notification...');
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          userIds: ['test'],
          title: 'Teste',
          body: 'Teste'
        }
      });
      
      console.log('📱 Resultado do teste:', { data, error });
      
      if (error) {
        console.log('📱 Erro da função:', error);
        if (error.message.includes('not found') || error.message.includes('404')) {
          alert('❌ EDGE FUNCTION NÃO ENCONTRADA\n\n' +
                'A função "send-notification" não está deployada no seu projeto Supabase.\n\n' +
                'Você precisa:\n' +
                '1. Ir para o Supabase Dashboard\n' +
                '2. Edge Functions → Create Function\n' +
                '3. Criar a função "send-notification"');
        } else {
          alert('❌ ERRO NA EDGE FUNCTION\n\n' + error.message);
        }
      } else {
        alert('✅ EDGE FUNCTION EXISTE\n\nA função está deployada e funcionando!');
      }
    } catch (error) {
      console.error('❌ Erro ao testar função:', error);
      alert('❌ ERRO AO TESTAR\n\n' + error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    alert('❌ Erro: ' + error.message);
  }
})();
