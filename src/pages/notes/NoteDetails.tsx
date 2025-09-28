import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Layout } from '../../components/Layout';
import { Button } from '../../components/Button';
import { FileDownloadButton } from '../../components/FileDownloadButton';
import { formatCurrency, formatDate, formatPhone, formatDocument, formatCEP } from '../../utils/format';
import type { Database } from '../../lib/supabase';

type Note = Database['public']['Tables']['notes']['Row'];

/**
 * Página de detalhes de uma nota fiscal
 */
export const NoteDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadNote(id);
    }
  }, [id]);

  const loadNote = async (noteId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) {
        console.error('Erro ao carregar nota:', error);
        setError('Erro ao carregar nota fiscal');
        return;
      }

      setNote(data);
    } catch (error) {
      console.error('Erro ao carregar nota:', error);
      setError('Erro ao carregar nota fiscal');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/notes');
  };

  const handleViewReport = () => {
    if (note?.report_id) {
      navigate(`/reports/${note.report_id}`);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando nota fiscal...</div>
        </div>
      </Layout>
    );
  }

  if (error || !note) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error || 'Nota fiscal não encontrada'}</div>
            <Button onClick={handleBack}>
              Voltar para Lista
            </Button>
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
            <Button
              variant="secondary"
              onClick={handleBack}
              className="mb-4"
            >
              ← Voltar
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Nota Fiscal #{note.nf_number}
            </h1>
            <p className="text-gray-600">
              Detalhes da nota fiscal
            </p>
          </div>
          
          <div className="flex space-x-3">
            <FileDownloadButton
              path={note.file_xlsx_path}
              label="Baixar XLSX"
              fileType="xlsx"
            />
            <FileDownloadButton
              path={note.file_pdf_path}
              label="Baixar PDF"
              fileType="pdf"
            />
          </div>
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dados da Nota */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Dados da Nota</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Número:</span>
                <span className="font-mono font-medium">{note.nf_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data:</span>
                <span>{formatDate(note.nf_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vencimento:</span>
                <span>{formatDate(note.nf_due_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(note.nf_value)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Empresa:</span>
                <span>{note.company_logo}</span>
              </div>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Dados do Cliente</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nome:</span>
                <span className="font-medium">{note.company_name}</span>
              </div>
              {note.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Telefone:</span>
                  <span>{formatPhone(note.phone)}</span>
                </div>
              )}
              {note.cnpj_cpf && (
                <div className="flex justify-between">
                  <span className="text-gray-600">CNPJ/CPF:</span>
                  <span>{formatDocument(note.cnpj_cpf)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Endereço */}
        {(note.address || note.city || note.cep || note.uf) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Endereço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {note.address && (
                <div>
                  <span className="text-gray-600 block">Endereço:</span>
                  <span>{note.address}</span>
                </div>
              )}
              {note.city && (
                <div>
                  <span className="text-gray-600 block">Cidade:</span>
                  <span>{note.city}</span>
                </div>
              )}
              {note.cep && (
                <div>
                  <span className="text-gray-600 block">CEP:</span>
                  <span>{formatCEP(note.cep)}</span>
                </div>
              )}
              {note.uf && (
                <div>
                  <span className="text-gray-600 block">UF:</span>
                  <span>{note.uf}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Relatório Vinculado */}
        {note.report_id && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Relatório Vinculado</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Esta nota está vinculada a um relatório</p>
                <p className="text-sm text-gray-500">ID: {note.report_id}</p>
              </div>
              <Button onClick={handleViewReport}>
                Ver Relatório
              </Button>
            </div>
          </div>
        )}

        {/* Descrição */}
        {note.descricao && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Descrição</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{note.descricao}</p>
          </div>
        )}

        {/* Observações */}
        {note.obs && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Observações</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{note.obs}</p>
          </div>
        )}

        {/* Informações do Sistema */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Informações do Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 block">Criado em:</span>
              <span>{formatDate(note.created_at)}</span>
            </div>
            <div>
              <span className="text-gray-600 block">Atualizado em:</span>
              <span>{formatDate(note.updated_at)}</span>
            </div>
            <div>
              <span className="text-gray-600 block">Status dos Arquivos:</span>
              <div className="flex space-x-2 mt-1">
                <span className={`px-2 py-1 rounded text-xs ${
                  note.file_xlsx_path ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  XLSX {note.file_xlsx_path ? 'Disponível' : 'Pendente'}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  note.file_pdf_path ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  PDF {note.file_pdf_path ? 'Disponível' : 'Pendente'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
