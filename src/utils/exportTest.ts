import { generateExportData, exportReports, ExportOptions } from './reportExporter'
import { ReportWithRelations } from '../types/reports'

// Dados de teste para verificar as exportações
export const createTestReports = (): ReportWithRelations[] => {
  return [
    {
      id: '1',
      report_number: 'RPT-20241201-0001',
      date: '2024-12-01',
      client_id: 'client-1',
      pump_id: 'pump-1',
      company_id: 'company-1',
      client_rep_name: 'João Silva',
      whatsapp_digits: '11999999999',
      work_address: 'Rua das Flores, 123 - São Paulo/SP',
      pump_prefix: 'WR-001',
      planned_volume: 50.0,
      realized_volume: 48.5,
      driver_name: 'Carlos Santos',
      assistant1_name: 'Maria Oliveira',
      assistant2_name: 'Pedro Costa',
      total_value: 2500.00,
      status: 'PAGO',
      observations: 'Bombeamento realizado com sucesso',
      created_at: '2024-12-01T10:00:00Z',
      clients: {
        id: 'client-1',
        name: 'Construtora ABC Ltda',
        company_name: 'Construtora ABC Ltda',
        phone: '11999999999',
        email: 'contato@abc.com.br'
      },
      pumps: {
        id: 'pump-1',
        prefix: 'WR-001',
        model: 'Schwing S28',
        brand: 'Schwing',
        owner_company_id: 'company-1',
        is_terceira: false
      },
      companies: {
        id: 'company-1',
        name: 'World Rental'
      }
    },
    {
      id: '2',
      report_number: 'RPT-20241201-0002',
      date: '2024-12-01',
      client_id: 'client-2',
      pump_id: 'pump-2',
      company_id: 'company-1',
      client_rep_name: 'Ana Costa',
      whatsapp_digits: '11888888888',
      work_address: 'Av. Paulista, 1000 - São Paulo/SP',
      pump_prefix: 'WR-002',
      planned_volume: 30.0,
      realized_volume: 32.0,
      driver_name: 'Roberto Lima',
      assistant1_name: 'Fernanda Silva',
      assistant2_name: 'Lucas Pereira',
      total_value: 1800.00,
      status: 'AGUARDANDO_PAGAMENTO',
      observations: 'Volume realizado acima do planejado',
      created_at: '2024-12-01T14:30:00Z',
      clients: {
        id: 'client-2',
        name: 'Empreendimentos XYZ',
        company_name: 'Empreendimentos XYZ',
        phone: '11888888888',
        email: 'contato@xyz.com.br'
      },
      pumps: {
        id: 'pump-2',
        prefix: 'WR-002',
        model: 'Putzmeister M36',
        brand: 'Putzmeister',
        owner_company_id: 'company-1',
        is_terceira: false
      },
      companies: {
        id: 'company-1',
        name: 'World Rental'
      }
    }
  ]
}

// Função para testar exportação XLSX
export const testXLSXExport = async () => {
  try {
    console.log('🧪 Testando exportação XLSX...')
    
    const testReports = createTestReports()
    const testFilters = {
      status: ['PAGO', 'AGUARDANDO_PAGAMENTO'],
      dateFrom: '2024-12-01',
      dateTo: '2024-12-01',
      searchTerm: 'RPT-20241201',
      searchType: 'id'
    }
    
    const exportData = generateExportData(testReports, testFilters)
    const options: ExportOptions = {
      format: 'xlsx',
      filename: 'teste_exportacao_xlsx.xlsx'
    }
    
    await exportReports(exportData, options)
    console.log('✅ Teste XLSX concluído com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro no teste XLSX:', error)
  }
}

// Função para testar exportação PDF
export const testPDFExport = async () => {
  try {
    console.log('🧪 Testando exportação PDF...')
    
    const testReports = createTestReports()
    const testFilters = {
      status: ['PAGO'],
      dateFrom: '2024-12-01',
      dateTo: '2024-12-01'
    }
    
    const exportData = generateExportData(testReports, testFilters)
    const options: ExportOptions = {
      format: 'pdf',
      filename: 'teste_exportacao_pdf.pdf'
    }
    
    await exportReports(exportData, options)
    console.log('✅ Teste PDF concluído com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro no teste PDF:', error)
  }
}

// Função para testar exportação sem filtros
export const testExportWithoutFilters = async () => {
  try {
    console.log('🧪 Testando exportação sem filtros...')
    
    const testReports = createTestReports()
    const exportData = generateExportData(testReports, {})
    const options: ExportOptions = {
      format: 'xlsx',
      filename: 'teste_sem_filtros.xlsx'
    }
    
    await exportReports(exportData, options)
    console.log('✅ Teste sem filtros concluído com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro no teste sem filtros:', error)
  }
}

// Função para executar todos os testes
export const runAllExportTests = async () => {
  console.log('🚀 Iniciando testes de exportação...')
  
  await testXLSXExport()
  await testPDFExport()
  await testExportWithoutFilters()
  
  console.log('🎉 Todos os testes de exportação concluídos!')
}

// Exportar funções para uso no console do navegador
if (typeof window !== 'undefined') {
  (window as any).testExports = {
    testXLSXExport,
    testPDFExport,
    testExportWithoutFilters,
    runAllExportTests
  }
}



