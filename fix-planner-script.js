import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://rgsovlqsezjeqohlbyod.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2Mzk1ODksImV4cCI6MjA3NDIxNTU4OX0.od07D8mGwg-nYC5-QzzBledOl2FciqxDR5S0Ut8Ah8k'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixPlannerTables() {
  try {
    console.log('🔧 Corrigindo tabelas do planner...')
    
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('./fix-planner-tables.sql', 'utf8')
    
    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0)
    
    console.log(`📋 Executando ${commands.length} comandos SQL...`)
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';'
      console.log(`\n${i + 1}/${commands.length}: ${command.substring(0, 50)}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command })
        
        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error.message)
          // Continuar com os próximos comandos mesmo se um falhar
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`)
        }
      } catch (err) {
        console.error(`❌ Erro geral no comando ${i + 1}:`, err.message)
      }
    }
    
    console.log('\n🎉 Correção das tabelas concluída!')
    
    // Testar criação de categoria
    console.log('\n🧪 Testando criação de categoria...')
    const { data, error } = await supabase
      .from('task_categories')
      .insert({
        name: 'Financeiro Teste',
        color: 'red',
        description: 'Teste de categoria'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao testar criação de categoria:', error)
    } else {
      console.log('✅ Categoria de teste criada com sucesso:', data)
      
      // Limpar a categoria de teste
      await supabase
        .from('task_categories')
        .delete()
        .eq('id', data.id)
      
      console.log('🧹 Categoria de teste removida')
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err)
  }
}

fixPlannerTables()



