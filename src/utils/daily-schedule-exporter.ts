import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Programacao } from '../types/programacao';

export interface DailyScheduleExportData {
  programacoes: Programacao[];
  bombas: Array<{ id: string; prefix: string; model: string; brand: string }>;
  colaboradores: Array<{ id: string; nome: string; funcao: string }>;
  date: Date;
}

export class DailyScheduleExporter {
  /**
   * Exporta a programação diária para PDF de forma otimizada
   */
  static async exportToPDF(data: DailyScheduleExportData, elementId?: string): Promise<void> {
    try {
      console.log('🚀 Iniciando exportação PDF da programação diária...');
      
      // Validar dados
      if (!data || !data.date) {
        throw new Error('Dados não fornecidos ou data inválida');
      }

      // Criar PDF no formato A4 retrato
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      
      // Adicionar cabeçalho
      this.addDailyPDFHeader(pdf, data);
      
      // Se há um elemento específico para capturar, usar html2canvas
      if (elementId) {
        await this.addPDFContentFromElement(pdf, elementId);
      } else {
        // Caso contrário, gerar conteúdo programaticamente
        this.addPDFContentProgrammatic(pdf, data);
      }
      
      // Adicionar rodapé
      this.addDailyPDFFooter(pdf);
      
      // Gerar nome do arquivo
      const fileName = this.generateDailyFileName(data.date);
      console.log('📁 Nome do arquivo PDF:', fileName);
      
      // Salvar o arquivo
      pdf.save(fileName);
      console.log('✅ PDF da programação diária exportado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao exportar programação diária para PDF:', error);
      throw new Error(`Erro ao exportar programação diária para PDF: ${error.message}`);
    }
  }

  /**
   * Adiciona cabeçalho específico para programação diária
   */
  private static addDailyPDFHeader(pdf: jsPDF, data: DailyScheduleExportData): void {
    const pageWidth = 210; // A4 portrait width
    const margin = 15;
    
    // Título principal
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROGRAMAÇÃO DIÁRIA', pageWidth / 2, 20, { align: 'center' });
    
    // Data
    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const dayName = dayNames[data.date.getDay()];
    const formattedDate = data.date.toLocaleDateString('pt-BR');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${dayName} - ${formattedDate}`, pageWidth / 2, 30, { align: 'center' });
    
    // Informações da empresa
    pdf.setFontSize(12);
    pdf.text('Felix Mix / WorldRental', pageWidth / 2, 40, { align: 'center' });
    
    // Estatísticas rápidas
    const totalProgramacoes = data.programacoes.length;
    const totalBombas = new Set(data.programacoes.map(p => p.bomba_id).filter(Boolean)).size;
    const volumeTotal = data.programacoes.reduce((sum, p) => sum + (p.volume_previsto || 0), 0);
    
    pdf.setFontSize(10);
    pdf.text(`${totalProgramacoes} programações | ${totalBombas} bombas | ${volumeTotal}m³`, pageWidth / 2, 48, { align: 'center' });
    
    // Linha separadora
    pdf.setLineWidth(0.8);
    pdf.line(margin, 52, pageWidth - margin, 52);
  }

  /**
   * Adiciona conteúdo capturando um elemento HTML
   */
  private static async addPDFContentFromElement(pdf: jsPDF, elementId: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Elemento '${elementId}' não encontrado para exportação PDF`);
    }

    console.log('📄 Capturando elemento:', elementId);
    
    // Capturar o elemento como canvas com alta qualidade
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
    const pageWidth = 210; // A4 portrait width
    const pageHeight = 297; // A4 portrait height
    const margin = 10;
    const headerHeight = 55;
    const footerHeight = 20;
    const availableHeight = pageHeight - headerHeight - footerHeight;
    
    // Calcular dimensões da imagem mantendo proporção
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = availableHeight;
    
    let imgWidth = maxWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Se a imagem for muito alta, dividir em páginas
    if (imgHeight > maxHeight) {
      // Calcular quantas páginas serão necessárias
      const pages = Math.ceil(imgHeight / maxHeight);
      const pageImgHeight = imgHeight / pages;
      
      for (let i = 0; i < pages; i++) {
        if (i > 0) {
          pdf.addPage();
          this.addDailyPDFHeader(pdf, { 
            programacoes: [], 
            bombas: [], 
            colaboradores: [], 
            date: new Date() 
          } as DailyScheduleExportData);
        }
        
        // Calcular posição Y para esta página
        const sourceY = (canvas.height / pages) * i;
        const sourceHeight = canvas.height / pages;
        
        // Criar canvas temporário para esta seção
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, -sourceY);
          const tempImgData = tempCanvas.toDataURL('image/png', 1.0);
          
          const x = (pageWidth - imgWidth) / 2;
          const y = headerHeight + 5;
          
          pdf.addImage(tempImgData, 'PNG', x, y, imgWidth, pageImgHeight);
        }
      }
    } else {
      // Imagem cabe em uma página
      const x = (pageWidth - imgWidth) / 2;
      const y = headerHeight + 5;
      
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    }
  }

  /**
   * Adiciona conteúdo gerado programaticamente
   */
  private static addPDFContentProgrammatic(pdf: jsPDF, data: DailyScheduleExportData): void {
    const pageWidth = 210;
    const margin = 15;
    let currentY = 60;
    
    if (data.programacoes.length === 0) {
      // Mensagem quando não há programações
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Nenhuma programação agendada para este dia', pageWidth / 2, currentY + 20, { align: 'center' });
      return;
    }

    // Ordenar programações por horário
    const sortedProgramacoes = [...data.programacoes].sort((a, b) => 
      a.horario.localeCompare(b.horario)
    );

    sortedProgramacoes.forEach((programacao, index) => {
      // Verificar se precisa de nova página
      if (currentY > 250) {
        pdf.addPage();
        this.addDailyPDFHeader(pdf, data);
        currentY = 60;
      }

      // Cabeçalho da programação
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${programacao.horario} - ${programacao.prefixo_obra || 'S/N'}`, margin, currentY);
      currentY += 7;

      // Cliente
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Cliente: ${programacao.cliente || 'Não informado'}`, margin + 5, currentY);
      currentY += 5;

      // Endereço
      const endereco = `${programacao.endereco}, ${programacao.numero}${programacao.bairro ? ` - ${programacao.bairro}` : ''}`;
      pdf.text(`Endereço: ${endereco}`, margin + 5, currentY);
      currentY += 5;

      // Detalhes técnicos
      if (programacao.volume_previsto || programacao.fck || programacao.slump) {
        const detalhes = [
          programacao.volume_previsto ? `${programacao.volume_previsto}m³` : '',
          programacao.fck ? `FCK ${programacao.fck}` : '',
          programacao.slump ? `Slump ${programacao.slump}` : ''
        ].filter(Boolean).join(' | ');
        
        pdf.text(`Especificações: ${detalhes}`, margin + 5, currentY);
        currentY += 5;
      }

      // Bomba
      const bomba = data.bombas.find(b => b.id === programacao.bomba_id);
      if (bomba) {
        pdf.text(`Bomba: ${bomba.prefix} - ${bomba.model}`, margin + 5, currentY);
        currentY += 5;
      }

      // Equipe
      const motorista = data.colaboradores.find(c => c.id === programacao.motorista_operador);
      if (motorista) {
        pdf.text(`Motorista: ${motorista.nome}`, margin + 5, currentY);
        currentY += 5;
      }

      if (programacao.auxiliares_bomba && programacao.auxiliares_bomba.length > 0) {
        const auxiliares = programacao.auxiliares_bomba.map(id => {
          const aux = data.colaboradores.find(c => c.id === id);
          return aux ? aux.nome : id;
        }).join(', ');
        pdf.text(`Auxiliares: ${auxiliares}`, margin + 5, currentY);
        currentY += 5;
      }

      // Linha separadora
      currentY += 3;
      pdf.setLineWidth(0.3);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;
    });
  }

  /**
   * Adiciona rodapé específico para programação diária
   */
  private static addDailyPDFFooter(pdf: jsPDF): void {
    const pageWidth = 210;
    const pageHeight = 297;
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

  /**
   * Gera nome do arquivo para programação diária
   */
  private static generateDailyFileName(date: Date): string {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const dayNames = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
      const dayName = dayNames[date.getDay()];
      
      return `Programacao_Diaria_${dayName}_${dateStr.replace(/-/g, '-')}.pdf`;
    } catch (error) {
      console.error('❌ Erro ao gerar nome do arquivo:', error);
      const now = new Date();
      return `Programacao_Diaria_${now.toISOString().split('T')[0]}.pdf`;
    }
  }

  /**
   * Exporta para Excel (XLSX) - versão simplificada para programação diária
   */
  static async exportToXLSX(data: DailyScheduleExportData): Promise<void> {
    // Esta função pode ser implementada futuramente se necessário
    // Por enquanto, focamos na exportação PDF que é o principal requisito
    throw new Error('Exportação para Excel não implementada para programação diária');
  }
}
