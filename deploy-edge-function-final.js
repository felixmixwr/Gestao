// Script para redeploy da Edge Function com variáveis de ambiente corretas

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://rgsovlqsezjeqohlbyod.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzOTU4OSwiZXhwIjoyMDc0MjE1NTg5fQ.J62KlgzuNfh5GgTWwmNsa8len7QnqctP_BlNvAHeWyY';

async function deployEdgeFunction() {
  try {
    console.log('🚀 Fazendo redeploy da Edge Function...');
    
    // Criar cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Ler o código da Edge Function
    const functionCode = fs.readFileSync('supabase/functions/send-notification/index.ts', 'utf8');
    
    // Deploy da função
    const { data, error } = await supabase.functions.deploy('send-notification', {
      code: functionCode,
      secrets: {
        SUPABASE_URL: SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY,
        VAPID_PUBLIC_KEY: 'BBNAVQi46g1rgjQ2nF9kkDt--WPXzFFVIhQm5D9UvAGlAfO1sCORVCnd6MFpEABZvy0PuyECaXL-WxAzuILcnpA',
        VAPID_PRIVATE_KEY: 'YOUR_VAPID_PRIVATE_KEY_HERE' // Substitua pela chave privada real
      }
    });
    
    if (error) {
      console.error('❌ Erro no deploy:', error);
      return;
    }
    
    console.log('✅ Edge Function redeployada com sucesso!');
    console.log('📱 Dados:', data);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

deployEdgeFunction();
