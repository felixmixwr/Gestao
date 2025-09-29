// Teste simples para verificar se a exportação está funcionando
// Execute este código no console do navegador para testar

// Importar as funções necessárias
import { generateExportData, exportReports } from './src/utils/reportExporter.js'

// Dados de teste mínimos
const testReports = [
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
  }
]

const testFilters = {
  status: ['PAGO'],
  dateFrom: '2024-12-01',
  dateTo: '2024-12-01'
}

// Função de teste
async function testExport() {
  try {
    console.log('🧪 Iniciando teste de exportação...')
    
    const exportData = generateExportData(testReports, testFilters)
    console.log('✅ Dados de exportação gerados:', exportData)
    
    // Testar exportação XLSX
    console.log('📊 Testando exportação XLSX...')
    await exportReports(exportData, { format: 'xlsx', filename: 'teste_xlsx.xlsx' })
    console.log('✅ Exportação XLSX concluída!')
    
    // Testar exportação PDF
    console.log('📄 Testando exportação PDF...')
    await exportReports(exportData, { format: 'pdf', filename: 'teste_pdf.pdf' })
    console.log('✅ Exportação PDF concluída!')
    
    console.log('🎉 Todos os testes passaram!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    console.error('Stack trace:', error.stack)
  }
}

// Executar teste
testExport()

