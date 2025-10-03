import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import { ReportWithRelations } from '../types/reports'
import { formatCurrency } from './formatters'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
// import { formatDateSafe } from './date-utils'

/**
 * Formata um valor monetário de forma segura
 */
const safeFormatCurrency = (value: number | null | undefined): string => {
  try {
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00'
    }
    return formatCurrency(value)
  } catch (error) {
    console.warn('⚠️ Erro ao formatar valor monetário:', value, error)
    return 'R$ 0,00'
  }
}

/**
 * Formata uma data de forma segura considerando fuso horário
 */
const safeFormatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
  
  try {
    // Se a data está no formato YYYY-MM-DD, criar diretamente para evitar problemas de fuso horário
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day) // Mês é 0-indexado
      return format(date, 'dd/MM/yyyy', { locale: ptBR })
    }
    
    // Para outros formatos, usar a conversão normal
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  } catch (error) {
    console.warn('⚠️ Erro ao formatar data:', dateString, error)
    return 'N/A'
  }
}

/**
 * Formata o status de forma legível
 */
const formatStatus = (status: string | null | undefined): string => {
  if (!status) return 'N/A'
  
  const statusMap: Record<string, string> = {
    'PENDENTE': 'Pendente',
    'PAGO': 'Pago',
    'CANCELADO': 'Cancelado',
    'EM_ANDAMENTO': 'Em Andamento',
    'CONCLUIDO': 'Concluído',
    'FATURADO': 'Faturado',
    'NOTA_EMITIDA': 'Nota Emitida'
  }
  
  return statusMap[status.toUpperCase()] || status
}

export interface ExportOptions {
  format: 'xlsx' | 'pdf'
  filename?: string
  includeFilters?: boolean
  sendEmail?: boolean
  emailRecipients?: string[]
}

export interface ExportData {
  reports: ReportWithRelations[]
  filters?: {
    status?: string[]
    dateFrom?: string
    dateTo?: string
    searchTerm?: string
    searchType?: string
    [key: string]: any
  }
  totalRecords: number
  exportDate: string
}

/**
 * Formata os dados dos relatórios para exportação
 */
export const formatReportsForExport = (reports: ReportWithRelations[]): any[] => {
  return reports.map((report, index) => ({
    'Nº': index + 1,
    'ID Relatório': report.report_number || 'N/A',
    'Data': safeFormatDate(report.date),
    'Cliente': report.clients?.name || report.client_rep_name || 'N/A',
    'Representante': report.client_rep_name || 'N/A',
    'Telefone': report.whatsapp_digits || 'N/A',
    'Endereço': report.work_address || 'N/A',
    'Bomba': report.pumps?.prefix || report.pump_prefix || 'N/A',
    'Modelo Bomba': report.pumps?.model || 'N/A',
    'Empresa Bomba': report.pumps?.is_terceira ? 
      `${report.pumps.empresa_nome || 'N/A'} (Terceira)` : 
      (report.companies?.name || 'N/A'),
    'Volume Planejado (m³)': report.planned_volume || 0,
    'Volume Realizado (m³)': report.realized_volume || 0,
    'Motorista': report.driver_name || 'N/A',
    'Auxiliar 1': report.assistant1_name || 'N/A',
    'Auxiliar 2': report.assistant2_name || 'N/A',
    'Valor Total (R$)': report.total_value || 0,
    'Status': report.status || 'N/A',
    'Observações': report.observations || 'N/A',
    'Data Criação': report.created_at ? 
      safeFormatDate(report.created_at) + ' ' + format(new Date(report.created_at), 'HH:mm', { locale: ptBR }) : 'N/A'
  }))
}

/**
 * Gera cabeçalho com informações da empresa e filtros aplicados
 */
export const generateReportHeader = (data: ExportData): any[] => {
  const header = [
    ['RELATÓRIO DE BOMBEAMENTOS - FÉLIX MIX / WORLD RENTAL'],
    [''],
    ['Data de Exportação:', data.exportDate],
    ['Total de Registros:', data.totalRecords.toString()],
    ['']
  ]

  // Adicionar informações dos filtros se aplicados
  if (data.filters && Object.keys(data.filters).length > 0) {
    header.push(['FILTROS APLICADOS:'])
    
    if (data.filters.status && data.filters.status.length > 0) {
      header.push(['Status:', data.filters.status.join(', ')])
    }
    
    if (data.filters.dateFrom || data.filters.dateTo) {
      const dateRange = []
      if (data.filters.dateFrom) dateRange.push(`De: ${data.filters.dateFrom}`)
      if (data.filters.dateTo) dateRange.push(`Até: ${data.filters.dateTo}`)
      header.push(['Período:', dateRange.join(' - ')])
    }
    
    if (data.filters.searchTerm) {
      header.push(['Busca:', `${data.filters.searchTerm} (${data.filters.searchType})`])
    }
    
    if (data.filters.pump_prefix) {
      header.push(['Bomba:', data.filters.pump_prefix])
    }
    
    if (data.filters.client_id) {
      header.push(['Cliente:', data.filters.client_id])
    }
    
    header.push([''])
  }

  return header
}

/**
 * Exporta relatórios para XLSX (versão simplificada e robusta)
 */
export const exportToXLSX = (data: ExportData, options: ExportOptions = { format: 'xlsx' }): void => {
  try {
    console.log('🔍 Iniciando exportação XLSX SIMPLES...')
    
    // Validar dados
    if (!data || !data.reports || !Array.isArray(data.reports) || data.reports.length === 0) {
      throw new Error('Dados inválidos ou vazios')
    }

    // Criar workbook
    const workbook = XLSX.utils.book_new()
    
    // Dados simples sem formatação complexa
    const simpleData = [
      ['RELATÓRIO DE BOMBEAMENTOS - FÉLIX MIX / WORLD RENTAL'],
      [''],
      ['Data de Exportação:', data.exportDate],
      ['Total de Registros:', data.totalRecords.toString()],
      [''],
      // Cabeçalho da tabela
      ['Nº', 'ID Relatório', 'Data', 'Cliente', 'Endereço', 'Bomba', 'Volume (m³)', 'Valor (R$)', 'Status'],
      // Dados dos relatórios
      ...data.reports.map((report, index) => [
        index + 1,
        report.report_number || 'N/A',
        safeFormatDate(report.date),
        report.clients?.name || report.client_rep_name || 'N/A',
        report.work_address || 'N/A',
        report.pumps?.prefix || report.pump_prefix || 'N/A',
        report.realized_volume || 0,
        report.total_value || 0,
        formatStatus(report.status)
      ])
    ]
    
    // Criar worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(simpleData)
    
    // Adicionar ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatórios')
    
    // Salvar arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = options.filename || `relatorios_bombeamento_${timestamp}.xlsx`
    
    XLSX.writeFile(workbook, filename)
    
    console.log('✅ Arquivo XLSX SIMPLES exportado:', filename)
    
  } catch (error) {
    console.error('❌ Erro na exportação XLSX SIMPLES:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    throw new Error(`Erro ao exportar XLSX: ${errorMessage}`)
  }
}

/**
 * Exporta relatórios para PDF
 */
/**
 * Exporta relatórios para PDF (versão sem autoTable)
 */
export const exportToPDF = (data: ExportData, options: ExportOptions = { format: 'pdf' }): void => {
  try {
    console.log('🔍 Iniciando exportação PDF SIMPLES...')
    console.log('📊 Dados recebidos:', { 
      reportsCount: data.reports?.length || 0, 
      filters: data.filters,
      totalRecords: data.totalRecords 
    })

    // Validar dados de entrada
    if (!data || !data.reports || !Array.isArray(data.reports)) {
      throw new Error('Dados de relatórios inválidos ou vazios')
    }

    if (data.reports.length === 0) {
      throw new Error('Nenhum relatório encontrado para exportar')
    }

    // Criar novo documento PDF
    const doc = new jsPDF('l', 'mm', 'a4') // Landscape para mais espaço
    console.log('✅ Documento PDF criado')
    
    // Configurações básicas
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    
    // Cores básicas
    const primaryColor = [0, 102, 204] // Azul
    const secondaryColor = [128, 128, 128] // Cinza
    
    // Cabeçalho simples
    doc.setFontSize(18)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('RELATÓRIO DE BOMBEAMENTOS', pageWidth / 2, 25, { align: 'center' })
    
    doc.setFontSize(14)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text('FÉLIX MIX / WORLD RENTAL', pageWidth / 2, 35, { align: 'center' })
    
    // Informações básicas
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Data de Exportação: ${data.exportDate}`, margin, 50)
    doc.text(`Total de Registros: ${data.totalRecords}`, margin, 60)
    
    // Calcular totais
    console.log('🔍 Calculando totais...')
    const totalValue = data.reports.reduce((sum, r) => sum + (r.total_value || 0), 0)
    const totalVolume = data.reports.reduce((sum, r) => sum + (r.realized_volume || 0), 0)
    console.log('📊 Totais calculados:', { totalValue, totalVolume })
    
    doc.text(`Valor Total: ${safeFormatCurrency(totalValue)}`, margin, 70)
    doc.text(`Volume Total: ${totalVolume.toLocaleString('pt-BR')} m³`, margin, 80)
    
    // Adicionar filtros se existirem
    let yPosition = 95
    if (data.filters && Object.keys(data.filters).length > 0) {
      doc.setFontSize(12)
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.text('FILTROS APLICADOS:', margin, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      
      if (data.filters.status && data.filters.status.length > 0) {
        doc.text(`Status: ${data.filters.status.join(', ')}`, margin, yPosition)
        yPosition += 8
      }
      
      if (data.filters.dateFrom || data.filters.dateTo) {
        const dateRange = []
        if (data.filters.dateFrom) dateRange.push(`De: ${safeFormatDate(data.filters.dateFrom)}`)
        if (data.filters.dateTo) dateRange.push(`Até: ${safeFormatDate(data.filters.dateTo)}`)
        doc.text(`Período: ${dateRange.join(' - ')}`, margin, yPosition)
        yPosition += 8
      }
      
      yPosition += 10
    }
    
    // Criar tabela manual (sem autoTable)
    console.log('🔍 Criando tabela manual...')
    
    // Cabeçalho da tabela
    doc.setFontSize(10)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFont('helvetica', 'bold')
    
    const headers = ['Nº', 'ID', 'Data', 'Cliente', 'Endereço', 'Bomba', 'Volume', 'Valor', 'Status']
    const colWidths = [12, 25, 20, 30, 35, 18, 20, 25, 20]
    const startX = margin
    let currentX = startX
    
    // Desenhar cabeçalho
    headers.forEach((header, index) => {
      doc.text(header, currentX, yPosition)
      currentX += colWidths[index]
    })
    
    yPosition += 8
    
    // Linha separadora
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 5
    
    // Dados dos relatórios
    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    
    data.reports.forEach((report, index) => {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 30) {
        doc.addPage()
        yPosition = 20
      }
      
      const rowData = [
        (index + 1).toString(),
        report.report_number || 'N/A',
        safeFormatDate(report.date),
        (report.clients?.name || report.client_rep_name || 'N/A').substring(0, 12),
        (report.work_address || 'N/A').substring(0, 18),
        report.pumps?.prefix || report.pump_prefix || 'N/A',
        (report.realized_volume || 0).toFixed(2),
        safeFormatCurrency(report.total_value),
        formatStatus(report.status)
      ]
      
      currentX = startX
      rowData.forEach((cell, cellIndex) => {
        doc.text(cell, currentX, yPosition)
        currentX += colWidths[cellIndex]
      })
      
      yPosition += 6
    })
    
    console.log('✅ Tabela manual criada')
    
    // Rodapé simples
    doc.setFontSize(8)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text('Relatório gerado pelo Sistema de Gestão Félix Mix', 
             pageWidth / 2, pageHeight - 20, { align: 'center' })
    
    // Salvar arquivo
    console.log('🔍 Salvando arquivo...')
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss', { locale: ptBR })
    const filename = options.filename || `relatorios_bombeamento_${timestamp}.pdf`
    
    doc.save(filename)
    console.log('✅ Arquivo PDF SIMPLES exportado:', filename)
    
  } catch (error) {
    console.error('❌ Erro ao exportar PDF:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    const errorStack = error instanceof Error ? error.stack : 'Stack trace não disponível'
    console.error('Stack trace:', errorStack)
    throw new Error(`Erro ao exportar arquivo PDF: ${errorMessage}`)
  }
}

/**
 * Função principal de exportação
 */
export const exportReports = async (data: ExportData, options: ExportOptions): Promise<void> => {
  try {
    if (options.format === 'xlsx') {
      exportToXLSX(data, options)
    } else if (options.format === 'pdf') {
      exportToPDF(data, options)
    } else {
      throw new Error('Formato de exportação não suportado')
    }
  } catch (error) {
    console.error('❌ Erro na exportação:', error)
    throw error
  }
}

/**
 * Gera dados de exportação a partir dos relatórios e filtros
 */
export const generateExportData = (
  reports: ReportWithRelations[], 
  filters: any = {}
): ExportData => {
  return {
    reports,
    filters,
    totalRecords: reports.length,
    exportDate: format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }
}



