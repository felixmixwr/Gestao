import jsPDF from 'jspdf';
import { ExpenseWithRelations } from '../types/financial';
import { formatCurrency, formatDate } from '../types/financial';

export interface ExpensesExportData {
  expenses: ExpenseWithRelations[];
  filters?: {
    company_id?: string;
    pump_id?: string;
    categoria?: string[];
    tipo_custo?: string[];
    status?: string[];
    data_inicio?: string;
    data_fim?: string;
  };
  companyName?: string;
  pumpPrefix?: string;
}

export interface ExpensesExportOptions {
  itemsPerPage: 25 | 50 | 100 | 200;
  includeCharts?: boolean;
  includeSummary?: boolean;
}

export class ExpensesExporter {
  /**
   * Exporta despesas para PDF de forma profissional
   */
  static async exportToPDF(
    data: ExpensesExportData, 
    options: ExpensesExportOptions = { itemsPerPage: 25 }
  ): Promise<void> {
    try {
      console.log('🚀 Iniciando exportação PDF de despesas...');
      
      // Validar dados
      if (!data || !data.expenses) {
        throw new Error('Dados de despesas não fornecidos');
      }

      if (data.expenses.length === 0) {
        throw new Error('Nenhuma despesa encontrada para exportar');
      }

      console.log(`📊 Exportando ${data.expenses.length} despesas com ${options.itemsPerPage} itens por página`);

      // Criar PDF no formato A4 retrato
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      
      // Adicionar cabeçalho
      this.addPDFHeader(pdf, data);
      
      // Adicionar resumo executivo (se solicitado)
      if (options.includeSummary) {
        this.addSummarySection(pdf, data);
      }
      
      // Adicionar conteúdo das despesas PRIMEIRO
      this.addExpensesContent(pdf, data, options);
      
      // Adicionar gráficos POR ÚLTIMO (se solicitado)
      if (options.includeCharts) {
        this.addChartsSection(pdf, data);
      }
      
      // Adicionar rodapé
      this.addPDFFooter(pdf);
      
      // Gerar nome do arquivo
      const fileName = this.generateFileName(data);
      console.log('📁 Nome do arquivo PDF:', fileName);
      
      // Salvar o arquivo
      pdf.save(fileName);
      console.log('✅ PDF de despesas exportado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao exportar despesas para PDF:', error);
      throw new Error(`Erro ao exportar despesas para PDF: ${error.message}`);
    }
  }

  /**
   * Adiciona cabeçalho profissional ao PDF
   */
  private static addPDFHeader(pdf: jsPDF, data: ExpensesExportData): void {
    const pageWidth = 210; // A4 portrait width
    const margin = 15;
    
    // Cores profissionais
    const primaryColor = [0, 102, 204]; // Azul corporativo
    const secondaryColor = [128, 128, 128]; // Cinza
    
    // Título principal
    pdf.setFontSize(20);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RELATÓRIO DE DESPESAS', pageWidth / 2, 20, { align: 'center' });
    
    // Subtítulo com filtros aplicados
    let subtitle = 'Relatório Completo de Despesas';
    if (data.companyName) {
      subtitle += ` - ${data.companyName}`;
    }
    if (data.pumpPrefix) {
      subtitle += ` - Bomba ${data.pumpPrefix}`;
    }
    
    pdf.setFontSize(14);
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.text(subtitle, pageWidth / 2, 28, { align: 'center' });
    
    // Data de geração
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    pdf.setFontSize(10);
    pdf.text(`Gerado em: ${formattedDate}`, pageWidth / 2, 35, { align: 'center' });
    
    // Informações da empresa
    pdf.setFontSize(12);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('Felix Mix / WorldRental', pageWidth / 2, 42, { align: 'center' });
    
    // Estatísticas rápidas
    const totalDespesas = data.expenses.length;
    const valorTotal = data.expenses.reduce((sum, expense) => sum + Math.abs(expense.valor), 0);
    const despesasPagas = data.expenses.filter(e => e.status === 'pago').length;
    
    pdf.setFontSize(10);
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.text(
      `${totalDespesas} despesas | ${despesasPagas} pagas | Total: ${formatCurrency(valorTotal)}`, 
      pageWidth / 2, 
      48, 
      { align: 'center' }
    );
    
    // Linha separadora
    pdf.setLineWidth(0.8);
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.line(margin, 52, pageWidth - margin, 52);
  }

  /**
   * Adiciona seção de resumo executivo
   */
  private static addSummarySection(pdf: jsPDF, data: ExpensesExportData): void {
    const pageWidth = 210;
    const margin = 15;
    let currentY = 60;
    
    // Título da seção
    pdf.setFontSize(14);
    pdf.setTextColor(0, 102, 204);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESUMO EXECUTIVO', margin, currentY);
    currentY += 10;
    
    // Calcular estatísticas
    const totalDespesas = data.expenses.length;
    const valorTotal = data.expenses.reduce((sum, expense) => sum + Math.abs(expense.valor), 0);
    const despesasPagas = data.expenses.filter(e => e.status === 'pago').length;
    const despesasPendentes = data.expenses.filter(e => e.status === 'pendente').length;
    
    // Por categoria
    const porCategoria = data.expenses.reduce((acc, expense) => {
      acc[expense.categoria] = (acc[expense.categoria] || 0) + Math.abs(expense.valor);
      return acc;
    }, {} as Record<string, number>);
    
    // Por tipo de custo
    const porTipo = data.expenses.reduce((acc, expense) => {
      acc[expense.tipo_custo] = (acc[expense.tipo_custo] || 0) + Math.abs(expense.valor);
      return acc;
    }, {} as Record<string, number>);
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    
    // Estatísticas gerais
    pdf.text(`Total de Despesas: ${totalDespesas}`, margin, currentY);
    pdf.text(`Valor Total: ${formatCurrency(valorTotal)}`, margin + 80, currentY);
    currentY += 6;
    
    pdf.text(`Despesas Pagas: ${despesasPagas}`, margin, currentY);
    pdf.text(`Despesas Pendentes: ${despesasPendentes}`, margin + 80, currentY);
    currentY += 8;
    
    // Por categoria
    pdf.setFont('helvetica', 'bold');
    pdf.text('Por Categoria:', margin, currentY);
    currentY += 6;
    pdf.setFont('helvetica', 'normal');
    
    Object.entries(porCategoria).forEach(([categoria, valor]) => {
      pdf.text(`• ${categoria}: ${formatCurrency(valor)}`, margin + 5, currentY);
      currentY += 5;
    });
    
    currentY += 3;
    
    // Por tipo
    pdf.setFont('helvetica', 'bold');
    pdf.text('Por Tipo de Custo:', margin, currentY);
    currentY += 6;
    pdf.setFont('helvetica', 'normal');
    
    Object.entries(porTipo).forEach(([tipo, valor]) => {
      const tipoLabel = tipo === 'fixo' ? 'Fixo' : 'Variável';
      pdf.text(`• ${tipoLabel}: ${formatCurrency(valor)}`, margin + 5, currentY);
      currentY += 5;
    });
    
    // Linha separadora
    currentY += 5;
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
  }

  /**
   * Adiciona seção de gráficos profissionais
   */
  private static addChartsSection(pdf: jsPDF, data: ExpensesExportData): void {
    const pageWidth = 210;
    const margin = 15;
    
    // Adicionar nova página para gráficos
    pdf.addPage();
    this.addPDFHeader(pdf, data);
    let currentY = 60;
    
    // Linha separadora superior
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 102, 204);
    pdf.line(margin, currentY - 5, pageWidth - margin, currentY - 5);
    
    // Título da seção
    pdf.setFontSize(16);
    pdf.setTextColor(0, 102, 204);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ANÁLISE GRÁFICA DAS DESPESAS', pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;
    
    // Calcular dados para gráficos
    const totalDespesas = data.expenses.length;
    const valorTotal = data.expenses.reduce((sum, expense) => sum + Math.abs(expense.valor), 0);
    
    // Por categoria
    const porCategoria = data.expenses.reduce((acc, expense) => {
      acc[expense.categoria] = (acc[expense.categoria] || 0) + Math.abs(expense.valor);
      return acc;
    }, {} as Record<string, number>);
    
    // Por tipo de custo
    const porTipo = data.expenses.reduce((acc, expense) => {
      acc[expense.tipo_custo] = (acc[expense.tipo_custo] || 0) + Math.abs(expense.valor);
      return acc;
    }, {} as Record<string, number>);
    
    // Por status
    const porStatus = data.expenses.reduce((acc, expense) => {
      acc[expense.status] = (acc[expense.status] || 0) + Math.abs(expense.valor);
      return acc;
    }, {} as Record<string, number>);
    
    // Seção 1: Gráficos lado a lado
    const chartContainerY = currentY;
    
    // Gráfico de Pizza - Por Categoria
    this.addPieChart(pdf, 'Despesas por Categoria', porCategoria, margin, chartContainerY, 90);
    
    // Gráfico de Barras - Por Tipo de Custo
    this.addBarChart(pdf, 'Despesas por Tipo de Custo', porTipo, margin + 100, chartContainerY, 90);
    
    currentY += 110;
    
    // Linha separadora entre seções
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 102, 204);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 15;
    
    // Seção 2: Gráfico de Status (largura completa)
    this.addBarChart(pdf, 'Despesas por Status de Pagamento', porStatus, margin, currentY, 180);
    
    currentY += 80;
    
    // Linha separadora antes da tabela
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 102, 204);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 15;
    
    // Seção 3: Tabela de dados dos gráficos
    this.addChartsDataTable(pdf, porCategoria, porTipo, porStatus, margin, currentY);
  }

  /**
   * Adiciona gráfico de pizza simples
   */
  private static addPieChart(pdf: jsPDF, title: string, data: Record<string, number>, x: number, y: number, size: number): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size / 3;
    
    // Título
    pdf.setFontSize(11);
    pdf.setTextColor(0, 102, 204);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, centerX, y - 8, { align: 'center' });
    
    // Círculo base
    pdf.setDrawColor(0, 102, 204);
    pdf.setLineWidth(1.5);
    pdf.circle(centerX, centerY, radius, 'S');
    
    // Calcular totais e percentuais
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    
    // Cores profissionais para as fatias
    const colors = [
      [0, 102, 204], // Azul corporativo
      [16, 185, 129], // Verde sucesso
      [245, 158, 11], // Amarelo atenção
      [239, 68, 68], // Vermelho erro
      [139, 92, 246], // Roxo premium
      [6, 182, 212] // Ciano informação
    ];
    
    // Legenda colorida
    entries.forEach(([label, value], index) => {
      const percentage = (value / total) * 100;
      const color = colors[index % colors.length];
      
      if (percentage > 0) {
        // Quadrado colorido para legenda
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.rect(centerX + radius + 10, y + (index * 12), 8, 8, 'F');
        
        // Label e valor
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${label}: ${formatCurrency(value)} (${percentage.toFixed(1)}%)`, centerX + radius + 22, y + (index * 12) + 6);
      }
    });
    
    // Informação total no centro
    pdf.setFontSize(10);
    pdf.setTextColor(0, 102, 204);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TOTAL', centerX, centerY - 5, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(formatCurrency(total), centerX, centerY + 5, { align: 'center' });
  }

  /**
   * Adiciona gráfico de barras simples
   */
  private static addBarChart(pdf: jsPDF, title: string, data: Record<string, number>, x: number, y: number, width: number): void {
    const chartHeight = 60;
    const barWidth = Math.min(25, width / Object.keys(data).length - 5);
    const maxValue = Math.max(...Object.values(data));
    
    // Título
    pdf.setFontSize(11);
    pdf.setTextColor(0, 102, 204);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, x + width / 2, y - 8, { align: 'center' });
    
    // Eixos
    pdf.setDrawColor(0, 102, 204);
    pdf.setLineWidth(1);
    pdf.line(x, y + chartHeight, x + width, y + chartHeight); // Eixo X
    pdf.line(x, y, x, y + chartHeight); // Eixo Y
    
    // Barras
    const entries = Object.entries(data);
    const barSpacing = width / entries.length;
    
    entries.forEach(([label, value], index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const barX = x + (index * barSpacing) + 5;
      const barY = y + chartHeight - barHeight;
      
      // Cor da barra
      const colors = [
        [0, 102, 204], // Azul corporativo
        [16, 185, 129], // Verde sucesso
        [245, 158, 11], // Amarelo atenção
        [239, 68, 68], // Vermelho erro
        [139, 92, 246], // Roxo premium
        [6, 182, 212] // Ciano informação
      ];
      const color = colors[index % colors.length];
      pdf.setFillColor(color[0], color[1], color[2]);
      
      // Desenhar barra com borda
      pdf.rect(barX, barY, barWidth, barHeight, 'F');
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(barX, barY, barWidth, barHeight, 'S');
      
      // Valor no topo da barra
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(formatCurrency(value), barX + barWidth / 2, barY - 3, { align: 'center' });
      
      // Label abaixo da barra
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      const labelText = label.length > 8 ? label.substring(0, 6) + '...' : label;
      pdf.text(labelText, barX + barWidth / 2, y + chartHeight + 8, { align: 'center' });
    });
    
    // Linha de valor máximo
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(x, y, x + width, y);
    
    // Label do valor máximo
    pdf.setFontSize(6);
    pdf.setTextColor(128, 128, 128);
    pdf.text(formatCurrency(maxValue), x - 5, y + 3, { align: 'right' });
  }

  /**
   * Adiciona tabela de dados dos gráficos
   */
  private static addChartsDataTable(pdf: jsPDF, porCategoria: Record<string, number>, porTipo: Record<string, number>, porStatus: Record<string, number>, x: number, y: number): void {
    const pageWidth = 210;
    const margin = 15;
    
    // Título da tabela
    pdf.setFontSize(14);
    pdf.setTextColor(0, 102, 204);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DADOS DETALHADOS DOS GRÁFICOS', pageWidth / 2, y, { align: 'center' });
    y += 20;
    
    // Container para as três colunas
    const colWidth = (pageWidth - 2 * margin) / 3;
    const col1X = margin;
    const col2X = margin + colWidth;
    const col3X = margin + 2 * colWidth;
    
    // Fundo para cada coluna
    pdf.setFillColor(248, 249, 250);
    pdf.rect(col1X - 5, y - 5, colWidth, 120, 'F');
    pdf.rect(col2X - 5, y - 5, colWidth, 120, 'F');
    pdf.rect(col3X - 5, y - 5, colWidth, 120, 'F');
    
    // Bordas das colunas
    pdf.setDrawColor(0, 102, 204);
    pdf.setLineWidth(0.5);
    pdf.rect(col1X - 5, y - 5, colWidth, 120, 'S');
    pdf.rect(col2X - 5, y - 5, colWidth, 120, 'S');
    pdf.rect(col3X - 5, y - 5, colWidth, 120, 'S');
    
    // Coluna 1: Por Categoria
    pdf.setFontSize(11);
    pdf.setTextColor(0, 102, 204);
    pdf.setFont('helvetica', 'bold');
    pdf.text('POR CATEGORIA', col1X, y);
    y += 10;
    
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    Object.entries(porCategoria).forEach(([categoria, valor]) => {
      const percentage = (valor / Object.values(porCategoria).reduce((sum, v) => sum + v, 0)) * 100;
      pdf.text(`${categoria}:`, col1X, y);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${formatCurrency(valor)}`, col1X, y + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(128, 128, 128);
      pdf.text(`(${percentage.toFixed(1)}%)`, col1X, y + 10);
      pdf.setTextColor(0, 0, 0);
      y += 15;
    });
    
    // Reset Y para coluna 2
    y = y - (Object.keys(porCategoria).length * 15);
    
    // Coluna 2: Por Tipo de Custo
    pdf.setFontSize(11);
    pdf.setTextColor(0, 102, 204);
    pdf.setFont('helvetica', 'bold');
    pdf.text('POR TIPO DE CUSTO', col2X, y);
    y += 10;
    
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    Object.entries(porTipo).forEach(([tipo, valor]) => {
      const tipoLabel = tipo === 'fixo' ? 'Fixo' : 'Variável';
      const percentage = (valor / Object.values(porTipo).reduce((sum, v) => sum + v, 0)) * 100;
      pdf.text(`${tipoLabel}:`, col2X, y);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${formatCurrency(valor)}`, col2X, y + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(128, 128, 128);
      pdf.text(`(${percentage.toFixed(1)}%)`, col2X, y + 10);
      pdf.setTextColor(0, 0, 0);
      y += 15;
    });
    
    // Reset Y para coluna 3
    y = y - (Object.keys(porTipo).length * 15);
    
    // Coluna 3: Por Status
    pdf.setFontSize(11);
    pdf.setTextColor(0, 102, 204);
    pdf.setFont('helvetica', 'bold');
    pdf.text('POR STATUS', col3X, y);
    y += 10;
    
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    Object.entries(porStatus).forEach(([status, valor]) => {
      const statusLabel = status === 'pago' ? 'Pago' : status === 'pendente' ? 'Pendente' : 'Cancelado';
      const percentage = (valor / Object.values(porStatus).reduce((sum, v) => sum + v, 0)) * 100;
      pdf.text(`${statusLabel}:`, col3X, y);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${formatCurrency(valor)}`, col3X, y + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(128, 128, 128);
      pdf.text(`(${percentage.toFixed(1)}%)`, col3X, y + 10);
      pdf.setTextColor(0, 0, 0);
      y += 15;
    });
  }

  /**
   * Adiciona conteúdo das despesas com paginação
   */
  private static addExpensesContent(
    pdf: jsPDF, 
    data: ExpensesExportData, 
    options: ExpensesExportOptions
  ): void {
    const pageWidth = 210;
    const margin = 15;
    let currentY = 60;
    
    // Ajustar posição inicial baseado nas seções incluídas
    if (options.includeSummary) currentY += 60;
    // Gráficos não afetam a posição inicial pois vêm depois
    const itemsPerPage = options.itemsPerPage;
    const totalItems = data.expenses.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Ordenar despesas por data (mais recente primeiro)
    const sortedExpenses = [...data.expenses].sort((a, b) => 
      new Date(b.data_despesa).getTime() - new Date(a.data_despesa).getTime()
    );
    
    // Calcular altura disponível para itens (considerando cabeçalho, rodapé e margens)
    const availableHeight = 250 - currentY - 20; // 20px para rodapé
    const itemHeight = 6; // Altura de cada linha
    const maxItemsPerPage = Math.floor(availableHeight / itemHeight);
    
    console.log(`📊 Paginação: ${totalItems} itens, ${itemsPerPage} por página, ${totalPages} páginas`);
    
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
        this.addPDFHeader(pdf, data);
        currentY = 60;
      }
      
      // Título da seção
      pdf.setFontSize(12);
      pdf.setTextColor(0, 102, 204);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DETALHAMENTO DAS DESPESAS', margin, currentY);
      currentY += 8;
      
      // Cabeçalho da tabela
      this.addTableHeader(pdf, margin, currentY);
      currentY += 8;
      
      // Itens da página atual
      const startIndex = page * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
      const pageItems = sortedExpenses.slice(startIndex, endIndex);
      
      // Verificar se há espaço suficiente para todos os itens
      const requiredHeight = pageItems.length * itemHeight;
      if (currentY + requiredHeight > 250) {
        console.warn(`⚠️ Página ${page + 1}: Altura insuficiente. Reduzindo itens de ${pageItems.length} para ${maxItemsPerPage}`);
        // Ajustar itens para caber na página
        const adjustedItems = pageItems.slice(0, maxItemsPerPage);
        adjustedItems.forEach((expense, index) => {
          this.addExpenseRow(pdf, expense, margin, currentY, startIndex + index + 1);
          currentY += itemHeight;
        });
      } else {
        pageItems.forEach((expense, index) => {
          this.addExpenseRow(pdf, expense, margin, currentY, startIndex + index + 1);
          currentY += itemHeight;
        });
      }
      
      // Informações da página
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Página ${page + 1} de ${totalPages} | Mostrando ${startIndex + 1} a ${endIndex} de ${totalItems} despesas`,
        pageWidth / 2,
        280,
        { align: 'center' }
      );
    }
  }

  /**
   * Adiciona cabeçalho da tabela
   */
  private static addTableHeader(pdf: jsPDF, margin: number, y: number): void {
    const pageWidth = 210;
    
    // Fundo do cabeçalho
    pdf.setFillColor(0, 102, 204);
    pdf.rect(margin, y - 3, pageWidth - 2 * margin, 6, 'F');
    
    // Texto do cabeçalho
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    
    const colWidths = [15, 25, 30, 25, 20, 25, 20, 20, 20]; // Soma = 200
    const headers = ['#', 'Data', 'Descrição', 'Categoria', 'Tipo', 'Bomba', 'Empresa', 'Status', 'Valor'];
    let x = margin + 2;
    
    headers.forEach((header, index) => {
      pdf.text(header, x, y + 1);
      x += colWidths[index];
    });
  }

  /**
   * Adiciona uma linha de despesa
   */
  private static addExpenseRow(
    pdf: jsPDF, 
    expense: ExpenseWithRelations, 
    margin: number, 
    y: number, 
    index: number
  ): void {
    const pageWidth = 210;
    const colWidths = [15, 25, 30, 25, 20, 25, 20, 20, 20];
    
    // Alternar cor de fundo
    if (index % 2 === 0) {
      pdf.setFillColor(248, 249, 250);
      pdf.rect(margin, y - 2, pageWidth - 2 * margin, 5, 'F');
    }
    
    pdf.setFontSize(7);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    
    let x = margin + 2;
    
    // Número sequencial
    pdf.text(index.toString(), x, y + 1);
    x += colWidths[0];
    
    // Data
    pdf.text(formatDate(expense.data_despesa), x, y + 1);
    x += colWidths[1];
    
    // Descrição (truncada)
    const descricao = expense.descricao.length > 25 ? 
      expense.descricao.substring(0, 22) + '...' : 
      expense.descricao;
    pdf.text(descricao, x, y + 1);
    x += colWidths[2];
    
    // Categoria
    pdf.text(expense.categoria, x, y + 1);
    x += colWidths[3];
    
    // Tipo
    const tipo = expense.tipo_custo === 'fixo' ? 'Fixo' : 'Variável';
    pdf.text(tipo, x, y + 1);
    x += colWidths[4];
    
    // Bomba
    pdf.text(expense.bomba_prefix || 'N/A', x, y + 1);
    x += colWidths[5];
    
    // Empresa
    const empresa = expense.company_name ? 
      (expense.company_name.length > 12 ? 
        expense.company_name.substring(0, 9) + '...' : 
        expense.company_name) : 
      'N/A';
    pdf.text(empresa, x, y + 1);
    x += colWidths[6];
    
    // Status
    const status = expense.status === 'pago' ? 'Pago' : 
                   expense.status === 'pendente' ? 'Pendente' : 'Cancelado';
    pdf.text(status, x, y + 1);
    x += colWidths[7];
    
    // Valor (sempre positivo para exibição)
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(220, 38, 38); // Vermelho para despesas
    pdf.text(formatCurrency(Math.abs(expense.valor)), x, y + 1);
  }

  /**
   * Adiciona rodapé profissional
   */
  private static addPDFFooter(pdf: jsPDF): void {
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    
    // Linha separadora
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    
    // Informações do rodapé
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.setFont('helvetica', 'normal');
    
    const now = new Date();
    const timestamp = now.toLocaleString('pt-BR');
    
    pdf.text(`Sistema de Gestão de Bombas - Felix Mix / WorldRental`, margin, pageHeight - 15);
    pdf.text(`Gerado em: ${timestamp}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
    
    // Número da página
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  }

  /**
   * Gera nome do arquivo baseado nos filtros
   */
  private static generateFileName(data: ExpensesExportData): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    let fileName = `despesas_${dateStr}`;
    
    if (data.companyName) {
      fileName += `_${data.companyName.replace(/\s+/g, '_')}`;
    }
    
    if (data.pumpPrefix) {
      fileName += `_bomba_${data.pumpPrefix}`;
    }
    
    if (data.filters?.data_inicio && data.filters?.data_fim) {
      fileName += `_${data.filters.data_inicio}_a_${data.filters.data_fim}`;
    }
    
    return `${fileName}.pdf`;
  }
}
