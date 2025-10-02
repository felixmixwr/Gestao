import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Layout } from '../../components/Layout';
import { Button } from '../../components/Button';
import { Table } from '../../components/Table';
// import { FileDownloadButton } from '../../components/FileDownloadButton';
import { formatCurrency } from '../../utils/format';
import { formatDateSafe } from '../../utils/date-utils';
import type { Database } from '../../lib/supabase';

type NotaFiscal = Database['public']['Tables']['notas_fiscais']['Row'];

/**
 * Página de listagem de notas fiscais
 */
export const NotesList: React.FC = () => {
  const navigate = useNavigate();
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [userRole, setUserRole] = useState<string>('');

  // Verificar permissões do usuário
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // TODO: Implementar verificação de role do usuário
        // Por enquanto, assumir que todos podem ver, mas apenas admin/financeiro podem criar
        // setUserRole('admin'); // Mock
      }
    };
    checkUserRole();
  }, []);

  // Carregar notas fiscais
  useEffect(() => {
    loadNotas();
  }, []);

  const loadNotas = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Carregando notas fiscais...');
      
      // Query simplificada primeiro - apenas notas fiscais
      const { data: notasData, error: notasError } = await supabase
        .from('notas_fiscais')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (notasError) {
        console.error('❌ Erro ao carregar notas fiscais:', notasError);
        setError(`Erro ao carregar notas fiscais: ${notasError.message}`);
        return;
      }

      console.log('✅ Notas fiscais carregadas:', notasData);

      // Se temos notas, tentar carregar dados dos relatórios
      if (notasData && notasData.length > 0) {
        const relatorioIds = [...new Set(notasData.map(nota => nota.relatorio_id))];
        
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select(`
            id,
            report_number,
            clients(
              id,
              name,
              company_name
            )
          `)
          .in('id', relatorioIds);

        if (reportsError) {
          console.warn('⚠️ Erro ao carregar relatórios:', reportsError);
          // Continuar mesmo sem dados dos relatórios
          setNotas(notasData);
        } else {
          console.log('✅ Relatórios carregados:', reportsData);
          
          // Combinar dados das notas com dados dos relatórios
          const notasComRelatorios = notasData.map(nota => {
            const report = reportsData?.find(r => r.id === nota.relatorio_id);
            return {
              ...nota,
              reports: report
            };
          });
          
          setNotas(notasComRelatorios);
        }
      } else {
        setNotas([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar notas fiscais:', error);
      setError(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Removido: handleCreateNote não é mais necessário

  const handleViewDetails = (notaId: string) => {
    // TODO: Implementar página de detalhes da nota fiscal
    console.log('Ver detalhes da nota:', notaId);
  };

  const handleViewReport = (reportId: string) => {
    navigate(`/reports/${reportId}`);
  };

  const handleDownloadAnexo = (anexoUrl: string | null, numeroNota: string) => {
    if (anexoUrl) {
      const link = document.createElement('a');
      link.href = anexoUrl;
      link.target = '_blank';
      link.download = `NF-${numeroNota}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Removido: canCreateNotes não é mais necessário

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Faturada':
        return 'bg-blue-100 text-blue-800';
      case 'Paga':
        return 'bg-green-100 text-green-800';
      case 'Cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'numero_nota' as keyof NotaFiscal,
      label: 'Número da Nota',
      render: (nota: any) => (
        <div>
          <span className="font-mono font-medium text-lg">{nota.numero_nota || 'N/A'}</span>
          <div className="text-xs text-gray-500">
            Relatório: {nota.reports?.report_number || nota.relatorio_id || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'cliente' as keyof NotaFiscal,
      label: 'Cliente',
      render: (nota: any) => {
        const cliente = nota.reports?.clients;
        const nomeCliente = cliente?.company_name || cliente?.name || 'Cliente não encontrado';
        
        return (
          <div>
            <div className="font-medium text-gray-900">{nomeCliente}</div>
            {cliente?.name && cliente?.company_name && (
              <div className="text-sm text-gray-500">{cliente.name}</div>
            )}
          </div>
        );
      }
    },
    {
      key: 'valor' as keyof NotaFiscal,
      label: 'Valor',
      render: (nota: NotaFiscal) => (
        <div className="text-right">
          <span className="font-bold text-lg text-green-600">
            {formatCurrency(nota.valor || 0)}
          </span>
        </div>
      )
    },
    {
      key: 'data_emissao' as keyof NotaFiscal,
      label: 'Data de Emissão',
      render: (nota: NotaFiscal) => (
        <div>
          <span className="font-medium text-gray-900">
            {formatDateSafe(nota.data_emissao)}
          </span>
        </div>
      )
    },
    {
      key: 'data_vencimento' as keyof NotaFiscal,
      label: 'Data de Vencimento',
      render: (nota: NotaFiscal) => {
        try {
          // Usar a função segura para criar a data
          const vencimento = nota.data_vencimento && /^\d{4}-\d{2}-\d{2}$/.test(nota.data_vencimento) 
            ? new Date(nota.data_vencimento.split('-').map(Number).join(','))
            : new Date(nota.data_vencimento);
          const hoje = new Date();
          const isVencida = vencimento < hoje && nota.status !== 'Paga';
          
          return (
            <div>
              <span className={`font-medium ${isVencida ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDateSafe(nota.data_vencimento)}
              </span>
              {isVencida && (
                <div className="text-xs text-red-500 font-medium">Vencida</div>
              )}
            </div>
          );
        } catch (error) {
          return (
            <div>
              <span className="font-medium text-gray-900">
                {formatDateSafe(nota.data_vencimento)}
              </span>
            </div>
          );
        }
      }
    },
    {
      key: 'status' as keyof NotaFiscal,
      label: 'Status',
      render: (nota: NotaFiscal) => (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(nota.status)}`}>
          {nota.status || 'N/A'}
        </span>
      )
    },
    {
      key: 'id' as keyof NotaFiscal,
      label: 'Ações',
      render: (nota: any) => (
        <div className="flex flex-col space-y-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleViewDetails(nota.id)}
            className="w-full"
          >
            Ver Detalhes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewReport(nota.relatorio_id)}
            className="w-full"
          >
            Ver Relatório
          </Button>
          {nota.anexo_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadAnexo(nota.anexo_url, nota.numero_nota)}
              className="w-full"
            >
              📎 Anexo
            </Button>
          )}
        </div>
      )
    }
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total de Notas</div>
            <div className="text-2xl font-bold text-gray-900">{notas.length}</div>
            <div className="text-xs text-gray-400 mt-1">Notas fiscais emitidas</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Valor Total</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(notas.reduce((sum, nota) => sum + nota.valor, 0))}
            </div>
            <div className="text-xs text-gray-400 mt-1">Soma de todos os valores</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Pagas</div>
            <div className="text-2xl font-bold text-green-600">
              {notas.filter(nota => nota.status === 'Paga').length}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {notas.length > 0 ? Math.round((notas.filter(nota => nota.status === 'Paga').length / notas.length) * 100) : 0}% do total
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Pendentes</div>
            <div className="text-2xl font-bold text-orange-600">
              {notas.filter(nota => nota.status === 'Faturada').length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Aguardando pagamento</div>
          </div>
        </div>

        {/* Tabela de Notas */}
        <div className="bg-white rounded-lg shadow">
          <Table
            data={notas}
            columns={columns}
            emptyMessage="Nenhuma nota fiscal encontrada"
          />
        </div>

      </div>
    </Layout>
  );
};