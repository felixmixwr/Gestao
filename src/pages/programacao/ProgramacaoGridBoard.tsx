import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgramacaoAPI } from '../../lib/programacao-api';
import { Programacao, BombaOption } from '../../types/programacao';
import { Layout } from '../../components/Layout';
import { Loading } from '../../components/Loading';
import { Button } from '../../components/Button';
import { toast } from '../../lib/toast-hooks';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ExportButtons } from '../../components/ExportButtons';
import { getWeekBoundsBrasilia, getDayOfWeekBR, formatDateToLocalString } from '../../utils/date-utils';
import { DailyScheduleView } from '../../components/DailyScheduleView';

const DAYS_OF_WEEK = [
  'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'
];

export function ProgramacaoGridBoard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [programacoes, setProgramacoes] = useState<Programacao[]>([]);
  const [bombas, setBombas] = useState<BombaOption[]>([]);
  const [colaboradores, setColaboradores] = useState<Array<{ id: string; nome: string; funcao: string }>>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [programacaoToDelete, setProgramacaoToDelete] = useState<Programacao | null>(null);
  const [showDailyView, setShowDailyView] = useState(false);

  // Função para obter os limites da semana (usando fuso horário de Brasília)
  const getWeekBounds = (date: Date) => {
    return getWeekBoundsBrasilia(date);
  };

  // Carregar bombas disponíveis
  const loadBombas = useCallback(async () => {
    try {
      const bombasData = await ProgramacaoAPI.getBombas();
      setBombas(bombasData);
    } catch (error) {
      console.error('Erro ao carregar bombas:', error);
      toast.error('Erro ao carregar bombas');
    }
  }, []);

  // Carregar colaboradores disponíveis
  const loadColaboradores = useCallback(async () => {
    try {
      const colaboradoresData = await ProgramacaoAPI.getColaboradores();
      setColaboradores(colaboradoresData);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      toast.error('Erro ao carregar colaboradores');
    }
  }, []);

  // Carregar programações da semana
  const loadProgramacoes = useCallback(async () => {
    try {
      setLoading(true);
      const { start, end } = getWeekBounds(currentWeek);
      
      // Usar datas simples no formato YYYY-MM-DD
      const startDate = formatDateToLocalString(start);
      const endDate = formatDateToLocalString(end);
      
      const data = await ProgramacaoAPI.getByPeriod(startDate, endDate);
      setProgramacoes(data);
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
      const programacaoDate = new Date(p.data);
      const programacaoDayOfWeek = programacaoDate.getDay();
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

  // Obter classes CSS baseadas no status da programação
  const getProgramacaoClasses = (status: string) => {
    // Verificação mais robusta para status reservado
    const isReservado = status && status.toLowerCase().trim() === 'reservado';
    
    if (isReservado) {
      return {
        card: 'bg-yellow-50 border border-yellow-200 rounded-lg p-3 cursor-pointer hover:bg-yellow-100 transition-colors',
        hora: 'text-sm font-semibold text-yellow-800 mb-1',
        cliente: 'text-sm font-medium text-gray-900 mb-1 truncate',
        volume: 'text-xs text-gray-600 mb-1',
        local: 'text-xs text-gray-500 truncate'
      };
    } else {
      return {
        card: 'bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition-colors',
        hora: 'text-sm font-semibold text-blue-800 mb-1',
        cliente: 'text-sm font-medium text-gray-900 mb-1 truncate',
        volume: 'text-xs text-gray-600 mb-1',
        local: 'text-xs text-gray-500 truncate'
      };
    }
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
    loadColaboradores();
  }, [loadBombas, loadColaboradores]);

  useEffect(() => {
    loadProgramacoes();
  }, [loadProgramacoes]);

  // Obter informações da semana atual
  const { start: weekStart, end: weekEnd } = getWeekBounds(currentWeek);
  const weekRange = `${weekStart.toLocaleDateString('pt-BR')} - ${weekEnd.toLocaleDateString('pt-BR')}`;

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
              className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              📅 Semana Atual
            </Button>
            
            <Button
              onClick={goToNextWeek}
              variant="outline"
              size="sm"
            >
              Próxima Semana →
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowDailyView(true)}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              📅 Hoje
            </Button>
            
            <Button
              onClick={() => navigate('/programacao/nova')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Nova Programação
            </Button>
          </div>
        </div>

        {/* Botões de Exportação */}
        <div className="flex justify-end mb-4">
          <ExportButtons
            data={{
              programacoes,
              bombas,
              colaboradores,
              weekStart,
              weekEnd
            }}
            elementId="programacao-grid"
            className="mr-4"
          />
        </div>

        {/* Grid Layout */}
        <div id="programacao-grid" className="bg-white rounded-lg shadow overflow-hidden print-friendly">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse print-table">
              {/* Header com dias da semana */}
              <thead>
                <tr className="bg-gray-50 print-header">
                  <th className="w-32 p-4 text-left font-semibold text-gray-700 border-r border-gray-200 print-cell">
                    Bomba
                  </th>
                  {DAYS_OF_WEEK.map((day, index) => {
                    const dayDate = new Date(weekStart);
                    dayDate.setDate(dayDate.getDate() + index);
                    
                    return (
                      <th key={index} className="w-48 p-4 text-center font-semibold text-gray-700 border-r border-gray-200 last:border-r-0 print-cell">
                        <div className="text-sm font-bold">{day}</div>
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
                  <tr key={bomba.id} className={`${bombaIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} print-row`}>
                    {/* Coluna da bomba */}
                    <td className="w-32 p-4 font-medium text-gray-900 border-r border-gray-200 sticky left-0 bg-inherit print-cell">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">{bomba.prefix}</div>
                        {bomba.has_programacao && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-medium">
                            📅
                          </span>
                        )}
                        {bomba.is_terceira && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full font-medium">
                            🔗
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{bomba.model}</div>
                    </td>

                    {/* Colunas dos dias */}
                    {DAYS_OF_WEEK.map((_, dayIndex) => {
                      const dayProgramacoes = getProgramacoesForBombaAndDay(bomba.id, dayIndex);
                      
                      return (
                        <td key={dayIndex} className="w-48 p-2 border-r border-gray-200 last:border-r-0 align-top print-cell">
                          <div className="space-y-2 min-h-[100px]">
                            {dayProgramacoes.map((programacao) => {
                              const classes = getProgramacaoClasses(programacao.status);
                              return (
                                <div
                                  key={programacao.id}
                                  className={`${classes.card} print-programacao`}
                                  onClick={() => navigate(`/programacao/${programacao.id}`)}
                                >
                                  {/* Hora */}
                                  <div className={classes.hora}>
                                    {formatTime(programacao.horario)}
                                  </div>
                                  
                                  {/* Cliente */}
                                  <div className={classes.cliente}>
                                    {programacao.cliente || 'Cliente não informado'}
                                  </div>
                                  
                                  {/* Volume */}
                                  <div className={classes.volume}>
                                    {programacao.volume_previsto}m³
                                  </div>
                                  
                                  {/* Local */}
                                  <div className={classes.local}>
                                    {formatLocation(
                                      programacao.endereco,
                                      programacao.numero,
                                      programacao.bairro || '',
                                      programacao.cidade || ''
                                    )}
                                  </div>

                                  {/* Botão de deletar */}
                                  <div className="mt-2 flex justify-end">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(programacao);
                                      }}
                                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                                    >
                                      Excluir
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Espaço vazio se não há programações */}
                            {dayProgramacoes.length === 0 && (
                              <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center print-empty">
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

        {/* Daily Schedule View */}
        {showDailyView && (
          <DailyScheduleView 
            onClose={() => setShowDailyView(false)}
          />
        )}
      </div>
    </Layout>
  );
}
