// Teste básico de exportação XLSX
// Execute este código no console do navegador para testar

function testBasicXLSX() {
  try {
    console.log('🧪 Testando XLSX básico...')
    
    // Verificar se XLSX está disponível
    if (typeof XLSX === 'undefined') {
      throw new Error('Biblioteca XLSX não encontrada')
    }
    
    // Criar dados de teste simples
    const testData = [
      ['Nº', 'ID', 'Data', 'Cliente', 'Valor'],
      [1, 'RPT-001', '01/12/2024', 'Cliente Teste', 'R$ 1.000,00'],
      [2, 'RPT-002', '02/12/2024', 'Cliente Teste 2', 'R$ 2.000,00']
    ]
    
    // Criar workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(testData)
    
    // Adicionar worksheet
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teste')
    
    // Salvar arquivo
    XLSX.writeFile(workbook, 'teste_basico.xlsx')
    
    console.log('✅ XLSX básico criado com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro no teste XLSX básico:', error)
  }
}

// Executar teste
testBasicXLSX()






