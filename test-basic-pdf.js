// Teste básico de exportação PDF sem autoTable
// Execute este código no console do navegador para testar

function testBasicPDF() {
  try {
    console.log('🧪 Testando PDF básico...')
    
    // Verificar se jsPDF está disponível
    if (typeof jsPDF === 'undefined') {
      throw new Error('Biblioteca jsPDF não encontrada')
    }
    
    // Criar documento simples
    const doc = new jsPDF('l', 'mm', 'a4')
    
    // Adicionar texto simples
    doc.setFontSize(16)
    doc.text('TESTE DE EXPORTAÇÃO PDF', 20, 20)
    
    doc.setFontSize(12)
    doc.text('Data: ' + new Date().toLocaleString('pt-BR'), 20, 30)
    doc.text('Status: Teste funcionando', 20, 40)
    
    // Criar tabela simples manualmente
    doc.setFontSize(10)
    doc.text('Nº', 20, 60)
    doc.text('ID', 40, 60)
    doc.text('Cliente', 80, 60)
    doc.text('Valor', 140, 60)
    
    // Linha separadora
    doc.line(20, 65, 180, 65)
    
    // Dados de exemplo
    doc.text('1', 20, 75)
    doc.text('RPT-001', 40, 75)
    doc.text('Cliente Teste', 80, 75)
    doc.text('R$ 1.000,00', 140, 75)
    
    doc.text('2', 20, 85)
    doc.text('RPT-002', 40, 85)
    doc.text('Cliente Teste 2', 80, 85)
    doc.text('R$ 2.000,00', 140, 85)
    
    // Salvar arquivo
    doc.save('teste_basico.pdf')
    
    console.log('✅ PDF básico criado com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro no teste PDF básico:', error)
  }
}

// Executar teste
testBasicPDF()















