import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Programacao } from '../types/programacao';
import { BombaOption } from '../types/programacao';
// import { formatDateBR } from './date-utils';

export interface ProgramacaoExportData {
  programacoes: Programacao[];
  bombas: BombaOption[];
  colaboradores: Array<{ id: string; nome: string; funcao: string }>;
  weekStart: Date;
  weekEnd: Date;
}

export class ProgramacaoExporter {
  static async exportToXLSX(_data: ProgramacaoExportData): Promise<void> {
    try {
      console.log('🚀 Iniciando exportação XLSX...');
      
      // Validar dados
      if (!_data) {
        throw new Error('Dados não fornecidos');
      }
      
      if (!Array.isArray(_data.programacoes)) {
        throw new Error('Programações não é um array');
      }
      
      if (!Array.isArray(_data.bombas)) {
        throw new Error('Bombas não é um array');
      }
      
      console.log('✅ Validação dos dados passou');
      console.log('📊 Programações:', _data.programacoes.length);
      console.log('🚰 Bombas:', _data.bombas.length);
      
      // Preparar dados para o Excel
      const excelData = this.prepareExcelData(_data);
      console.log('📊 Dados preparados:', excelData.length, 'registros');
      
      if (excelData.length === 0) {
        console.warn('⚠️ Nenhum dado para exportar');
        // Criar dados de exemplo para teste
        const emptyData = [{
          'Data': 'Nenhuma programação encontrada',
          'Horário': '',
          'Prefixo Obra': '',
          'Cliente': '',
          'Responsável': '',
          'Endereço': '',
          'Número': '',
          'Bairro': '',
          'Cidade': '',
          'Estado': '',
          'CEP': '',
          'Volume Previsto (m³)': 0,
          'FCK': '',
          'Brita': '',
          'Slump': '',
          'Motorista/Operador': '',
          'Auxiliares': '',
          'Bomba': '',
          'Criado em': '',
          'Atualizado em': ''
        }];
        excelData.push(...emptyData);
      }
      
      // Criar workbook
      const wb = XLSX.utils.book_new();
      
      // Adicionar aba principal com programação
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Programação');
      
      // Adicionar aba com resumo
      const summaryData = this.prepareSummaryData(_data);
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');
      
      // Gerar nome do arquivo
      const fileName = this.generateFileName(_data, 'xlsx');
      console.log('📁 Nome do arquivo:', fileName);
      
      // Tentar diferentes métodos de download
      try {
        // Método 1: XLSX.writeFile (padrão)
        XLSX.writeFile(wb, fileName);
        console.log('✅ Arquivo salvo com XLSX.writeFile');
      } catch (writeError) {
        console.warn('⚠️ XLSX.writeFile falhou, tentando método alternativo:', writeError);
        
        // Método 2: Download manual via blob
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        
        // Criar link de download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        // Adicionar ao DOM e clicar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpar URL
        window.URL.revokeObjectURL(url);
        console.log('✅ Arquivo salvo com método alternativo');
      }
      
    } catch (error) {
      console.error('❌ Erro ao exportar para XLSX:', error);
      throw new Error(`Erro ao exportar para Excel: ${error.message}`);
    }
  }

  static async exportToPDF(_data: ProgramacaoExportData, elementId: string): Promise<void> {
    try {
      console.log('🚀 Iniciando exportação PDF...');
      
      // Validar dados
      if (!_data) {
        throw new Error('Dados não fornecidos');
      }
      
      if (!elementId) {
        throw new Error('ID do elemento não fornecido');
      }
      
      console.log('✅ Validação dos dados passou');
      console.log('📄 Element ID:', elementId);
      
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Elemento '${elementId}' não encontrado para exportação PDF`);
      }

      console.log('📄 Elemento encontrado:', elementId);
      console.log('📄 Elemento:', element);
      
      // Verificar se o elemento tem conteúdo
      if (element.children.length === 0) {
        console.warn('⚠️ Elemento não tem conteúdo para capturar');
      }
      
      // Criar PDF estruturado
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      // Adicionar cabeçalho
      this.addPDFHeader(pdf, _data);
      
      // Adicionar conteúdo da tabela
      await this.addPDFTableContent(pdf, _data, element);
      
      // Adicionar rodapé
      this.addPDFFooter(pdf);
      
      // Gerar nome do arquivo
      const fileName = this.generateFileName(_data, 'pdf');
      console.log('📁 Nome do arquivo PDF:', fileName);
      
      // Tentar diferentes métodos de download
      try {
        // Método 1: pdf.save (padrão)
        pdf.save(fileName);
        console.log('✅ PDF salvo com pdf.save');
      } catch (saveError) {
        console.warn('⚠️ pdf.save falhou, tentando método alternativo:', saveError);
        
        // Método 2: Download manual via blob
        const pdfBlob = pdf.output('blob');
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        // Adicionar ao DOM e clicar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpar URL
        window.URL.revokeObjectURL(url);
        console.log('✅ PDF salvo com método alternativo');
      }

    } catch (error) {
      console.error('❌ Erro ao exportar para PDF:', error);
      throw new Error(`Erro ao exportar para PDF: ${error.message}`);
    }
  }

  private static prepareExcelData(data: ProgramacaoExportData): any[] {
    return data.programacoes.map(p => {
      try {
        // Garantir que as datas são válidas
        const dataObj = p.data ? new Date(p.data) : new Date();
        const createdObj = p.created_at ? new Date(p.created_at) : new Date();
        const updatedObj = p.updated_at ? new Date(p.updated_at) : new Date();
        
        // Buscar nomes dos colaboradores
        const motoristaNome = this.getColaboradorName(p.motorista_operador, data.colaboradores);
        const auxiliaresNomes = this.getAuxiliaresNames(p.auxiliares_bomba, data.colaboradores);
        
        return {
          'Data': dataObj.toLocaleDateString('pt-BR'),
          'Horário': p.horario,
          'Prefixo Obra': p.prefixo_obra || '',
          'Cliente': p.cliente || '',
          'Responsável': p.responsavel || '',
          'Endereço Completo': `${p.endereco}, ${p.numero}${p.bairro ? ` - ${p.bairro}` : ''}${p.cidade ? ` - ${p.cidade}` : ''}${p.estado ? `/${p.estado}` : ''}`,
          'CEP': p.cep,
          'Volume Previsto (m³)': p.volume_previsto || 0,
          'FCK': p.fck || '',
          'Brita': p.brita || '',
          'Slump': p.slump || '',
          'Motorista/Operador': motoristaNome,
          'Auxiliares': auxiliaresNomes,
          'Bomba': this.getBombaName(p.bomba_id, data.bombas),
          'Criado em': createdObj.toLocaleDateString('pt-BR'),
          'Atualizado em': updatedObj.toLocaleDateString('pt-BR')
        };
      } catch (error) {
        console.error('❌ Erro ao processar programação:', p, error);
        // Retornar dados básicos em caso de erro
        return {
          'Data': 'Data inválida',
          'Horário': p.horario || '',
          'Prefixo Obra': p.prefixo_obra || '',
          'Cliente': p.cliente || '',
          'Responsável': p.responsavel || '',
          'Endereço Completo': `${p.endereco || ''}, ${p.numero || ''}`,
          'CEP': p.cep || '',
          'Volume Previsto (m³)': p.volume_previsto || 0,
          'FCK': p.fck || '',
          'Brita': p.brita || '',
          'Slump': p.slump || '',
          'Motorista/Operador': p.motorista_operador || '',
          'Auxiliares': p.auxiliares_bomba?.join(', ') || '',
          'Bomba': this.getBombaName(p.bomba_id, data.bombas),
          'Criado em': 'Data inválida',
          'Atualizado em': 'Data inválida'
        };
      }
    });
  }

  private static prepareSummaryData(data: ProgramacaoExportData): any[] {
    try {
      // Garantir que as datas são objetos Date válidos
      const startDate = data.weekStart instanceof Date ? data.weekStart : new Date(data.weekStart);
      const endDate = data.weekEnd instanceof Date ? data.weekEnd : new Date(data.weekEnd);
      
      // Formatar datas para exibição
      const startStr = startDate.toLocaleDateString('pt-BR');
      const endStr = endDate.toLocaleDateString('pt-BR');
      
      const summary = {
        'Período': `${startStr} a ${endStr}`,
        'Total de Programações': data.programacoes.length,
        'Total de Bombas Utilizadas': new Set(data.programacoes.map(p => p.bomba_id).filter(Boolean)).size,
        'Volume Total Previsto (m³)': data.programacoes.reduce((sum, p) => sum + (p.volume_previsto || 0), 0),
        'Clientes Únicos': new Set(data.programacoes.map(p => p.cliente).filter(Boolean)).size
      };

      return [summary];
    } catch (error) {
      console.error('❌ Erro ao preparar dados de resumo:', error);
      // Fallback com dados básicos
      return [{
        'Período': 'Período não disponível',
        'Total de Programações': data.programacoes?.length || 0,
        'Total de Bombas Utilizadas': 0,
        'Volume Total Previsto (m³)': 0,
        'Clientes Únicos': 0
      }];
    }
  }

  private static getBombaName(bombaId: string | undefined, bombas: BombaOption[]): string {
    if (!bombaId) return '';
    const bomba = bombas.find(b => b.id === bombaId);
    return bomba ? `${bomba.prefix} - ${bomba.model}` : '';
  }

  private static getColaboradorName(colaboradorId: string | undefined, colaboradores: Array<{ id: string; nome: string; funcao: string }>): string {
    if (!colaboradorId) return '';
    const colaborador = colaboradores.find(c => c.id === colaboradorId);
    return colaborador ? `${colaborador.nome} (${colaborador.funcao})` : colaboradorId;
  }

  private static getAuxiliaresNames(auxiliaresIds: string[] | undefined, colaboradores: Array<{ id: string; nome: string; funcao: string }>): string {
    if (!auxiliaresIds || auxiliaresIds.length === 0) return '';
    
    const auxiliaresNomes = auxiliaresIds.map(id => {
      const colaborador = colaboradores.find(c => c.id === id);
      return colaborador ? `${colaborador.nome} (${colaborador.funcao})` : id;
    });
    
    return auxiliaresNomes.join(', ');
  }

  private static addPDFHeader(pdf: jsPDF, data: ProgramacaoExportData): void {
    // Configurações
    const pageWidth = 297; // A4 landscape width
    const margin = 15;
    
    // Título principal
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROGRAMAÇÃO SEMANAL', pageWidth / 2, 20, { align: 'center' });
    
    // Período
    const startDate = data.weekStart instanceof Date ? data.weekStart : new Date(data.weekStart);
    const endDate = data.weekEnd instanceof Date ? data.weekEnd : new Date(data.weekEnd);
    const periodo = `${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`;
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text(periodo, pageWidth / 2, 30, { align: 'center' });
    
    // Informações da empresa
    pdf.setFontSize(14);
    pdf.text('Felix Mix / WorldRental', pageWidth / 2, 40, { align: 'center' });
    
    // Estatísticas rápidas
    const totalProgramacoes = data.programacoes.length;
    const totalBombas = new Set(data.programacoes.map(p => p.bomba_id).filter(Boolean)).size;
    const volumeTotal = data.programacoes.reduce((sum, p) => sum + (p.volume_previsto || 0), 0);
    
    pdf.setFontSize(10);
    pdf.text(`Total: ${totalProgramacoes} programações | ${totalBombas} bombas | ${volumeTotal}m³`, pageWidth / 2, 48, { align: 'center' });
    
    // Linha separadora
    pdf.setLineWidth(0.8);
    pdf.line(margin, 52, pageWidth - margin, 52);
  }

  private static async addPDFTableContent(pdf: jsPDF, data: ProgramacaoExportData, element: HTMLElement): Promise<void> {
    // Capturar o elemento como canvas com melhor qualidade
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0
    });

    // Converter para imagem
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Calcular dimensões para caber na página
    const pageWidth = 297; // A4 landscape width
    const pageHeight = 210; // A4 landscape height
    const margin = 10;
    const headerHeight = 50;
    const footerHeight = 20;
    const availableHeight = pageHeight - headerHeight - footerHeight;
    
    // Calcular dimensões da imagem mantendo proporção
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = availableHeight;
    
    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Se a imagem for muito alta, ajustar escala
    if (imgHeight > maxHeight) {
      imgHeight = maxHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }
    
    // Centralizar a imagem
    const x = (pageWidth - imgWidth) / 2;
    const y = headerHeight + 5;
    
    // Adicionar a imagem
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    
    // Se a imagem não couber em uma página, adicionar nova página
    if (imgHeight > availableHeight) {
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', x, 10, imgWidth, imgHeight);
    }
  }

  private static addPDFFooter(pdf: jsPDF): void {
    const pageWidth = 297; // A4 landscape width
    const pageHeight = 210; // A4 landscape height
    const margin = 15;
    
    // Linha separadora
    pdf.setLineWidth(0.5);
    pdf.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
    
    // Data de geração
    const now = new Date();
    const dataGeracao = `Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(dataGeracao, pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Informações da empresa
    pdf.text('Felix Mix / WorldRental - Sistema de Gestão', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  private static generateFileName(data: ProgramacaoExportData, extension: string): string {
    try {
      // Garantir que as datas são objetos Date válidos
      const startDate = data.weekStart instanceof Date ? data.weekStart : new Date(data.weekStart);
      const endDate = data.weekEnd instanceof Date ? data.weekEnd : new Date(data.weekEnd);
      
      // Verificar se as datas são válidas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('⚠️ Datas inválidas, usando data atual');
        const now = new Date();
        return `Programacao_${now.toISOString().split('T')[0]}.${extension}`;
      }
      
      // Formatar datas para o nome do arquivo
      const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '-');
      const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '-');
      
      return `Programacao_${startStr}_a_${endStr}.${extension}`;
    } catch (error) {
      console.error('❌ Erro ao gerar nome do arquivo:', error);
      // Fallback com data atual
      const now = new Date();
      return `Programacao_${now.toISOString().split('T')[0]}.${extension}`;
    }
  }
}
