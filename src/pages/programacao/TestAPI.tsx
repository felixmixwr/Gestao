import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function TestAPI() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testConnections = async () => {
    setLoading(true);
    const testResults: any = {};

    try {
      // Teste 1: Verificar se a tabela programacao existe
      console.log('Testando tabela programacao...');
      const { data: programacaoData, error: programacaoError } = await supabase
        .from('programacao')
        .select('*')
        .limit(1);
      
      testResults.programacao = {
        success: !programacaoError,
        error: programacaoError?.message,
        data: programacaoData
      };

      // Teste 2: Verificar se a tabela companies existe
      console.log('Testando tabela companies...');
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .limit(1);
      
      testResults.companies = {
        success: !companiesError,
        error: companiesError?.message,
        data: companiesData
      };

      // Teste 3: Verificar se a tabela pumps existe
      console.log('Testando tabela pumps...');
      const { data: pumpsData, error: pumpsError } = await supabase
        .from('pumps')
        .select('*')
        .limit(1);
      
      testResults.pumps = {
        success: !pumpsError,
        error: pumpsError?.message,
        data: pumpsData
      };

      // Teste 4: Verificar se a tabela colaboradores existe
      console.log('Testando tabela colaboradores...');
      const { data: colaboradoresData, error: colaboradoresError } = await supabase
        .from('colaboradores')
        .select('*')
        .limit(1);
      
      testResults.colaboradores = {
        success: !colaboradoresError,
        error: colaboradoresError?.message,
        data: colaboradoresData
      };

      // Teste 5: Verificar usuário atual
      console.log('Testando usuário atual...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      testResults.user = {
        success: !userError,
        error: userError?.message,
        data: user
      };

    } catch (error) {
      testResults.general = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }

    setResults(testResults);
    setLoading(false);
  };

  useEffect(() => {
    testConnections();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Teste de Conexão API
        </h1>

        {loading && (
          <div className="text-center py-8">
            <div className="text-lg">Testando conexões...</div>
          </div>
        )}

        <div className="space-y-6">
          {Object.entries(results).map(([key, result]: [string, any]) => (
            <div key={key} className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 capitalize">
                {key}
              </h2>
              <div className={`p-4 rounded ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <div className="font-medium">
                  Status: {result.success ? '✅ Sucesso' : '❌ Erro'}
                </div>
                {result.error && (
                  <div className="mt-2">
                    <strong>Erro:</strong> {result.error}
                  </div>
                )}
                {result.data && (
                  <div className="mt-2">
                    <strong>Dados:</strong> {JSON.stringify(result.data, null, 2)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button
            onClick={testConnections}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testando...' : 'Testar Novamente'}
          </button>
        </div>
      </div>
    </Layout>
  );
}




