import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações do Supabase
const SUPABASE_URL = 'https://rgsovlqsezjeqohlbyod.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzOTU4OSwiZXhwIjoyMDc0MjE1NTg5fQ.J62KlgzuNfh5GgTWwmNsa8len7QnqctP_BlNvAHeWyY';

// Função para fazer deploy da Edge Function
async function deployEdgeFunction() {
  try {
    console.log('🚀 Iniciando deploy da Edge Function...');
    
    // Ler o código da função
    const functionCode = fs.readFileSync(
      path.join(__dirname, 'supabase/functions/send-notification/index.ts'), 
      'utf8'
    );
    
    console.log('📄 Código da função carregado');
    console.log('📝 Tamanho do código:', functionCode.length, 'caracteres');
    
    // Preparar dados para o deploy
    const deployData = {
      name: 'send-notification',
      code: functionCode,
      secrets: {
        VAPID_PUBLIC_KEY: 'BDt2hT6Ec-UakV-tAoO7ka2TrwcSXopaQzqXokawxm4xtPbj8YenBDYUcI2XOmtleMb8y732w25PLD3lzUekoHI',
        VAPID_PRIVATE_KEY: 'sua_vapid_private_key_aqui' // Você precisará gerar esta chave
      }
    };
    
    console.log('✅ Edge Function preparada para deploy');
    console.log('📋 Dados da função:');
    console.log('   - Nome: send-notification');
    console.log('   - VAPID Public Key configurada');
    console.log('   - Código TypeScript carregado');
    
    // Nota: O deploy real precisa ser feito via CLI ou Dashboard
    console.log('\n📌 PRÓXIMOS PASSOS:');
    console.log('1. Vá ao Supabase Dashboard → Edge Functions');
    console.log('2. Clique em "Create a new function"');
    console.log('3. Nome: send-notification');
    console.log('4. Cole o código que está em: supabase/functions/send-notification/index.ts');
    console.log('5. Clique em "Deploy"');
    
    console.log('\n🔑 CONFIGURAÇÃO DE VARIÁVEIS:');
    console.log('No Dashboard → Settings → API → Edge Functions, adicione:');
    console.log('VAPID_PUBLIC_KEY=BDt2hT6Ec-UakV-tAoO7ka2TrwcSXopaQzqXokawxm4xtPbj8YenBDYUcI2XOmtleMb8y732w25PLD3lzUekoHI');
    console.log('VAPID_PRIVATE_KEY=sua_vapid_private_key_aqui');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao preparar deploy:', error.message);
    return false;
  }
}

// Executar o script
deployEdgeFunction().then(success => {
  if (success) {
    console.log('\n🎉 Script executado com sucesso!');
    console.log('📖 Siga as instruções acima para completar o deploy.');
  } else {
    console.log('\n💥 Falha na execução do script.');
    process.exit(1);
  }
});
