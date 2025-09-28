import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgramacaoAPI } from '../../lib/programacao-api';
import { Programacao } from '../../types/programacao';
import { toast } from '../../lib/toast-hooks';
import { Layout } from '../../components/Layout';
import { Loading } from '../../components/Loading';
import { Button } from '../../components/Button';

export default function ProgramacaoBoardSimple() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [programacoes, setProgramacoes] = useState<Programacao[]>([]);

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
                <div key={programacao.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{programacao.prefixo_obra}</h3>
                  <p className="text-gray-600">Cliente: {programacao.cliente}</p>
                  <p className="text-gray-600">Data: {programacao.data} às {programacao.horario}</p>
                  <p className="text-gray-600">Endereço: {programacao.endereco}, {programacao.numero}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
