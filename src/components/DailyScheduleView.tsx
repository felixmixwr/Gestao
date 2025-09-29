import { useState, useEffect, useRef } from 'react';
import { Programacao } from '../types/programacao';
import { ProgramacaoAPI } from '../lib/programacao-api';
import { DailyScheduleExporter, DailyScheduleExportData } from '../utils/daily-schedule-exporter';
import { Button } from './Button';
import { Loading } from './Loading';
import { ConfirmDialog } from './ConfirmDialog';
import { toast } from '../lib/toast-hooks';
// import { formatDateBR } from '../utils/date-utils';

interface DailyScheduleViewProps {
  date?: string; // YYYY-MM-DD format, default to today
  onClose?: () => void;
}

export function DailyScheduleView({ date, onClose }: DailyScheduleViewProps) {
  const [loading, setLoading] = useState(true);
  const [programacoes, setProgramacoes] = useState<Programacao[]>([]);
  const [bombas, setBombas] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [programacaoToDelete, setProgramacaoToDelete] = useState<Programacao | null>(null);
  const [deleting, setDeleting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Use today's date if not provided
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  // Format date for display
  const displayDate = new Date(targetDate + 'T00:00:00');
  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const dayName = dayNames[displayDate.getDay()];
  const formattedDate = displayDate.toLocaleDateString('pt-BR');

  useEffect(() => {
    loadDailyData();
  }, [targetDate]);

  const loadDailyData = async () => {
    setLoading(true);
    try {
      // Load programações for the specific date
      const [programacoesData, bombasData, colaboradoresData] = await Promise.all([
        ProgramacaoAPI.getByPeriod(targetDate, targetDate),
        ProgramacaoAPI.getBombas(),
        ProgramacaoAPI.getColaboradores(),
      ]);

      // Sort by time
      const sortedProgramacoes = programacoesData.sort((a, b) => 
        a.horario.localeCompare(b.horario)
      );

      setProgramacoes(sortedProgramacoes);
      setBombas(bombasData);
      setColaboradores(colaboradoresData);
    } catch (error) {
      toast.error('Erro ao carregar programações do dia');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const exportData: DailyScheduleExportData = {
        programacoes,
        bombas,
        colaboradores,
        date: displayDate
      };

      // Tentar usar o elemento HTML primeiro, caso contrário usar geração programática
      const elementId = printRef.current ? 'daily-schedule-print' : undefined;
      await DailyScheduleExporter.exportToPDF(exportData, elementId);
      toast.success('PDF da programação diária exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar PDF da programação diária');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM
  };

  const formatAddress = (endereco: string, numero: string, bairro?: string, cidade?: string) => {
    let address = `${endereco}, ${numero}`;
    if (bairro) address += `, ${bairro}`;
    if (cidade) address += ` - ${cidade}`;
    return address;
  };

  const getBombaName = (bombaId?: string) => {
    if (!bombaId) return 'Não definida';
    const bomba = bombas.find(b => b.id === bombaId);
    return bomba ? `${bomba.prefix} - ${bomba.model}` : 'Não encontrada';
  };

  const getColaboradorName = (colaboradorId?: string) => {
    if (!colaboradorId) return '';
    const colaborador = colaboradores.find(c => c.id === colaboradorId);
    return colaborador ? colaborador.nome : '';
  };

  const getAuxiliaresNames = (auxiliaresIds?: string[]) => {
    if (!auxiliaresIds || auxiliaresIds.length === 0) return 'Nenhum';
    return auxiliaresIds.map(id => {
      const colaborador = colaboradores.find(c => c.id === id);
      return colaborador ? colaborador.nome : id;
    }).join(', ');
  };

  // Função para lidar com clique no badge de exclusão
  const handleDeleteClick = (programacao: Programacao) => {
    setProgramacaoToDelete(programacao);
    setShowDeleteDialog(true);
  };

  // Função para confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!programacaoToDelete) return;

    setDeleting(true);
    try {
      await ProgramacaoAPI.delete(programacaoToDelete.id);
      toast.success('Programação excluída com sucesso!');
      
      // Recarregar os dados
      await loadDailyData();
    } catch (error) {
      toast.error('Erro ao excluir programação');
      console.error(error);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setProgramacaoToDelete(null);
    }
  };

  const totalVolume = programacoes.reduce((sum, p) => sum + (p.volume_previsto || 0), 0);
  const uniqueBombas = new Set(programacoes.map(p => p.bomba_id).filter(Boolean)).size;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Programação de {dayName}
            </h2>
            <p className="text-gray-600">{formattedDate}</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600 mr-4">
              <span className="font-medium">{programacoes.length}</span> programações |{' '}
              <span className="font-medium">{uniqueBombas}</span> bombas |{' '}
              <span className="font-medium">{totalVolume}m³</span> total
            </div>
            <Button 
              variant="outline" 
              onClick={handlePrint}
              className="print:hidden"
            >
              🖨️ Imprimir
            </Button>
            <Button 
              onClick={handleExportPDF}
              disabled={exporting}
              className="print:hidden"
            >
              {exporting ? '⏳ Exportando...' : '📄 PDF'}
            </Button>
            {onClose && (
              <Button 
                variant="outline" 
                onClick={onClose}
                className="print:hidden"
              >
                ✕ Fechar
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {programacoes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Nenhuma programação para hoje
              </h3>
              <p className="text-gray-600">
                Não há programações agendadas para {formattedDate}
              </p>
            </div>
          ) : (
            <div id="daily-schedule-print" ref={printRef} className="print-content">
              {/* Print Header */}
              <div className="hidden print:block mb-6 text-center">
                <h1 className="text-2xl font-bold mb-2">PROGRAMAÇÃO DIÁRIA</h1>
                <h2 className="text-xl mb-1">{dayName} - {formattedDate}</h2>
                <p className="text-sm text-gray-600">Felix Mix / WorldRental</p>
                <hr className="my-4" />
              </div>

              {/* Schedule Cards */}
              <div className="space-y-4">
                {programacoes.map((programacao, index) => {
                  // Determinar cor do card baseado no status
                  const isReservado = programacao.status === 'reservado';
                  const cardClasses = isReservado 
                    ? "daily-schedule-card bg-yellow-100 border-2 border-yellow-300 rounded-lg p-6 print:border-yellow-500 print:mb-4 print:break-inside-avoid"
                    : "daily-schedule-card bg-white border-2 border-gray-200 rounded-lg p-6 print:border-gray-400 print:mb-4 print:break-inside-avoid";
                  
                  return (
                  <div 
                    key={programacao.id} 
                    className={cardClasses}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          #{index + 1}
                        </div>
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          ⏰ {formatTime(programacao.horario)}
                        </div>
                        {programacao.prefixo_obra && (
                          <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                            🏗️ {programacao.prefixo_obra}
                          </div>
                        )}
                        {/* Badge de Exclusão */}
                        <button
                          onClick={() => handleDeleteClick(programacao)}
                          className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-red-200 transition-colors print:hidden"
                          title="Excluir programação"
                        >
                          Excluir
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Bomba</div>
                        <div className="font-medium">{getBombaName(programacao.bomba_id)}</div>
                      </div>
                    </div>

                    {/* Main Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      {/* Client Info */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 text-lg">👤 Cliente</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-gray-500">Nome:</span>
                            <div className="font-medium">{programacao.cliente || 'Não informado'}</div>
                          </div>
                          {programacao.responsavel && (
                            <div>
                              <span className="text-sm text-gray-500">Responsável:</span>
                              <div className="font-medium">{programacao.responsavel}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Location Info */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 text-lg">📍 Localização</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-gray-500">Endereço:</span>
                            <div className="font-medium">
                              {formatAddress(programacao.endereco, programacao.numero, programacao.bairro, programacao.cidade)}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">CEP:</span>
                            <div className="font-medium">{programacao.cep}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Technical Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Volume Previsto</div>
                        <div className="text-xl font-bold text-blue-600">
                          {programacao.volume_previsto || 0}m³
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">FCK</div>
                        <div className="font-medium">{programacao.fck || '-'}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-500">Slump</div>
                        <div className="font-medium">{programacao.slump || '-'}</div>
                      </div>
                    </div>

                    {/* Team Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Motorista/Operador:</span>
                        <div className="font-medium">
                          {getColaboradorName(programacao.motorista_operador) || 'Não definido'}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Auxiliares:</span>
                        <div className="font-medium">
                          {getAuxiliaresNames(programacao.auxiliares_bomba)}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Print Footer */}
              <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
                <p>Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                <p>Felix Mix / WorldRental - Sistema de Gestão</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Programação"
        message={`Tem certeza que deseja excluir a programação de ${programacaoToDelete?.cliente} às ${programacaoToDelete ? formatTime(programacaoToDelete.horario) : ''}?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
