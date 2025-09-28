import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Layout } from '../../components/Layout';
import { Button } from '../../components/Button';

export default function TestConnection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testConnection = async () => {
    setLoading(true);
    setResult('');
    
    try {
      // Teste 1: Verificar se consegue conectar ao Supabase
      console.log('Testando conexão com Supabase...');
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        setResult(`❌ Erro de autenticação: ${authError.message}`);
        return;
      }
      
      console.log('Sessão de autenticação:', authData);
      setResult('✅ Conexão com Supabase OK\n');
      
      // Teste 2: Verificar se a tabela programacao existe
      console.log('Verificando se a tabela programacao existe...');
      const { error: tableError } = await supabase
        .from('programacao')
        .select('count')
        .limit(1);
      
      if (tableError) {
        setResult(prev => prev + `❌ Erro na tabela programacao: ${tableError.message}\n`);
        console.error('Erro na tabela programacao:', tableError);
      } else {
        setResult(prev => prev + '✅ Tabela programacao existe\n');
      }
      
      // Teste 3: Verificar se a tabela companies existe
      console.log('Verificando se a tabela companies existe...');
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .limit(5);
      
      if (companiesError) {
        setResult(prev => prev + `❌ Erro na tabela companies: ${companiesError.message}\n`);
        console.error('Erro na tabela companies:', companiesError);
      } else {
        setResult(prev => prev + `✅ Tabela companies existe (${companiesData?.length || 0} registros)\n`);
      }
      
      // Teste 4: Verificar se a tabela pumps existe
      console.log('Verificando se a tabela pumps existe...');
      const { data: pumpsData, error: pumpsError } = await supabase
        .from('pumps')
        .select('id, name, model')
        .limit(5);
      
      if (pumpsError) {
        setResult(prev => prev + `❌ Erro na tabela pumps: ${pumpsError.message}\n`);
        console.error('Erro na tabela pumps:', pumpsError);
      } else {
        setResult(prev => prev + `✅ Tabela pumps existe (${pumpsData?.length || 0} registros)\n`);
      }
      
      // Teste 5: Verificar se a tabela colaboradores existe
      console.log('Verificando se a tabela colaboradores existe...');
      const { data: colaboradoresData, error: colaboradoresError } = await supabase
        .from('colaboradores')
        .select('id, nome, cargo')
        .limit(5);
      
      if (colaboradoresError) {
        setResult(prev => prev + `❌ Erro na tabela colaboradores: ${colaboradoresError.message}\n`);
        console.error('Erro na tabela colaboradores:', colaboradoresError);
      } else {
        setResult(prev => prev + `✅ Tabela colaboradores existe (${colaboradoresData?.length || 0} registros)\n`);
      }
      
    } catch (error) {
      console.error('Erro geral:', error);
      setResult(`❌ Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Teste de Conexão - Módulo Programação</h1>
          
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Status da Conexão</h2>
            <Button 
              onClick={testConnection} 
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Testando...' : 'Executar Testes'}
            </Button>
            
            {result && (
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono">{result}</pre>
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Instruções</h3>
            <p className="text-blue-800 mb-4">
              Se algum teste falhar, execute o script SQL no Supabase:
            </p>
            <code className="block bg-blue-100 p-3 rounded text-sm">
              scripts/SQL/setup_programacao_module.sql
            </code>
          </div>
        </div>
      </div>
    </Layout>
  );
}


