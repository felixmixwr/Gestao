// Script para testar criação de eventos diretamente
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rgsovlqsezjeqohlbyod.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3NjQ2MjQsImV4cCI6MjA1MDM0MDYyNH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8' // Substitua pela sua chave real

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarCriacaoEvento() {
  try {
    console.log('🔍 Testando criação de evento...')
    
    // 1. Verificar se usuário está autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Erro ao obter usuário:', userError)
      return
    }
    
    if (!user) {
      console.error('❌ Usuário não autenticado')
      return
    }
    
    console.log('✅ Usuário autenticado:', user.id)
    
    // 2. Verificar se categorias existem
    const { data: categorias, error: catError } = await supabase
      .from('task_categories')
      .select('*')
    
    if (catError) {
      console.error('❌ Erro ao buscar categorias:', catError)
      return
    }
    
    console.log('📋 Categorias encontradas:', categorias?.length || 0)
    console.log('📋 Categorias:', categorias)
    
    // 3. Tentar criar um evento simples
    const eventData = {
      user_id: user.id,
      title: '💰 Teste de Pagamento: R$ 100,00',
      description: 'Teste de criação de evento de pagamento',
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      category_id: categorias?.[0]?.id || null,
      reminder: true
    }
    
    console.log('📝 Dados do evento:', eventData)
    
    const { data: evento, error: eventError } = await supabase
      .from('user_calendar_events')
      .insert(eventData)
      .select()
      .single()
    
    if (eventError) {
      console.error('❌ Erro ao criar evento:', eventError)
      console.error('❌ Detalhes do erro:', {
        message: eventError.message,
        details: eventError.details,
        hint: eventError.hint,
        code: eventError.code
      })
      return
    }
    
    console.log('✅ Evento criado com sucesso:', evento)
    
    // 4. Limpar o evento de teste
    await supabase
      .from('user_calendar_events')
      .delete()
      .eq('id', evento.id)
    
    console.log('🗑️ Evento de teste removido')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar teste
testarCriacaoEvento()



