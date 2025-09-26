/**
 * Arquivo de teste para a função notes-generate
 * Execute com: npm test
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

// Dados de teste
const testPayload = {
  report_id: '123e4567-e89b-12d3-a456-426614174000',
  company_logo: 'felixmix',
  phone: '44 99999-9999',
  nf_date: '2025-09-25',
  nf_due_date: '2025-10-10',
  company_name: 'Cliente Teste Ltda',
  address: 'Rua das Flores, 123',
  cnpj_cpf: '00.000.000/0001-00',
  city: 'Maringá',
  cep: '87000-000',
  uf: 'PR',
  nf_value: 15000.00,
  descricao: 'Serviço de bombeamento de concreto',
  obs: 'Observações de teste'
};

const testToken = 'JUx6NboSBT0HPf1gfNuFpG/wzB33vvgiPBeWnZy8iFIlsRvLwP8fwJK5v+u+XBQGC99wpezsLHpXQg/xupY1qg=='; // Substitua pelo token real

async function testHealthCheck() {
  try {
    console.log('🔍 Testando health check...');
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Health check OK:', data);
      return true;
    } else {
      console.log('❌ Health check falhou:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no health check:', error.message);
    return false;
  }
}

async function testNotesGenerate() {
  try {
    console.log('🔍 Testando geração de nota...');
    
    const response = await fetch(`${BASE_URL}/api/notes/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Nota gerada com sucesso!');
      console.log('📄 Dados da nota:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log('❌ Erro na geração da nota:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes da função notes-generate...\n');
  
  // Teste 1: Health check
  const healthOk = await testHealthCheck();
  console.log('');
  
  if (!healthOk) {
    console.log('❌ Servidor não está rodando. Execute: npm start');
    return;
  }
  
  // Teste 2: Geração de nota (requer token válido)
  if (testToken === 'YOUR_JWT_TOKEN_HERE') {
    console.log('⚠️ Token JWT não configurado. Configure testToken no arquivo test.js');
    console.log('📝 Para testar a geração de nota, você precisa:');
    console.log('   1. Fazer login no sistema');
    console.log('   2. Obter um JWT token válido');
    console.log('   3. Substituir testToken no arquivo test.js');
    console.log('   4. Executar novamente: npm test');
    return;
  }
  
  await testNotesGenerate();
  
  console.log('\n✅ Testes concluídos!');
}

// Executar testes
runTests().catch(console.error);
