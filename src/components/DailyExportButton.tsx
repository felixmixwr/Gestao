import React, { useState } from 'react';
import { Calendar, Download } from 'lucide-react';
import { Button } from './ui/button';
import { ProgramacaoExporter, ProgramacaoDailyExportData } from '../utils/programacao-exporter';
import { Programacao } from '../types/programacao';
import { BombaOption } from '../types/programacao';
import { formatDateSafe, parseDateBR } from '../utils/date-utils';

interface DailyExportButtonProps {
  programacoes: Programacao[];
  bombas: BombaOption[];
  colaboradores: Array<{ id: string; nome: string; funcao: string }>;
  className?: string;
}

export function DailyExportButton({ 
  programacoes, 
  bombas, 
  colaboradores, 
  className = '' 
}: DailyExportButtonProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleExport = async () => {
    if (!selectedDate) {
      alert('Por favor, selecione uma data');
      return;
    }

    try {
      setExporting(true);
      
      const exportData: ProgramacaoDailyExportData = {
        programacoes,
        bombas,
        colaboradores,
        selectedDate: parseDateBR(selectedDate)
      };

      await ProgramacaoExporter.exportDailyToPDF(exportData);
      
      // Fechar o seletor de data após exportação
      setShowDatePicker(false);
      setSelectedDate('');
      
    } catch (error) {
      console.error('Erro ao exportar programação diária:', error);
      alert(`Erro ao exportar: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const getAvailableDates = () => {
    const dates = new Set<string>();
    programacoes.forEach(p => {
      if (p.data) {
        // Usar a função segura de formatação que considera o fuso horário brasileiro
        const dateStr = p.data.includes('T') ? p.data.split('T')[0] : p.data;
        dates.add(dateStr);
      }
    });
    return Array.from(dates).sort().reverse(); // Mais recentes primeiro
  };

  const availableDates = getAvailableDates();

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={() => setShowDatePicker(!showDatePicker)}
        variant="outline"
        className="flex items-center gap-2"
        disabled={exporting}
      >
        <Calendar className="h-4 w-4" />
        {exporting ? 'Exportando...' : 'Exportar Dia'}
      </Button>

      {showDatePicker && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-80">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Data
              </label>
              
              {/* Seletor de data nativo */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                max={new Date().toISOString().split('T')[0]} // Não permitir datas futuras
              />
            </div>

            {/* Lista de datas disponíveis */}
            {availableDates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datas com Programações
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {availableDates.map(date => {
                    const dateObj = new Date(date);
                    const isSelected = selectedDate === date;
                    const programacoesCount = programacoes.filter(p => {
                      if (!p.data) return false;
                      const pDate = p.data.includes('T') ? p.data.split('T')[0] : p.data;
                      return pDate === date;
                    }).length;

                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          isSelected
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>
                            {formatDateSafe(date)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {programacoesCount} programação{programacoesCount !== 1 ? 'ões' : ''}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Informações da data selecionada */}
            {selectedDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="text-sm text-blue-800">
                  <div className="font-medium">
                    {formatDateSafe(selectedDate)}
                  </div>
                  <div className="text-xs mt-1">
                    {programacoes.filter(p => {
                      if (!p.data) return false;
                      const pDate = p.data.includes('T') ? p.data.split('T')[0] : p.data;
                      return pDate === selectedDate;
                    }).length} programação(ões) encontrada(s)
                  </div>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleExport}
                disabled={!selectedDate || exporting}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Exportando...' : 'Exportar PDF'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowDatePicker(false);
                  setSelectedDate('');
                }}
                disabled={exporting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para fechar ao clicar fora */}
      {showDatePicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
}
