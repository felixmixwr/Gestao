// Versão de teste simplificada da exportação PDF
// Execute este código no console para testar

function testSimplePDF() {
  try {
    console.log('🧪 Testando PDF simples...')
    
    // Importar jsPDF
    const { jsPDF } = window.jsPDF || {}
    if (!jsPDF) {
      throw new Error('jsPDF não encontrado')
    }
    
    // Criar documento simples
    const doc = new jsPDF('l', 'mm', 'a4')
    
    // Adicionar texto simples
    doc.setFontSize(16)
    doc.text('TESTE DE EXPORTAÇÃO PDF', 20, 20)
    
    doc.setFontSize(12)
    doc.text('Data: ' + new Date().toLocaleString('pt-BR'), 20, 30)
    doc.text('Status: Teste funcionando', 20, 40)
    
    // Salvar arquivo
    doc.save('teste_simples.pdf')
    
    console.log('✅ PDF simples criado com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro no teste PDF simples:', error)
  }
}

// Executar teste
testSimplePDF()







