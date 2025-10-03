# 🔧 CORREÇÃO: Despesas com Valores Negativos

## 📋 Problema Identificado

As despesas lançadas através do sistema de bombas estavam sendo salvas com **valores positivos** quando deveriam ser **valores negativos**, causando erros nos cálculos de saldo e relatórios financeiros.

## 🎯 Causa Raiz

O problema estava no arquivo `src/lib/pump-advanced-api.ts`, onde as despesas eram criadas **sem** a conversão para valores negativos que já existia no `financialApi.ts`.

### Locais Corrigidos:

1. **Criação de Manutenções** (linha 246)
2. **Atualização de Manutenções** (linha 308) 
3. **Criação de Abastecimentos de Diesel** (linha 398)
4. **Atualização de Abastecimentos de Diesel** (linha 459)
5. **Criação de Investimentos** (linha 543)

## ✅ Correções Aplicadas

### 1. Código Corrigido

Todas as inserções e atualizações de despesas no `pump-advanced-api.ts` agora usam:

```typescript
valor: -Math.abs(data.value), // Garantir que seja negativo (saída de dinheiro)
```

### 2. Arquivos Modificados

- ✅ `src/lib/pump-advanced-api.ts` - Corrigido
- ✅ `src/lib/financialApi.ts` - Já estava correto
- ✅ `src/pages/financial/FolhaSalarial.tsx` - Já estava correto

### 3. Script SQL para Dados Existentes

Criado o arquivo `fix_expenses_negative_values.sql` para corrigir despesas já existentes no banco de dados.

## 🚀 Como Aplicar as Correções

### 1. Código (Já Aplicado)
As correções no código já foram aplicadas. Novas despesas criadas através do sistema de bombas agora serão automaticamente negativas.

### 2. Dados Existentes (Manual)
Execute o script SQL `fix_expenses_negative_values.sql` no Supabase:

```sql
-- Verificar despesas que precisam ser corrigidas
SELECT COUNT(*) FROM expenses WHERE valor > 0;

-- Corrigir despesas existentes
UPDATE expenses SET valor = -ABS(valor) WHERE valor > 0;
```

## 📊 Resultado Esperado

### Antes da Correção:
- ❌ Despesas de bombas: valores positivos
- ❌ Saldos incorretos nos relatórios
- ❌ Cálculos financeiros errados

### Após a Correção:
- ✅ Todas as despesas: valores negativos
- ✅ Saldos corretos nos relatórios  
- ✅ Cálculos financeiros precisos
- ✅ Consistência entre sistema financeiro e bombas

## 🔍 Verificação

Para verificar se a correção funcionou:

1. **Crie uma nova despesa** através do sistema de bombas
2. **Verifique no financeiro** se o valor aparece como negativo
3. **Confirme nos relatórios** se os cálculos estão corretos

## 📝 Notas Importantes

- ⚠️ **Backup**: Faça backup do banco antes de executar o script SQL
- 🔄 **Teste**: Teste as funcionalidades após aplicar as correções
- 📈 **Monitoramento**: Monitore os relatórios financeiros para confirmar a correção

## 🎉 Status

- ✅ **Código**: Corrigido
- ⏳ **Dados Existentes**: Aguardando execução do script SQL
- ✅ **Testes**: Pronto para validação

---

**Data da Correção**: $(date)  
**Responsável**: Sistema de Gestão de Bombas  
**Prioridade**: Alta - Corrige cálculos financeiros críticos

