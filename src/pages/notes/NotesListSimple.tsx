import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Layout } from '../../components/Layout';
import { Button } from '../../components/Button';
import { formatCurrency } from '../../utils/format';
import { formatDateSafe } from '../../utils/date-utils';
import type { Database } from '../../lib/supabase';

type NotaFiscal = Database['public']['Tables']['notas_fiscais']['Row'];

/**
 * Página de listagem de notas fiscais - Versão Simplificada
 */
export const NotesListSimple: React.FC = () => {
  const navigate = useNavigate();
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotas();
  }, []);

  const loadNotas = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Carregando notas fiscais (versão simples)...');
      
      const { data, error } = await supabase
        .from('notas_fiscais')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Erro ao carregar notas fiscais:', error);
        setError(`Erro ao carregar notas fiscais: ${error.message}`);
        return;
      }

      console.log('✅ Notas fiscais carregadas:', data);
      setNotas(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar notas fiscais:', error);
      setError(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paga':
        return 'bg-green-100 text-green-800';
      case 'Faturada':
        return 'bg-orange-100 text-orange-800';
      case 'Cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando notas fiscais...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notas Fiscais</h1>
              <p className="text-gray-600">
                Visualize todas as notas fiscais criadas no sistema
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Erro ao carregar notas fiscais
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setError(null);
                      loadNotas();
                    }}
                  >
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notas Fiscais</h1>
            <p className="text-gray-600">
              Visualize todas as notas fiscais criadas no sistema
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total de Notas</div>
            <div className="text-2xl font-bold text-gray-900">{notas.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Valor Total</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(notas.reduce((sum, nota) => sum + (nota.valor || 0), 0))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Pagas</div>
            <div className="text-2xl font-bold text-green-600">
              {notas.filter(nota => nota.status === 'Paga').length}
            </div>
          </div>
        </div>

        {/* Lista de Notas */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Lista de Notas Fiscais</h3>
          </div>
          
          {notas.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Nenhuma nota fiscal encontrada.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notas.map((nota) => (
                <div key={nota.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {nota.numero_nota || 'N/A'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Relatório ID: {nota.relatorio_id}
                          </p>
                        </div>
                        <div>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(nota.valor || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-900">
                          Emissão: {formatDateSafe(nota.data_emissao)}
                        </div>
                        <div className="text-sm text-gray-900">
                          Vencimento: {formatDateSafe(nota.data_vencimento)}
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(nota.status)}`}>
                        {nota.status || 'N/A'}
                      </span>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/reports/${nota.relatorio_id}`)}
                        >
                          Ver Relatório
                        </Button>
                        {nota.anexo_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = nota.anexo_url!;
                              link.download = `anexo-${nota.numero_nota}`;
                              link.click();
                            }}
                          >
                            📎 Anexo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
