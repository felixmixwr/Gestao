import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Layout } from '../../components/Layout';
import { Button } from '../../components/Button';
import { Table } from '../../components/Table';
import { FileDownloadButton } from '../../components/FileDownloadButton';
import { formatCurrency, formatDate } from '../../utils/format';
import type { Database } from '../../lib/supabase';

type Note = Database['public']['Tables']['notes']['Row'];

/**
 * Página de listagem de notas fiscais
 */
export const NotesList: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  // Verificar permissões do usuário
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // TODO: Implementar verificação de role do usuário
        // Por enquanto, assumir que todos podem ver, mas apenas admin/financeiro podem criar
        setUserRole('admin'); // Mock
      }
    };
    checkUserRole();
  }, []);

  // Carregar notas
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao carregar notas:', error);
        return;
      }

      setNotes(data || []);
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = () => {
    navigate('/notes/new');
  };

  const handleViewDetails = (noteId: string) => {
    navigate(`/notes/${noteId}`);
  };

  const handleViewReport = (reportId: string | null) => {
    if (reportId) {
      navigate(`/reports/${reportId}`);
    }
  };

  const canCreateNotes = ['admin', 'financeiro'].includes(userRole);

  const columns = [
    {
      key: 'nf_number' as keyof Note,
      label: 'Número',
      render: (note: Note) => (
        <span className="font-mono font-medium">{note.nf_number}</span>
      )
    },
    {
      key: 'company_name' as keyof Note,
      label: 'Cliente',
      render: (note: Note) => (
        <div>
          <div className="font-medium">{note.company_name}</div>
          <div className="text-sm text-gray-500">{note.company_logo}</div>
        </div>
      )
    },
    {
      key: 'nf_value' as keyof Note,
      label: 'Valor',
      render: (note: Note) => (
        <span className="font-medium text-green-600">
          {formatCurrency(note.nf_value)}
        </span>
      )
    },
    {
      key: 'nf_due_date' as keyof Note,
      label: 'Vencimento',
      render: (note: Note) => (
        <span className="text-gray-700">
          {formatDate(note.nf_due_date)}
        </span>
      )
    },
    {
      key: 'report_id' as keyof Note,
      label: 'Relatório',
      render: (note: Note) => (
        note.report_id ? (
          <button
            onClick={() => handleViewReport(note.report_id)}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Ver Relatório
          </button>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        )
      )
    },
    {
      key: 'id' as keyof Note,
      label: 'Ações',
      render: (note: Note) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleViewDetails(note.id)}
          >
            Ver Detalhes
          </Button>
          <FileDownloadButton
            path={note.file_xlsx_path}
            label="XLSX"
            fileType="xlsx"
          />
          <FileDownloadButton
            path={note.file_pdf_path}
            label="PDF"
            fileType="pdf"
          />
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando notas...</div>
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
              Gerencie as notas fiscais do sistema
            </p>
          </div>
          
          {canCreateNotes && (
            <Button onClick={handleCreateNote}>
              + Nova Nota
            </Button>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total de Notas</div>
            <div className="text-2xl font-bold text-gray-900">{notes.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Valor Total</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(notes.reduce((sum, note) => sum + note.nf_value, 0))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Com Arquivos</div>
            <div className="text-2xl font-bold text-blue-600">
              {notes.filter(note => note.file_pdf_path || note.file_xlsx_path).length}
            </div>
          </div>
        </div>

        {/* Tabela de Notas */}
        <div className="bg-white rounded-lg shadow">
          <Table
            data={notes}
            columns={columns}
            emptyMessage="Nenhuma nota fiscal encontrada"
          />
        </div>

      </div>
    </Layout>
  );
};