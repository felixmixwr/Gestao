import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Layout } from '../../components/Layout';
import { Button } from '../../components/Button';
import { Table } from '../../components/Table';
import { NoteForm } from '../../components/NoteForm';
import { formatCurrency, formatDate } from '../../utils/format';

// Tipo para relatórios pendentes (assumindo estrutura da view)
interface PendingReport {
  id: string;
  report_number: string;
  created_at: string;
  responsible_name: string;
  pump_prefix: string;
  total_value: number;
  client_name: string;
  company_name: string;
  start_date: string;
  end_date: string;
  total_hours: number;
}

/**
 * Página de relatórios pendentes para criação de notas fiscais
 */
export const NotesPendingReports: React.FC = () => {
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PendingReport | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  // Verificar permissões do usuário
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // TODO: Implementar verificação de role do usuário
        setUserRole('admin'); // Mock
      }
    };
    checkUserRole();
  }, []);

  // Carregar relatórios pendentes
  useEffect(() => {
    loadPendingReports();
  }, []);

  const loadPendingReports = async () => {
    try {
      setLoading(true);
      
      // Por enquanto, vamos buscar relatórios que não têm notas associadas
      // TODO: Implementar view 'pending_reports_for_invoice' no banco
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          report_number,
          created_at,
          start_date,
          end_date,
          total_hours,
          clients!inner(name),
          pumps!inner(prefix),
          companies!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao carregar relatórios pendentes:', error);
        return;
      }

      // Transformar dados para o formato esperado
      const transformedData: PendingReport[] = (data || []).map(report => ({
        id: report.id,
        report_number: report.report_number,
        created_at: report.created_at,
        responsible_name: report.clients?.name || 'N/A',
        pump_prefix: report.pumps?.prefix || 'N/A',
        total_value: report.total_hours * 50, // Mock: R$ 50/hora
        client_name: report.clients?.name || 'N/A',
        company_name: report.companies?.name || 'N/A',
        start_date: report.start_date,
        end_date: report.end_date,
        total_hours: report.total_hours
      }));

      setPendingReports(transformedData);
    } catch (error) {
      console.error('Erro ao carregar relatórios pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = (report: PendingReport) => {
    setSelectedReport(report);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedReport(null);
    loadPendingReports(); // Recarregar lista
    // TODO: Implementar toast de sucesso
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedReport(null);
  };

  const canCreateNotes = ['admin', 'financeiro'].includes(userRole);

  const columns = [
    {
      key: 'report_number',
      label: 'Número do Relatório',
      render: (report: PendingReport) => (
        <span className="font-mono font-medium">{report.report_number}</span>
      )
    },
    {
      key: 'created_at',
      label: 'Data',
      render: (report: PendingReport) => (
        <span className="text-gray-700">
          {formatDate(report.created_at)}
        </span>
      )
    },
    {
      key: 'responsible_name',
      label: 'Responsável',
      render: (report: PendingReport) => (
        <div>
          <div className="font-medium">{report.responsible_name}</div>
          <div className="text-sm text-gray-500">{report.company_name}</div>
        </div>
      )
    },
    {
      key: 'pump_prefix',
      label: 'Bomba',
      render: (report: PendingReport) => (
        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
          {report.pump_prefix}
        </span>
      )
    },
    {
      key: 'total_hours',
      label: 'Horas',
      render: (report: PendingReport) => (
        <span className="text-gray-700">
          {report.total_hours}h
        </span>
      )
    },
    {
      key: 'total_value',
      label: 'Valor Total',
      render: (report: PendingReport) => (
        <span className="font-medium text-green-600">
          {formatCurrency(report.total_value)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (report: PendingReport) => (
        <div className="flex space-x-2">
          {canCreateNotes ? (
            <Button
              size="sm"
              onClick={() => handleCreateNote(report)}
            >
              Criar Nota
            </Button>
          ) : (
            <span className="text-gray-400 text-sm">Sem permissão</span>
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando relatórios pendentes...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Relatórios Pendentes</h1>
            <p className="text-gray-600">
              Relatórios que ainda não possuem notas fiscais
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Pendentes</div>
            <div className="text-2xl font-bold text-gray-900">{pendingReports.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Valor Total</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(pendingReports.reduce((sum, report) => sum + report.total_value, 0))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Horas Totais</div>
            <div className="text-2xl font-bold text-blue-600">
              {pendingReports.reduce((sum, report) => sum + report.total_hours, 0)}h
            </div>
          </div>
        </div>

        {/* Tabela de Relatórios Pendentes */}
        <div className="bg-white rounded-lg shadow">
          <Table
            data={pendingReports}
            columns={columns}
            emptyMessage="Nenhum relatório pendente encontrado"
          />
        </div>

        {/* Modal do Formulário */}
        {showForm && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  Criar Nota para Relatório {selectedReport.report_number}
                </h2>
                <button
                  onClick={handleFormCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <NoteForm
                initialData={{
                  company_name: selectedReport.client_name,
                  nf_value: selectedReport.total_value,
                  descricao: `Serviços de bomba ${selectedReport.pump_prefix} - ${selectedReport.total_hours}h`,
                  report_id: selectedReport.id
                }}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
