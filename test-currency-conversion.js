// Script de teste para verificar a conversão de valores
// Execute este código no console do navegador para testar

// Função formatCurrency (igual ao componente)
const formatCurrency = (value) => {
  const numericValue = value.replace(/\D/g, '');
  const number = parseFloat(numericValue) / 100;
  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função parseCurrency (igual ao componente)
const parseCurrency = (formattedValue) => {
  const numericValue = formattedValue.replace(/[^\d]/g, '');
  return parseFloat(numericValue) / 100;
};

// Testes
console.log('=== TESTES DE CONVERSÃO DE VALORES ===');

// Teste 1: Digite "1000" no campo
console.log('1. Digite "1000" no campo:');
const input1 = "1000";
const formatted1 = formatCurrency(input1);
const parsed1 = parseCurrency(formatted1);
console.log(`   Input: "${input1}"`);
console.log(`   Formatted: "${formatted1}"`);
console.log(`   Parsed: ${parsed1}`);
console.log(`   ✅ Correto: ${parsed1 === 10.00 ? 'SIM' : 'NÃO'}`);

// Teste 2: Digite "15000" no campo (R$ 150,00)
console.log('\n2. Digite "15000" no campo:');
const input2 = "15000";
const formatted2 = formatCurrency(input2);
const parsed2 = parseCurrency(formatted2);
console.log(`   Input: "${input2}"`);
console.log(`   Formatted: "${formatted2}"`);
console.log(`   Parsed: ${parsed2}`);
console.log(`   ✅ Correto: ${parsed2 === 150.00 ? 'SIM' : 'NÃO'}`);

// Teste 3: Digite "123456" no campo (R$ 1.234,56)
console.log('\n3. Digite "123456" no campo:');
const input3 = "123456";
const formatted3 = formatCurrency(input3);
const parsed3 = parseCurrency(formatted3);
console.log(`   Input: "${input3}"`);
console.log(`   Formatted: "${formatted3}"`);
console.log(`   Parsed: ${parsed3}`);
console.log(`   ✅ Correto: ${parsed3 === 1234.56 ? 'SIM' : 'NÃO'}`);

console.log('\n=== RESULTADO ===');
console.log('Se todos os testes mostraram "SIM", a conversão está funcionando corretamente!');
console.log('Agora os valores serão salvos corretamente no banco de dados.');
