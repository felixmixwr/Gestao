// Versão ultra-simples da exportação XLSX
// Esta versão remove toda formatação complexa para garantir funcionamento

import { formatDateBR } from './date-utils'

export const exportToXLSXSimple = (data: ExportData, options: ExportOptions = { format: 'xlsx' }): void => {
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
      ['Nº', 'ID Relatório', 'Data', 'Cliente', 'Bomba', 'Volume (m³)', 'Valor (R$)', 'Status'],
      // Dados dos relatórios
      ...data.reports.map((report, index) => [
        index + 1,
        report.report_number || 'N/A',
        report.date ? formatDateBR(report.date) : 'N/A',
        report.clients?.name || report.client_rep_name || 'N/A',
        report.pumps?.prefix || report.pump_prefix || 'N/A',
        report.realized_volume || 0,
        report.total_value || 0,
        report.status || 'N/A'
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
    throw new Error(`Erro ao exportar XLSX: ${error.message}`)
  }
}







