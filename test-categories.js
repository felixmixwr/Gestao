import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rgsovlqsezjeqohlbyod.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2Mzk1ODksImV4cCI6MjA3NDIxNTU4OX0.od07D8mGwg-nYC5-QzzBledOl2FciqxDR5S0Ut8Ah8k'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCategoryCreation() {
  try {
    console.log('🧪 Testando criação de categoria...')
    
    // Testar criação de categoria
    const { data, error } = await supabase
      .from('task_categories')
      .insert({
        name: 'Financeiro',
        color: 'red',
        description: 'Eventos relacionados a vencimentos e cobranças financeiras'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar categoria:', error)
      console.error('Código do erro:', error.code)
      console.error('Mensagem:', error.message)
      console.error('Detalhes:', error.details)
      console.error('Hint:', error.hint)
    } else {
      console.log('✅ Categoria criada com sucesso:', data)
    }
  } catch (err) {
    console.error('❌ Erro geral:', err)
  }
}

testCategoryCreation()
