// Script para testar integração completa de notificações
import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const SUPABASE_URL = 'https://rgsovlqsezjeqohlbyod.supabase.co'
const SUPABASE_ANON_KEY = 'sua_anon_key_aqui' // Você precisa me passar esta chave

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testNotificationIntegration() {
  console.log('🔍 Testando integração de notificações...')
  
  try {
    // 1. Verificar se as tabelas existem
    console.log('\n📊 Verificando tabelas...')
    
    const { data: logsData, error: logsError } = await supabase
      .from('notification_logs')
      .select('count')
      .limit(1)
    
    if (logsError) {
      console.error('❌ Erro na tabela notification_logs:', logsError.message)
    } else {
      console.log('✅ Tabela notification_logs: OK')
    }
    
    const { data: tokensData, error: tokensError } = await supabase
      .from('user_push_tokens')
      .select('count')
      .limit(1)
    
    if (tokensError) {
      console.error('❌ Erro na tabela user_push_tokens:', tokensError.message)
    } else {
      console.log('✅ Tabela user_push_tokens: OK')
    }
    
    // 2. Verificar estrutura das tabelas
    console.log('\n🔧 Verificando estrutura das tabelas...')
    
    const { data: logsStructure } = await supabase
      .from('notification_logs')
      .select('*')
      .limit(1)
    
    if (logsStructure && logsStructure.length > 0) {
      console.log('✅ Estrutura notification_logs:', Object.keys(logsStructure[0]))
    }
    
    const { data: tokensStructure } = await supabase
      .from('user_push_tokens')
      .select('*')
      .limit(1)
    
    if (tokensStructure && tokensStructure.length > 0) {
      console.log('✅ Estrutura user_push_tokens:', Object.keys(tokensStructure[0]))
    }
    
    // 3. Testar Edge Function
    console.log('\n🚀 Testando Edge Function...')
    
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        userIds: ['test-user-id'],
        title: 'Teste de Integração',
        body: 'Verificando se a Edge Function está funcionando',
        data: { type: 'integration_test' }
      }
    })
    
    if (error) {
      console.error('❌ Erro na Edge Function:', error.message)
    } else {
      console.log('✅ Edge Function respondeu:', data)
    }
    
    console.log('\n🎉 Teste de integração concluído!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testNotificationIntegration()
