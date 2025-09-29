// Script para verificar se a coluna status existe na tabela programacao
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatusColumn() {
  try {
    console.log('🔍 Verificando se a coluna status existe...');
    
    // Tentar buscar uma programação com o campo status
    const { data, error } = await supabase
      .from('programacao')
      .select('id, status')
      .limit(1);
    
    if (error) {
      if (error.code === '42703') {
        console.log('❌ Coluna status não existe! Executando migração...');
        
        // Executar migração
        const { error: migrationError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE programacao 
            ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'programado' CHECK (status IN ('programado', 'reservado'));
            
            CREATE INDEX IF NOT EXISTS idx_programacao_status ON programacao(status);
            
            COMMENT ON COLUMN programacao.status IS 'Status da programação: programado (azul) ou reservado (amarelo)';
          `
        });
        
        if (migrationError) {
          console.error('❌ Erro ao executar migração:', migrationError);
        } else {
          console.log('✅ Migração executada com sucesso!');
        }
      } else {
        console.error('❌ Erro ao verificar coluna:', error);
      }
    } else {
      console.log('✅ Coluna status existe!');
      console.log('📊 Dados encontrados:', data);
    }
    
  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

checkStatusColumn();
