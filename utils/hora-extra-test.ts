// Arquivo de teste para demonstrar a nova fórmula de cálculo de horas extras
import { calcularValorHoraExtra } from '../types/colaboradores'

// Exemplo de teste com salário fixo de R$ 2.000,00
export function testarCalculoHorasExtras() {
  const salarioFixo = 2000
  const horas = 1
  
  console.log('=== TESTE DA NOVA FÓRMULA DE HORAS EXTRAS ===')
  console.log(`Salário Fixo: R$ ${salarioFixo.toFixed(2)}`)
  console.log(`Horas: ${horas}h`)
  console.log('')
  
  // Cálculo manual para verificação
  const valorHoraBase = salarioFixo / 220
  const valorHoraExtra = valorHoraBase * 1.5
  const valorTotal = horas * valorHoraExtra
  
  console.log('CÁLCULO MANUAL:')
  console.log(`1. Valor base por hora: ${salarioFixo} ÷ 220 = R$ ${valorHoraBase.toFixed(2)}`)
  console.log(`2. Valor hora extra (+50%): R$ ${valorHoraBase.toFixed(2)} × 1.5 = R$ ${valorHoraExtra.toFixed(2)}`)
  console.log(`3. Valor total: ${horas}h × R$ ${valorHoraExtra.toFixed(2)} = R$ ${valorTotal.toFixed(2)}`)
  console.log('')
  
  // Teste com a função
  const resultadoFuncao = calcularValorHoraExtra(salarioFixo, horas, 'segunda-sexta')
  
  console.log('RESULTADO DA FUNÇÃO:')
  console.log(`Valor calculado: R$ ${resultadoFuncao.toFixed(2)}`)
  console.log('')
  
  // Verificação
  const valoresIguais = Math.abs(valorTotal - resultadoFuncao) < 0.01
  console.log(`✅ Valores são iguais: ${valoresIguais}`)
  
  return {
    salarioFixo,
    horas,
    valorHoraBase,
    valorHoraExtra,
    valorTotal,
    resultadoFuncao,
    valoresIguais
  }
}

// Exemplo com diferentes quantidades de horas
export function testarDiferentesHoras() {
  const salarioFixo = 2000
  
  console.log('=== TESTE COM DIFERENTES QUANTIDADES DE HORAS ===')
  console.log(`Salário Fixo: R$ ${salarioFixo.toFixed(2)}`)
  console.log('')
  
  const horasTeste = [1, 2, 4, 8, 10]
  
  horasTeste.forEach(horas => {
    const valor = calcularValorHoraExtra(salarioFixo, horas, 'segunda-sexta')
    const valorPorHora = valor / horas
    
    console.log(`${horas}h: R$ ${valor.toFixed(2)} (R$ ${valorPorHora.toFixed(2)}/h)`)
  })
}





