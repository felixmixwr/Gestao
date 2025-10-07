// Script de teste para verificar o cálculo de horas extras
import { calcularValorHoraExtra } from '../types/colaboradores'

export function testarCalculoCompleto() {
  console.log('=== TESTE COMPLETO DO CÁLCULO DE HORAS EXTRAS ===')
  
  // Exemplo com salário de R$ 2.000,00
  const salarioFixo = 2000
  const horas = 10
  const tipoDia = 'segunda-sexta'
  
  console.log(`Salário Fixo: R$ ${salarioFixo.toFixed(2)}`)
  console.log(`Horas: ${horas}h`)
  console.log(`Tipo de Dia: ${tipoDia}`)
  console.log('')
  
  // Cálculo manual passo a passo
  const valorHoraBase = salarioFixo / 220
  const valorHoraExtra = valorHoraBase * 1.5
  const valorTotal = horas * valorHoraExtra
  
  console.log('CÁLCULO MANUAL:')
  console.log(`1. Valor base por hora: ${salarioFixo} ÷ 220 = R$ ${valorHoraBase.toFixed(2)}`)
  console.log(`2. Valor hora extra (+50%): R$ ${valorHoraBase.toFixed(2)} × 1.5 = R$ ${valorHoraExtra.toFixed(2)}`)
  console.log(`3. Valor total: ${horas}h × R$ ${valorHoraExtra.toFixed(2)} = R$ ${valorTotal.toFixed(2)}`)
  console.log('')
  
  // Teste com a função
  const resultadoFuncao = calcularValorHoraExtra(salarioFixo, horas, tipoDia)
  
  console.log('RESULTADO DA FUNÇÃO:')
  console.log(`Valor calculado: R$ ${resultadoFuncao.toFixed(2)}`)
  console.log('')
  
  // Verificação
  const valoresIguais = Math.abs(valorTotal - resultadoFuncao) < 0.01
  console.log(`✅ Valores são iguais: ${valoresIguais}`)
  console.log('')
  
  // Teste com diferentes valores
  console.log('=== TESTE COM DIFERENTES VALORES ===')
  const salarios = [1500, 2000, 2500, 3000]
  const horasTeste = [1, 2, 5, 10]
  
  salarios.forEach(salario => {
    console.log(`\nSalário: R$ ${salario.toFixed(2)}`)
    horasTeste.forEach(h => {
      const valor = calcularValorHoraExtra(salario, h, 'segunda-sexta')
      const valorPorHora = valor / h
      console.log(`  ${h}h: R$ ${valor.toFixed(2)} (R$ ${valorPorHora.toFixed(2)}/h)`)
    })
  })
  
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

// Função para testar se o problema está na função ou no banco
export function compararComBanco() {
  console.log('=== COMPARAÇÃO COM DADOS DO BANCO ===')
  console.log('Execute este teste após verificar os dados no banco de dados')
  console.log('Compare os valores mostrados aqui com os valores salvos no banco')
  
  const salarioFixo = 2000
  const horas = 10
  
  const valorEsperado = calcularValorHoraExtra(salarioFixo, horas, 'segunda-sexta')
  
  console.log(`Para ${horas}h com salário R$ ${salarioFixo.toFixed(2)}:`)
  console.log(`Valor esperado: R$ ${valorEsperado.toFixed(2)}`)
  console.log('')
  console.log('Se o valor no banco for diferente, execute o script SQL para corrigir')
}





