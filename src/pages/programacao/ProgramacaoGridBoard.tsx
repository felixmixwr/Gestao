import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgramacaoAPI } from '../../lib/programacao-api';
import { Programacao, BombaOption } from '../../types/programacao';
import { Layout } from '../../components/Layout';
import { Loading } from '../../components/Loading';
import { Button } from '../../components/Button';
import { toast } from '../../lib/toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { getWeekBoundsBrasilia, formatDateBR, getDayOfWeekBR, toBrasiliaISOString } from '../../utils/date-utils';

interface ProgramacaoCard {
  id: string;
  hora: string;
  cliente: string;
  volume: number;
  local: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const DAYS_OF_WEEK = [
  'Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'
];

const DAY_NAMES = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

export function ProgramacaoGridBoard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [programacoes, setProgramacoes] = useState<Programacao[]>([]);
  const [bombas, setBombas] = useState<BombaOption[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [programacaoToDelete, setProgramacaoToDelete] = useState<Programacao | null>(null);

  // Função para obter os limites da semana (usando fuso horário de Brasília)
  const getWeekBounds = (date: Date) => {
    return getWeekBoundsBrasilia(date);
  };

  // Carregar bombas disponíveis
  const loadBombas = useCallback(async () => {
    try {
      const bombasData = await ProgramacaoAPI.getBombas();
      setBombas(bombasData);
      console.log('🚰 Bombas carregadas:', bombasData.length);
    } catch (error) {
      console.error('Erro ao carregar bombas:', error);
      toast.error('Erro ao carregar bombas');
    }
  }, []);

  // Carregar programações da semana
  const loadProgramacoes = useCallback(async () => {
    try {
      setLoading(true);
      const { start, end } = getWeekBounds(currentWeek);
      
      // Usar datas simples no formato YYYY-MM-DD
      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];
      
      const data = await ProgramacaoAPI.getByPeriod(startDate, endDate);
      setProgramacoes(data);
      console.log('📅 Programações carregadas:', data.length);
    } catch (error) {
      console.error('Erro ao carregar programações:', error);
      toast.error('Erro ao carregar programações da semana');
    } finally {
      setLoading(false);
    }
  }, [currentWeek]);

  // Navegação semanal
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // Obter programações para uma bomba e dia específicos
  const getProgramacoesForBombaAndDay = (bombaId: string, dayOfWeek: number) => {
    return programacoes.filter(p => {
      const programacaoDayOfWeek = getDayOfWeekBR(p.data);
      return p.bomba_id === bombaId && programacaoDayOfWeek === dayOfWeek;
    });
  };

  // Formatar hora
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  // Formatar local
  const formatLocation = (endereco: string, numero: string, bairro: string, cidade: string) => {
    const parts = [endereco, numero].filter(Boolean);
    if (bairro) parts.push(bairro);
    if (cidade) parts.push(cidade);
    return parts.join(', ');
  };

  // Deletar programação
  const handleDeleteClick = (programacao: Programacao) => {
    setProgramacaoToDelete(programacao);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!programacaoToDelete) return;

    try {
      await ProgramacaoAPI.delete(programacaoToDelete.id);
      toast.success('Programação excluída com sucesso!');
      await loadProgramacoes();
    } catch (error) {
      console.error('Erro ao deletar programação:', error);
      toast.error('Erro ao excluir programação');
    } finally {
      setShowDeleteDialog(false);
      setProgramacaoToDelete(null);
    }
  };

  // Efeitos
  useEffect(() => {
    loadBombas();
  }, [loadBombas]);

  useEffect(() => {
    loadProgramacoes();
  }, [loadProgramacoes]);

  // Obter informações da semana atual
  const { start: weekStart, end: weekEnd } = getWeekBounds(currentWeek);
  const weekRange = `${formatDateBR(weekStart)} - ${formatDateBR(weekEnd)}`;

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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Programação Semanal</h1>
            <p className="text-sm text-gray-600 mt-1">{weekRange}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={goToPreviousWeek}
              variant="outline"
              size="sm"
            >
              ← Semana Anterior
            </Button>
            
            <Button
              onClick={goToCurrentWeek}
              variant="outline"
              size="sm"
            >
              Hoje
            </Button>
            
            <Button
              onClick={goToNextWeek}
              variant="outline"
              size="sm"
            >
              Próxima Semana →
            </Button>
            
            <Button
              onClick={() => navigate('/programacao/nova')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Nova Programação
            </Button>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Header com dias da semana */}
              <thead>
                <tr className="bg-gray-50">
                  <th className="w-32 p-4 text-left font-semibold text-gray-700 border-r border-gray-200">
                    Bomba
                  </th>
                  {DAYS_OF_WEEK.map((day, index) => {
                    const dayDate = new Date(weekStart);
                    dayDate.setDate(dayDate.getDate() + index);
                    
                    return (
                      <th key={index} className="w-48 p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
                        <div className="text-sm">{day}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {dayDate.getDate().toString().padStart(2, '0')}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Corpo da tabela com bombas */}
              <tbody>
                {bombas.map((bomba, bombaIndex) => (
                  <tr key={bomba.id} className={bombaIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {/* Coluna da bomba */}
                    <td className="w-32 p-4 font-medium text-gray-900 border-r border-gray-200 sticky left-0 bg-inherit">
                      <div className="text-sm font-semibold">{bomba.prefix}</div>
                      <div className="text-xs text-gray-500">{bomba.model}</div>
                    </td>

                    {/* Colunas dos dias */}
                    {DAYS_OF_WEEK.map((_, dayIndex) => {
                      const dayProgramacoes = getProgramacoesForBombaAndDay(bomba.id, dayIndex);
                      
                      return (
                        <td key={dayIndex} className="w-48 p-2 border-r border-gray-200 last:border-r-0 align-top">
                          <div className="space-y-2 min-h-[100px]">
                            {dayProgramacoes.map((programacao) => (
                              <div
                                key={programacao.id}
                                className="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition-colors"
                                onClick={() => navigate(`/programacao/${programacao.id}`)}
                              >
                                {/* Hora */}
                                <div className="text-sm font-semibold text-blue-800 mb-1">
                                  {formatTime(programacao.horario)}
                                </div>
                                
                                {/* Cliente */}
                                <div className="text-sm font-medium text-gray-900 mb-1 truncate">
                                  {programacao.cliente || 'Cliente não informado'}
                                </div>
                                
                                {/* Volume */}
                                <div className="text-xs text-gray-600 mb-1">
                                  {programacao.volume_previsto}m³
                                </div>
                                
                                {/* Local */}
                                <div className="text-xs text-gray-500 truncate">
                                  {formatLocation(
                                    programacao.endereco,
                                    programacao.numero,
                                    programacao.bairro || '',
                                    programacao.cidade || ''
                                  )}
                                </div>

                                {/* Botão de deletar */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(programacao);
                                  }}
                                  className="mt-2 text-red-500 hover:text-red-700 text-xs"
                                >
                                  Excluir
                                </button>
                              </div>
                            ))}
                            
                            {/* Espaço vazio se não há programações */}
                            {dayProgramacoes.length === 0 && (
                              <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-gray-400">Vazio</span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dialog de confirmação de exclusão */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Excluir Programação"
          message={`Tem certeza que deseja excluir a programação de ${programacaoToDelete?.cliente}?`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteDialog(false)}
        />
      </div>
    </Layout>
  );
}
