import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgramacaoAPI } from '../../lib/programacao-api';
import { Programacao } from '../../types/programacao';
import { toast } from '../../lib/toast-hooks';
import { Layout } from '../../components/Layout';
import { Loading } from '../../components/Loading';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export default function ProgramacaoBoardSimple() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [programacoes, setProgramacoes] = useState<Programacao[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; programacao: Programacao | null }>({
    show: false,
    programacao: null
  });

  useEffect(() => {
    loadProgramacoes();
  }, []);

  const loadProgramacoes = async () => {
    setLoading(true);
    try {
      // Buscar programações dos próximos 7 dias
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);
      
      const startDateStr = today.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log('Buscando programações de', startDateStr, 'até', endDateStr);
      
      const data = await ProgramacaoAPI.getByPeriod(startDateStr, endDateStr);
      console.log('Programações encontradas:', data);
      setProgramacoes(data);
    } catch (error) {
      console.error('Erro detalhado ao carregar programações:', error);
      toast.error(`Erro ao carregar programações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgramacao = (programacao: Programacao) => {
    setDeleteDialog({ show: true, programacao });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.programacao) return;

    try {
      await ProgramacaoAPI.delete(deleteDialog.programacao.id);
      toast.success('Programação excluída com sucesso!');
      loadProgramacoes();
    } catch (error) {
      toast.error('Erro ao excluir programação');
      console.error(error);
    } finally {
      setDeleteDialog({ show: false, programacao: null });
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Programação de Obras</h1>
              <p className="text-gray-600 mt-2">
                Quadro interativo para gerenciar programações de obras e bombas
              </p>
            </div>
            <Button onClick={() => navigate('/programacao/nova')}>
              Nova Programação
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Programações</h2>
          {programacoes.length === 0 ? (
            <p className="text-gray-500">Nenhuma programação encontrada.</p>
          ) : (
            <div className="space-y-4">
              {programacoes.map((programacao) => (
                <div key={programacao.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{programacao.prefixo_obra}</h3>
                      <p className="text-gray-600">Cliente: {programacao.cliente}</p>
                      <p className="text-gray-600">Data: {programacao.data} às {programacao.horario}</p>
                      <p className="text-gray-600">Endereço: {programacao.endereco}, {programacao.numero}</p>
                      {programacao.volume_previsto && (
                        <p className="text-gray-600">Volume: {programacao.volume_previsto} m³</p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/programacao/${programacao.id}`)}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProgramacao(programacao)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Confirmação de Exclusão */}
        <ConfirmDialog
          isOpen={deleteDialog.show}
          title="Excluir Programação"
          message={`Tem certeza que deseja excluir a programação "${deleteDialog.programacao?.prefixo_obra}"? Esta ação não pode ser desfeita.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteDialog({ show: false, programacao: null })}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
        />
      </div>
    </Layout>
  );
}
