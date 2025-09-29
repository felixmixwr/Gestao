import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgramacaoAPI } from '../../lib/programacao-api';
import { Programacao } from '../../types/programacao';
import { Layout } from '../../components/Layout';
import { Loading } from '../../components/Loading';
import { Button } from '../../components/Button';
import { toast } from '../../lib/toast-hooks';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface WeeklyProgramacao extends Programacao {
  dayOfWeek: number; // 0 = domingo, 1 = segunda, etc.
  formattedTime: string;
}

const DAYS_OF_WEEK = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

const DAY_ABBREVIATIONS = [
  'DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'
];

export default function ProgramacaoWeeklyBoard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [programacoes, setProgramacoes] = useState<WeeklyProgramacao[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Calcular início e fim da semana atual
  const getWeekBounds = useCallback((date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day); // Domingo
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Sábado
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }, []);

  // Carregar programações da semana
  const loadProgramacoes = useCallback(async () => {
    try {
      setLoading(true);
      const { start, end } = getWeekBounds(currentWeek);
      
      const data = await ProgramacaoAPI.getByPeriod(start.toISOString(), end.toISOString());
      
      // Processar dados para incluir informações da semana
      const weeklyData: WeeklyProgramacao[] = data.map(p => {
        const programacaoDate = new Date(p.data);
        const dayOfWeek = programacaoDate.getDay();
        
        return {
          ...p,
          dayOfWeek,
          formattedTime: p.horario ? new Date(`2000-01-01T${p.horario}`).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : ''
        };
      });

      setProgramacoes(weeklyData);
    } catch (error) {
      console.error('Erro ao carregar programações:', error);
      toast.error('Erro ao carregar programações da semana');
    } finally {
      setLoading(false);
    }
  }, [currentWeek, getWeekBounds]);

  // Navegação entre semanas
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

  // Formatar data da semana
  const formatWeekRange = () => {
    const { start, end } = getWeekBounds(currentWeek);
    const startStr = start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const endStr = end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  // Deletar programação
  const handleDelete = async (id: string) => {
    try {
      await ProgramacaoAPI.delete(id);
      toast.success('Programação excluída com sucesso');
      loadProgramacoes();
    } catch (error) {
      console.error('Erro ao excluir programação:', error);
      toast.error('Erro ao excluir programação');
    } finally {
      setDeleteId(null);
    }
  };

  // Obter programações por dia
  const getProgramacoesByDay = (dayIndex: number) => {
    return programacoes.filter(p => p.dayOfWeek === dayIndex);
  };

  // Formatar endereço resumido
  const formatAddress = (endereco: string, numero: string, bairro?: string) => {
    const parts = [endereco, numero].filter(Boolean);
    if (bairro) parts.push(bairro);
    return parts.join(', ');
  };

  useEffect(() => {
    loadProgramacoes();
  }, [loadProgramacoes]);

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quadro de Programação</h1>
            <p className="text-gray-600 mt-1">Visualização semanal das programações</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate('/programacao/nova')}
            >
              Nova Programação
            </Button>
          </div>
        </div>

        {/* Navegação da Semana */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousWeek}
            >
              ← Semana Anterior
            </Button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {formatWeekRange()}
              </h2>
              <Button
                variant="outline"
                onClick={goToCurrentWeek}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Ir para esta semana
              </Button>
            </div>
            
            <Button
              variant="outline"
              onClick={goToNextWeek}
            >
              Próxima Semana →
            </Button>
          </div>
        </div>

        {/* Quadro Semanal */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-gray-200">
            {DAYS_OF_WEEK.map((day, index) => {
              const dayProgramacoes = getProgramacoesByDay(index);
              const { start } = getWeekBounds(currentWeek);
              const dayDate = new Date(start);
              dayDate.setDate(start.getDate() + index);
              const isToday = dayDate.toDateString() === new Date().toDateString();
              
              return (
                <div key={day} className="min-h-[600px]">
                  {/* Cabeçalho do Dia */}
                  <div className={`p-4 text-center border-b ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      {DAY_ABBREVIATIONS[index]}
                    </div>
                    <div className={`text-lg font-semibold ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                      {dayDate.getDate()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {day}
                    </div>
                  </div>

                  {/* Programações do Dia */}
                  <div className="p-2 space-y-2 min-h-[520px]">
                    {dayProgramacoes.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm py-8">
                        Nenhuma programação
                      </div>
                    ) : (
                      dayProgramacoes.map((programacao) => (
                        <div
                          key={programacao.id}
                          className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/programacao/${programacao.id}`)}
                        >
                          <div className="space-y-2">
                            {/* Horário */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-blue-600">
                                {programacao.formattedTime}
                              </span>
                              <div className="flex space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/programacao/${programacao.id}`);
                                  }}
                                  className="text-gray-400 hover:text-blue-600 p-1"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteId(programacao.id);
                                  }}
                                  className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium hover:bg-red-200 transition-colors"
                                  title="Excluir programação"
                                >
                                  Excluir
                                </button>
                              </div>
                            </div>

                            {/* Cliente */}
                            {programacao.cliente && (
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {programacao.cliente}
                              </div>
                            )}

                            {/* Prefixo da Obra */}
                            {programacao.prefixo_obra && (
                              <div className="text-xs text-gray-600">
                                {programacao.prefixo_obra}
                              </div>
                            )}

                            {/* Endereço */}
                            <div className="text-xs text-gray-500 truncate">
                              {formatAddress(programacao.endereco, programacao.numero, programacao.bairro)}
                            </div>

                            {/* Bomba */}
                            {programacao.bomba_id && (
                              <div className="text-xs text-blue-600">
                                🚰 Bomba {programacao.bomba_id.slice(0, 8)}...
                              </div>
                            )}

                            {/* Volume */}
                            {programacao.volume_previsto && (
                              <div className="text-xs text-green-600">
                                📦 {programacao.volume_previsto} m³
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estatísticas da Semana */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Total de Programações</div>
            <div className="text-2xl font-bold text-gray-900">{programacoes.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Dias com Programação</div>
            <div className="text-2xl font-bold text-gray-900">
              {new Set(programacoes.map(p => p.dayOfWeek)).size}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Volume Total (m³)</div>
            <div className="text-2xl font-bold text-gray-900">
              {programacoes.reduce((sum, p) => sum + (p.volume_previsto || 0), 0).toFixed(1)}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-500">Bombas Utilizadas</div>
            <div className="text-2xl font-bold text-gray-900">
              {new Set(programacoes.map(p => p.bomba_id).filter(Boolean)).size}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        title="Excluir Programação"
        message="Tem certeza que deseja excluir esta programação? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </Layout>
  );
}

