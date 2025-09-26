import { supabase } from './supabase'

export async function createTables() {
  try {
    console.log('🚀 Criando tabelas do banco de dados...')

    // Criar tabela companies
    const { error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1)

    if (companiesError && companiesError.code === 'PGRST116') {
      console.log('📋 Criando tabela companies...')
      // Se a tabela não existe, vamos tentar criar via SQL
      console.log('Tabela companies não existe. Execute o SQL manualmente no Supabase.')
    }

    // Inserir empresa padrão
    console.log('🏢 Inserindo empresa padrão...')
    const { error: insertError } = await supabase
      .from('companies')
      .upsert([
        { 
          id: '00000000-0000-0000-0000-000000000001', 
          name: 'Felix Mix' 
        }
      ], { 
        onConflict: 'id' 
      })

    if (insertError) {
      console.warn('Aviso ao inserir empresa:', insertError.message)
    } else {
      console.log('✅ Empresa padrão inserida com sucesso!')
    }

    return { success: true }

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error)
    return { success: false, error }
  }
}

export async function testConnection() {
  try {
    console.log('🔍 Testando conexão...')
    
    // Testar conexão básica
    const { data, error } = await supabase.from('companies').select('*').limit(1)
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Conexão funcionando!', data)
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return { success: false, error }
  }
}

export async function getSetupInstructions() {
  return {
    message: `
Para configurar o banco de dados, execute o seguinte SQL no painel do Supabase:

1. Acesse o painel do Supabase
2. Vá em SQL Editor
3. Execute o arquivo database-setup.sql completo

Ou execute este SQL básico:

-- Criar tabela companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir empresa padrão
INSERT INTO companies (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Felix Mix')
ON CONFLICT (id) DO NOTHING;
    `
  }
}





