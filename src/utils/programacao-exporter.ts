import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Programacao } from '../types/programacao';
import { BombaOption } from '../types/programacao';
import { toBrasiliaDateString, parseDateBR } from './date-utils';

export interface ProgramacaoExportData {
  programacoes: Programacao[];
  bombas: BombaOption[];
  colaboradores: Array<{ id: string; nome: string; funcao: string }>;
  weekStart: Date;
  weekEnd: Date;
}

export interface ProgramacaoDailyExportData {
  programacoes: Programacao[];
  bombas: BombaOption[];
  colaboradores: Array<{ id: string; nome: string; funcao: string }>;
  selectedDate: Date;
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
          'Quantidade de Material (m³)': 0,
          'Peça a ser Concretada': '',
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
      throw new Error(`Erro ao exportar para Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
      throw new Error(`Erro ao exportar para PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Exporta programação diária para PDF com informações essenciais
   */
  static async exportDailyToPDF(data: ProgramacaoDailyExportData): Promise<void> {
    try {
      console.log('🚀 Iniciando exportação PDF diária...');
      
      // Validar dados
      if (!data) {
        throw new Error('Dados não fornecidos');
      }
      
      if (!data.selectedDate) {
        throw new Error('Data não fornecida');
      }
      
      console.log('✅ Validação dos dados passou');
      console.log('📅 Data selecionada:', data.selectedDate);
      console.log('📊 Programações:', data.programacoes.length);
      
      // Filtrar programações do dia selecionado usando fuso horário brasileiro
      if (isNaN(data.selectedDate.getTime())) {
        console.error('❌ Data selecionada é inválida:', data.selectedDate);
        throw new Error('Data selecionada é inválida');
      }
      
      const selectedDateStr = toBrasiliaDateString(data.selectedDate);
      // Converter para formato ISO para comparação com programações
      const selectedDateISO = data.selectedDate.toISOString().split('T')[0];
      console.log('🔍 Data selecionada (Brasília):', selectedDateStr);
      console.log('🔍 Data selecionada (ISO para comparação):', selectedDateISO);
      console.log('🔍 Total de programações disponíveis:', data.programacoes.length);
      
      const dailyProgramacoes = data.programacoes.filter(p => {
        if (!p.data) return false;
        const programacaoDate = p.data.includes('T') ? p.data.split('T')[0] : p.data;
        console.log('🔍 Comparando:', programacaoDate, 'com', selectedDateISO);
        return programacaoDate === selectedDateISO;
      });
      
      console.log('📊 Programações do dia:', dailyProgramacoes.length);
      console.log('📊 Programações filtradas:', dailyProgramacoes.map(p => ({
        id: p.id,
        data: p.data,
        horario: p.horario,
        cliente: p.cliente,
        bomba_id: p.bomba_id,
        volume_previsto: p.volume_previsto,
        quantidade_material: p.quantidade_material,
        peca_concretada: p.peca_concretada,
        fck: p.fck,
        brita: p.brita,
        slump: p.slump
      })));
      
      if (dailyProgramacoes.length === 0) {
        throw new Error('Nenhuma programação encontrada para o dia selecionado');
      }
      
      // Criar PDF otimizado
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      
      // Adicionar cabeçalho otimizado
      this.addDailyPDFHeader(pdf, data);
      
      // Adicionar conteúdo da programação diária
      this.addDailyPDFContent(pdf, dailyProgramacoes, data);
      
      // Adicionar rodapé
      this.addDailyPDFFooter(pdf);
      
      // Gerar nome do arquivo
      const fileName = this.generateDailyFileName(data.selectedDate);
      console.log('📁 Nome do arquivo PDF:', fileName);
      
      // Salvar arquivo
      pdf.save(fileName);
      console.log('✅ PDF diário exportado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao exportar PDF diário:', error);
      throw new Error(`Erro ao exportar PDF diário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Adiciona cabeçalho otimizado para PDF diário
   */
  private static addDailyPDFHeader(pdf: jsPDF, data: ProgramacaoDailyExportData): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    
    // Cores
    const primaryColor = [0, 102, 204]; // Azul
    const secondaryColor = [128, 128, 128]; // Cinza
    
    // Título principal
    pdf.setFontSize(16);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROGRAMAÇÃO DIÁRIA', pageWidth / 2, 22, { align: 'center' });
    
    // Data (evitando problemas de fuso horário)
    pdf.setFontSize(12);
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    
    // Criar date usando componentes individuais para evitar problemas de fuso horário
    const year = data.selectedDate.getFullYear();
    const month = data.selectedDate.getMonth();
    const day = data.selectedDate.getDate();
    const safeDate = new Date(year, month, day);
    
    console.log('🔍 [addDailyPDFHeader] Data original:', data.selectedDate);
    console.log('🔍 [addDailyPDFHeader] Data segura:', safeDate);
    
    const dateStr = safeDate.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    pdf.text(dateStr.toUpperCase(), pageWidth / 2, 32, { align: 'center' });
    
    // Informações da empresa
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.text('FÉLIX MIX / WORLD RENTAL', pageWidth / 2, 42, { align: 'center' });
    
    // Linha separadora
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 50, pageWidth - margin, 50);
  }

  /**
   * Adiciona conteúdo da programação diária
   */
  private static addDailyPDFContent(pdf: jsPDF, programacoes: Programacao[], data: ProgramacaoDailyExportData): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = 58;
    
    // Cores
    const primaryColor = [0, 102, 204];
    const headerColor = [240, 248, 255];
    
    // Ordenar programações por horário
    const sortedProgramacoes = programacoes.sort((a, b) => {
      const timeA = a.horario || '00:00';
      const timeB = b.horario || '00:00';
      return timeA.localeCompare(timeB);
    });
    
    // Cabeçalho da tabela
    pdf.setFontSize(8);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setFont('helvetica', 'bold');
    
    // Desenhar fundo do cabeçalho
    pdf.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
    pdf.rect(margin, yPosition - 5, pageWidth - (margin * 2), 15, 'F');
    
    // Cabeçalhos das colunas
    const headers = ['Horário', 'Bomba', 'Cliente', 'Endereço', 'Vol. Prev.', 'Peça', 'FCK', 'Brita', 'Slump', 'Qtd Mat.', 'Motorista', 'Auxiliares'];
    const colWidths = [12, 12, 20, 25, 15, 18, 10, 10, 12, 12, 18, 20];
    const startX = margin + 5;
    let currentX = startX;
    
    headers.forEach((header, index) => {
      pdf.text(header, currentX, yPosition + 5);
      currentX += colWidths[index];
    });
    
    yPosition += 20;
    
    // Dados das programações
    pdf.setFontSize(7);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    
    sortedProgramacoes.forEach((programacao, index) => {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
        
        // Redesenhar cabeçalho
        pdf.setFontSize(8);
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.setFont('helvetica', 'bold');
        pdf.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
        pdf.rect(margin, yPosition - 5, pageWidth - (margin * 2), 15, 'F');
        
        currentX = startX;
        headers.forEach((header, headerIndex) => {
          pdf.text(header, currentX, yPosition + 5);
          currentX += colWidths[headerIndex];
        });
        
        yPosition += 20;
        pdf.setFontSize(7);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
      }
      
      // Buscar nomes dos colaboradores
      const motoristaNome = this.getColaboradorName(programacao.motorista_operador, data.colaboradores);
      const auxiliaresNomes = this.getAuxiliaresNames(programacao.auxiliares_bomba, data.colaboradores);
      
      // Buscar prefixo da bomba
      const bombaPrefix = this.getBombaPrefix(programacao.bomba_id, data.bombas);
      
      // Debug: Log dos dados da programação
      console.log('🔍 [PDF Debug] Programação:', {
        id: programacao.id,
        horario: programacao.horario,
        volume_previsto: programacao.volume_previsto,
        quantidade_material: programacao.quantidade_material,
        peca_concretada: programacao.peca_concretada,
        fck: programacao.fck,
        brita: programacao.brita,
        slump: programacao.slump
      });

      // Função para formatar horário
      const formatTime = (time: string) => {
        if (!time || time === 'N/A') return 'N/A';
        const [hours] = time.split(':');
        return `${parseInt(hours)}h`;
      };

      // Dados da linha
      const rowData = [
        formatTime(programacao.horario || 'N/A'),
        bombaPrefix,
        (programacao.cliente || 'N/A').substring(0, 15),
        (programacao.endereco || 'N/A').substring(0, 20),
        `${programacao.volume_previsto || 0} m³`,
        (programacao.peca_concretada || 'N/A').substring(0, 12),
        programacao.fck || 'N/A',
        programacao.brita || 'N/A',
        programacao.slump || 'N/A',
        `${programacao.quantidade_material || 0} m³`,
        motoristaNome.substring(0, 12),
        auxiliaresNomes.substring(0, 15)
      ];

      // Debug: Log dos dados da linha
      console.log('🔍 [PDF Debug] Row Data:', rowData);
      
      // Desenhar linha com fundo alternado
      if (index % 2 === 0) {
        pdf.setFillColor(248, 248, 248);
        pdf.rect(margin, yPosition - 3, pageWidth - (margin * 2), 12, 'F');
      }
      
      // Desenhar dados
      currentX = startX;
      rowData.forEach((cell, cellIndex) => {
        pdf.text(cell, currentX, yPosition + 5);
        currentX += colWidths[cellIndex];
      });
      
      yPosition += 10;
    });
    
    // Resumo no final
    yPosition += 6;
    pdf.setFontSize(8);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESUMO DO DIA', margin, yPosition);
    
    yPosition += 6;
    pdf.setFontSize(7);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    
    const totalProgramacoes = sortedProgramacoes.length;
    const bombasUtilizadas = [...new Set(sortedProgramacoes.map(p => this.getBombaPrefix(p.bomba_id, data.bombas)).filter(Boolean))];
    const volumeTotal = sortedProgramacoes.reduce((sum, p) => sum + (p.volume_previsto || 0), 0);
    const quantidadeMaterialTotal = sortedProgramacoes.reduce((sum, p) => sum + (p.quantidade_material || 0), 0);
    
    pdf.text(`Total de Programações: ${totalProgramacoes}`, margin, yPosition);
    yPosition += 5;
    pdf.text(`Bombas Utilizadas: ${bombasUtilizadas.join(', ')}`, margin, yPosition);
    yPosition += 5;
    pdf.text(`Volume Total Previsto: ${volumeTotal.toLocaleString('pt-BR')} m³`, margin, yPosition);
    yPosition += 5;
    pdf.text(`Quantidade Total de Material: ${quantidadeMaterialTotal.toLocaleString('pt-BR')} m³`, margin, yPosition);
  }

  /**
   * Adiciona rodapé para PDF diário
   */
  private static addDailyPDFFooter(pdf: jsPDF): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Programação gerada pelo Sistema de Gestão Félix Mix', 
             pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    const now = new Date();
    const timestamp = now.toLocaleString('pt-BR');
    pdf.text(`Gerado em: ${timestamp}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  /**
   * Gera nome do arquivo para PDF diário
   */
  private static generateDailyFileName(date: Date): string {
    try {
      if (isNaN(date.getTime())) {
        console.error('❌ [generateDailyFileName] Data inválida:', date);
        const fallbackDate = new Date();
        const dateStr = fallbackDate.toISOString().split('T')[0].replace(/-/g, '');
        const timeStr = fallbackDate.toTimeString().split(' ')[0].replace(/:/g, '');
        return `programacao_diaria_${dateStr}_${timeStr}_fallback.pdf`;
      }
      
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
      return `programacao_diaria_${dateStr}_${timeStr}.pdf`;
    } catch (error) {
      console.error('❌ [generateDailyFileName] Erro ao gerar nome:', error);
      const fallbackDate = new Date();
      const dateStr = fallbackDate.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = fallbackDate.toTimeString().split(' ')[0].replace(/:/g, '');
      return `programacao_diaria_${dateStr}_${timeStr}_error.pdf`;
    }
  }

  /**
   * Busca o prefixo da bomba baseado no ID
   */
  private static getBombaPrefix(bombaId: string | undefined, bombas: BombaOption[]): string {
    if (!bombaId) {
      console.log('⚠️ Bomba ID não fornecido');
      return 'N/A';
    }
    
    const bomba = bombas.find(b => b.id === bombaId);
    if (!bomba) {
      console.log('⚠️ Bomba não encontrada para ID:', bombaId);
      console.log('🔍 Bombas disponíveis:', bombas.map(b => ({ id: b.id, prefix: b.prefix })));
      return 'N/A';
    }
    
    console.log('✅ Bomba encontrada:', bomba.prefix, 'para ID:', bombaId);
    return bomba.prefix || 'N/A';
  }

  private static prepareExcelData(data: ProgramacaoExportData): any[] {
    return data.programacoes.map(p => {
      try {
        // Garantir que as datas são válidas usando fuso horário brasileiro
        const dataObj = p.data ? parseDateBR(p.data) : new Date();
        const createdObj = p.created_at ? parseDateBR(p.created_at) : new Date();
        const updatedObj = p.updated_at ? parseDateBR(p.updated_at) : new Date();
        
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
          'Quantidade de Material (m³)': p.quantidade_material || 0,
          'Peça a ser Concretada': p.peca_concretada || '',
          'FCK': p.fck || '',
          'Brita': p.brita || '',
          'Slump': p.slump || '',
          'Motorista/Operador': motoristaNome,
          'Auxiliares': auxiliaresNomes,
          'Bomba': this.getBombaName(p.bomba_id, data.bombas),
          'Empresa do Serviço': this.getBombaEmpresa(p.bomba_id, data.bombas),
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
          'Quantidade de Material (m³)': p.quantidade_material || 0,
          'Peça a ser Concretada': p.peca_concretada || '',
          'FCK': p.fck || '',
          'Brita': p.brita || '',
          'Slump': p.slump || '',
          'Motorista/Operador': p.motorista_operador || '',
          'Auxiliares': p.auxiliares_bomba?.join(', ') || '',
          'Bomba': this.getBombaName(p.bomba_id, data.bombas),
          'Empresa do Serviço': this.getBombaEmpresa(p.bomba_id, data.bombas),
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

  /**
   * Busca o nome da empresa da bomba baseado no ID
   */
  private static getBombaEmpresa(bombaId: string | undefined, bombas: BombaOption[]): string {
    if (!bombaId) return '';
    const bomba = bombas.find(b => b.id === bombaId);
    return bomba?.empresa_nome || '';
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
