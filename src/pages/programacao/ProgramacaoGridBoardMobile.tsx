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
import { getWeekBoundsBrasilia, getDayOfWeekBR } from '../../utils/date-utils';
import { DailyScheduleView } from '../../components/DailyScheduleView';
import { ChevronLeft, ChevronRight, Calendar, Plus, Trash2, Clock, MapPin, Users } from 'lucide-react';

const DAYS_OF_WEEK = [
  'Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'
];

export function ProgramacaoGridBoardMobile() {
  const navigate = useNavigate();
  const [programacoes, setProgramacoes] = useState<Programacao[]>([]);
  const [bombas, setBombas] = useState<BombaOption[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const { start } = getWeekBoundsBrasilia(today);
    return start;
  });
  const [showDailyView, setShowDailyView] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; programacao: Programacao | null }>({
    show: false,
    programacao: null
  });

  // Estado para controle mobile
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = Domingo, 1 = Segunda, etc.

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const weekStart = currentWeekStart;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekRange = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')} - ${weekEnd.getDate().toString().padStart(2, '0')}/${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}`;

  useEffect(() => {
    loadData();
  }, [currentWeekStart]);

  const loadData = async () => {
    setLoading(true);
    try {
      const startDateStr = weekStart.toISOString().split('T')[0];
      const endDateStr = weekEnd.toISOString().split('T')[0];

      const [programacoesData, bombasData, colaboradoresData] = await Promise.all([
        ProgramacaoAPI.getByPeriod(startDateStr, endDateStr),
        ProgramacaoAPI.getBombas(),
        ProgramacaoAPI.getColaboradores()
      ]);

      setProgramacoes(programacoesData);
      setBombas(bombasData);
      setColaboradores(colaboradoresData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da programação');
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const { start } = getWeekBoundsBrasilia(today);
    setCurrentWeekStart(start);
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatLocation = (endereco: string, numero: string, bairro: string, cidade: string) => {
    const parts = [endereco, numero, bairro, cidade].filter(Boolean);
    return parts.join(', ');
  };

  const getProgramacoesForBombaAndDay = (bombaId: string, dayIndex: number) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + dayIndex);
    const dayStr = dayDate.toISOString().split('T')[0];

    return programacoes.filter(p => 
      p.bomba_id === bombaId && 
      p.data === dayStr
    ).sort((a, b) => a.horario.localeCompare(b.horario));
  };

  // Função para obter a data selecionada
  const getSelectedDate = () => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + selectedDay);
    return dayDate.toISOString().split('T')[0];
  };

  const getProgramacoesForDay = (dayIndex: number) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + dayIndex);
    const dayStr = dayDate.toISOString().split('T')[0];

    return programacoes.filter(p => p.data === dayStr)
      .sort((a, b) => a.horario.localeCompare(b.horario));
  };

  const handleDeleteClick = (programacao: Programacao) => {
    setDeleteConfirm({
      show: true,
      programacao
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.programacao) return;

    try {
      await ProgramacaoAPI.delete(deleteConfirm.programacao.id);
      toast.success('Programação excluída com sucesso');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir programação:', error);
      toast.error('Erro ao excluir programação');
    } finally {
      setDeleteConfirm({ show: false, programacao: null });
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  // Versão Mobile Otimizada
  if (isMobile) {
    return (
      <Layout>
        <div className="p-4 pb-24">
          {/* Header Mobile */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Programação</h1>
                <p className="text-sm text-gray-600">{weekRange}</p>
              </div>
              <Button
                onClick={() => navigate('/programacao/nova')}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova
              </Button>
            </div>

            {/* Navegação Mobile */}
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={goToPreviousWeek}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Anterior</span>
              </Button>
              
              <Button
                onClick={goToCurrentWeek}
                variant="outline"
                size="sm"
                className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Hoje
              </Button>
              
              <Button
                onClick={goToNextWeek}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <span className="hidden sm:inline mr-1">Próxima</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Seletor de Dias Mobile */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {DAYS_OF_WEEK.map((day, index) => {
                const dayDate = new Date(weekStart);
                dayDate.setDate(dayDate.getDate() + index);
                const isToday = dayDate.toDateString() === new Date().toDateString();
                const isSelected = selectedDay === index;
                const programacoesCount = getProgramacoesForDay(index).length;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDay(index)}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : isToday
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-xs">{day}</div>
                      <div className="text-xs font-bold">{dayDate.getDate()}</div>
                      {programacoesCount > 0 && (
                        <div className="text-xs mt-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center mx-auto">
                          {programacoesCount}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de Programações do Dia Selecionado */}
          <div className="space-y-3">
            {getProgramacoesForDay(selectedDay).map((programacao) => {
              const bomba = bombas.find(b => b.id === programacao.bomba_id);
              
              return (
                <div
                  key={programacao.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-800">
                        {formatTime(programacao.horario)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(programacao);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Excluir programação"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Informações da Bomba */}
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {bomba?.prefix || 'Bomba não encontrada'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {bomba?.model || ''}
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-900">
                      {programacao.cliente || 'Cliente não informado'}
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="mb-3">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Volume:</span> {programacao.volume_previsto}m³
                    </div>
                  </div>

                  {/* Local */}
                  <div className="mb-3">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-600">
                        {formatLocation(
                          programacao.endereco,
                          programacao.numero,
                          programacao.bairro || '',
                          programacao.cidade || ''
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Motorista/Operador */}
                  {programacao.motorista_operador && (
                    <div className="mb-3">
                      <div className="flex items-start space-x-2">
                        <Users className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Motorista:</span> {programacao.motorista_operador}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Responsável */}
                  {programacao.responsavel && (
                    <div className="mb-3">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Responsável:</span> {programacao.responsavel}
                      </div>
                    </div>
                  )}

                  {/* Botão de Ação */}
                  <div className="pt-3 border-t border-gray-100">
                    <Button
                      onClick={() => navigate(`/programacao/${programacao.id}`)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Mensagem quando não há programações */}
            {getProgramacoesForDay(selectedDay).length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma programação
                </h3>
                <p className="text-gray-500 mb-4">
                  Não há programações para este dia
                </p>
                <Button
                  onClick={() => navigate('/programacao/nova')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Programação
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Confirmação */}
        <ConfirmDialog
          isOpen={deleteConfirm.show}
          onCancel={() => setDeleteConfirm({ show: false, programacao: null })}
          onConfirm={handleDeleteConfirm}
          title="Excluir Programação"
          message="Tem certeza que deseja excluir esta programação?"
        />
      </Layout>
    );
  }

  // Versão Desktop (mantida original)
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
              className="bg-blue-600 hover:bg-blue-700"
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

        {/* Grid Layout Desktop */}
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
                      <div className="text-sm font-semibold">{bomba.prefix}</div>
                      <div className="text-xs text-gray-500">{bomba.model}</div>
                    </td>

                    {/* Colunas dos dias */}
                    {DAYS_OF_WEEK.map((_, dayIndex) => {
                      const dayProgramacoes = getProgramacoesForBombaAndDay(bomba.id, dayIndex);
                      
                      return (
                        <td key={dayIndex} className="w-48 p-2 border-r border-gray-200 last:border-r-0 align-top print-cell">
                          <div className="space-y-2 min-h-[100px]">
                            {dayProgramacoes.map((programacao) => (
                              <div
                                key={programacao.id}
                                className="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100 transition-colors print-programacao"
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
                                  className="mt-2 text-red-500 hover:text-red-700 text-xs print-hidden"
                                >
                                  Excluir
                                </button>
                              </div>
                            ))}
                            
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

        {/* Modal de Confirmação */}
        <ConfirmDialog
          isOpen={deleteConfirm.show}
          onCancel={() => setDeleteConfirm({ show: false, programacao: null })}
          onConfirm={handleDeleteConfirm}
          title="Excluir Programação"
          message="Tem certeza que deseja excluir esta programação?"
        />

        {/* Modal de Visualização Diária */}
        {showDailyView && (
          <DailyScheduleView
            date={getSelectedDate()}
            onClose={() => setShowDailyView(false)}
          />
        )}
      </div>
    </Layout>
  );
}

// Export default para compatibilidade
export default ProgramacaoGridBoardMobile;
