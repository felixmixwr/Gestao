import { useState } from 'react';
import { Button } from '../components/Button';
import { ProgramacaoExporter, ProgramacaoExportData } from '../utils/programacao-exporter';
import { DailyExportButton } from './DailyExportButton';
import { toast } from '../lib/toast-hooks';

interface ExportButtonsProps {
  data: ProgramacaoExportData;
  elementId: string;
  className?: string;
}

export function ExportButtons({ data, elementId, className = '' }: ExportButtonsProps) {
  const [exportingXLSX, setExportingXLSX] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const handleExportXLSX = async () => {
    try {
      setExportingXLSX(true);
      await ProgramacaoExporter.exportToXLSX(data);
      toast.success('Programação exportada para Excel com sucesso!');
    } catch (error) {
      console.error('❌ ExportButtons: Erro ao exportar XLSX:', error);
      toast.error(`Erro ao exportar para Excel: ${error.message}`);
    } finally {
      setExportingXLSX(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);
      await ProgramacaoExporter.exportToPDF(data, elementId);
      toast.success('Programação exportada para PDF com sucesso!');
    } catch (error) {
      console.error('❌ ExportButtons: Erro ao exportar PDF:', error);
      toast.error(`Erro ao exportar para PDF: ${error.message}`);
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportXLSX}
        disabled={exportingXLSX || exportingPDF}
        className="flex items-center gap-2"
      >
        {exportingXLSX ? (
          <>
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            Exportando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar Excel
          </>
        )}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        disabled={exportingXLSX || exportingPDF}
        className="flex items-center gap-2"
      >
        {exportingPDF ? (
          <>
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            Exportando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Exportar PDF Semanal
          </>
        )}
      </Button>

      <DailyExportButton
        programacoes={data.programacoes}
        bombas={data.bombas}
        colaboradores={data.colaboradores}
      />
    </div>
  );
}
