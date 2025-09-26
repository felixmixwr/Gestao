import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Programacao } from '../types/programacao';
import { BombaOption } from '../types/programacao';
import { formatDateBR } from './date-utils';

export interface ProgramacaoExportData {
  programacoes: Programacao[];
  bombas: BombaOption[];
  weekStart: Date;
  weekEnd: Date;
}

export class ProgramacaoExporter {
  static async exportToXLSX(data: ProgramacaoExportData): Promise<void> {
    try {
      // Preparar dados para o Excel
      const excelData = this.prepareExcelData(data);
      
      // Criar workbook
      const wb = XLSX.utils.book_new();
      
      // Adicionar aba principal com programação
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Programação');
      
      // Adicionar aba com resumo
      const summaryData = this.prepareSummaryData(data);
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
      
      // Gerar nome do arquivo
      const fileName = this.generateFileName(data, 'xlsx');
      
      // Salvar arquivo
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Erro ao exportar para XLSX:', error);
      throw new Error('Erro ao exportar para Excel');
    }
  }

  static async exportToPDF(data: ProgramacaoExportData, elementId: string): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Elemento não encontrado para exportação PDF');
      }

      // Capturar o elemento como canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Criar PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      const imgWidth = 297; // A4 landscape width in mm
      const pageHeight = 210; // A4 landscape height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Adicionar primeira página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Adicionar páginas adicionais se necessário
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Gerar nome do arquivo
      const fileName = this.generateFileName(data, 'pdf');
      
      // Salvar arquivo
      pdf.save(fileName);

    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
      throw new Error('Erro ao exportar para PDF');
    }
  }

  private static prepareExcelData(data: ProgramacaoExportData): any[] {
    return data.programacoes.map(p => ({
      'Data': formatDateBR(p.data),
      'Horário': p.horario,
      'Prefixo Obra': p.prefixo_obra || '',
      'Cliente': p.cliente || '',
      'Responsável': p.responsavel || '',
      'Endereço': p.endereco,
      'Número': p.numero,
      'Bairro': p.bairro || '',
      'Cidade': p.cidade || '',
      'Estado': p.estado || '',
      'CEP': p.cep,
      'Volume Previsto (m³)': p.volume_previsto || 0,
      'FCK': p.fck || '',
      'Brita': p.brita || '',
      'Slump': p.slump || '',
      'Motorista/Operador': p.motorista_operador || '',
      'Auxiliares': p.auxiliares_bomba?.join(', ') || '',
      'Bomba': this.getBombaName(p.bomba_id, data.bombas),
      'Criado em': formatDateBR(p.created_at),
      'Atualizado em': formatDateBR(p.updated_at)
    }));
  }

  private static prepareSummaryData(data: ProgramacaoExportData): any[] {
    const summary = {
      'Período': `${formatDateBR(data.weekStart.toISOString())} a ${formatDateBR(data.weekEnd.toISOString())}`,
      'Total de Programações': data.programacoes.length,
      'Total de Bombas Utilizadas': new Set(data.programacoes.map(p => p.bomba_id).filter(Boolean)).size,
      'Volume Total Previsto (m³)': data.programacoes.reduce((sum, p) => sum + (p.volume_previsto || 0), 0),
      'Clientes Únicos': new Set(data.programacoes.map(p => p.cliente).filter(Boolean)).size
    };

    return [summary];
  }

  private static getBombaName(bombaId: string | undefined, bombas: BombaOption[]): string {
    if (!bombaId) return '';
    const bomba = bombas.find(b => b.id === bombaId);
    return bomba ? `${bomba.prefix} - ${bomba.model}` : '';
  }

  private static generateFileName(data: ProgramacaoExportData, extension: string): string {
    const startDate = formatDateBR(data.weekStart.toISOString()).replace(/\//g, '-');
    const endDate = formatDateBR(data.weekEnd.toISOString()).replace(/\//g, '-');
    return `Programacao_${startDate}_a_${endDate}.${extension}`;
  }
}
