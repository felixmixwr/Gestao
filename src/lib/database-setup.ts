import { supabase } from './supabase'

export async function setupDatabase() {
  try {
    console.log('🚀 Iniciando configuração do banco de dados...')

    // 1. Criar tabela de empresas
    console.log('📋 Criando tabela companies...')
    const { error: companiesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })

    if (companiesError) {
      console.warn('Aviso ao criar tabela companies:', companiesError.message)
    }

    // 2. Criar tabela de usuários
    console.log('👥 Criando tabela users...')
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          full_name TEXT,
          company_id UUID REFERENCES companies(id),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })

    if (usersError) {
      console.warn('Aviso ao criar tabela users:', usersError.message)
    }

    // 3. Criar tabela de clientes
    console.log('🏢 Criando tabela clients...')
    const { error: clientsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS clients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          company_id UUID REFERENCES companies(id) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })

    if (clientsError) {
      console.warn('Aviso ao criar tabela clients:', clientsError.message)
    }

    // 4. Criar tabela de bombas
    console.log('⚙️ Criando tabela pumps...')
    const { error: pumpsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS pumps (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          model TEXT,
          serial_number TEXT,
          status TEXT CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
          company_id UUID REFERENCES companies(id) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })

    if (pumpsError) {
      console.warn('Aviso ao criar tabela pumps:', pumpsError.message)
    }

    // 5. Criar tabela de relatórios
    console.log('📊 Criando tabela reports...')
    const { error: reportsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          report_number TEXT UNIQUE NOT NULL,
          client_id UUID REFERENCES clients(id) NOT NULL,
          pump_id UUID REFERENCES pumps(id) NOT NULL,
          company_id UUID REFERENCES companies(id) NOT NULL,
          start_date TIMESTAMPTZ NOT NULL,
          end_date TIMESTAMPTZ NOT NULL,
          total_hours INTEGER NOT NULL,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })

    if (reportsError) {
      console.warn('Aviso ao criar tabela reports:', reportsError.message)
    }

    // 6. Criar tabela de notas
    console.log('📝 Criando tabela notes...')
    const { error: notesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          company_id UUID REFERENCES companies(id) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })

    if (notesError) {
      console.warn('Aviso ao criar tabela notes:', notesError.message)
    }

    // 7. Inserir empresa padrão
    console.log('🏢 Inserindo empresa padrão...')
    const { error: insertCompanyError } = await supabase
      .from('companies')
      .upsert([
        { 
          id: '00000000-0000-0000-0000-000000000001', 
          name: 'Felix Mix' 
        }
      ], { 
        onConflict: 'id' 
      })

    if (insertCompanyError) {
      console.warn('Aviso ao inserir empresa padrão:', insertCompanyError.message)
    }

    console.log('✅ Configuração do banco de dados concluída!')
    return { success: true }

  } catch (error) {
    console.error('❌ Erro na configuração do banco:', error)
    return { success: false, error }
  }
}

// Função para testar a conexão
export async function testDatabaseConnection() {
  try {
    console.log('🔍 Testando conexão com o banco...')
    
    // Testar conexão básica
    const { data, error } = await supabase.from('companies').select('count').limit(1)
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Conexão com o banco funcionando!')
    return { success: true, data }
    
  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error)
    return { success: false, error }
  }
}





