# CORREÇÃO DO VOLUME NO MÓDULO FINANCEIRO

## PROBLEMA IDENTIFICADO

O módulo financeiro estava mostrando apenas **501.50 m³** enquanto o dashboard principal mostrava **2.778 m³**. A discrepância ocorria porque:

### Dashboard Principal (`dashboard-api.ts`)
- Buscava dados de **TODOS** os relatórios
- Query: `SELECT realized_volume FROM reports WHERE date = 'hoje'`
- **NÃO** filtrava por status

### Módulo Financeiro (`financialApi.ts`) - ANTES DA CORREÇÃO
- Buscava dados **APENAS** de relatórios com status `'PAGO'`
- Query: `SELECT realized_volume FROM reports WHERE date = 'hoje' AND status = 'PAGO'`
- **FILTRAVA** por status

## CORREÇÕES IMPLEMENTADAS

### 1. Função `getFaturamentoMensal()`
**ANTES:**
```typescript
.eq('status', 'PAGO')
```

**DEPOIS:**
```typescript
// REMOVIDO: .eq('status', 'PAGO') - Agora busca TODOS os relatórios
```

### 2. Função `getVolumeDiarioComBombas()`
**ANTES:**
```typescript
.eq('date', today)
.eq('status', 'PAGO')
```

**DEPOIS:**
```typescript
.eq('date', today)
// REMOVIDO: .eq('status', 'PAGO') - Agora busca TODOS os relatórios
```

### 3. Função `getVolumeSemanalComBombas()`
**ANTES:**
```typescript
.gte('date', startOfWeekStr)
.eq('status', 'PAGO')
```

**DEPOIS:**
```typescript
.gte('date', startOfWeekStr)
// REMOVIDO: .eq('status', 'PAGO') - Agora busca TODOS os relatórios
```

### 4. Função `getVolumeMensalComBombas()`
**ANTES:**
```typescript
.gte('date', startOfMonthStr)
.eq('status', 'PAGO')
```

**DEPOIS:**
```typescript
.gte('date', startOfMonthStr)
// REMOVIDO: .eq('status', 'PAGO') - Agora busca TODOS os relatórios
```

### 5. Função `getFaturamentoBrutoStats()`
**ANTES:**
```typescript
.select('total_value, realized_volume, date, status')
.eq('status', 'PAGO')
```

**DEPOIS:**
```typescript
.select('total_value, realized_volume, date, status')
// REMOVIDO: .eq('status', 'PAGO') - Agora busca TODOS os relatórios
```

## RESULTADO ESPERADO

Agora o módulo financeiro deve mostrar o mesmo volume que o dashboard principal:
- **Volume Total**: 2.778 m³ (todos os relatórios)
- **Volume Diário**: Todos os relatórios do dia
- **Volume Semanal**: Todos os relatórios da semana
- **Volume Mensal**: Todos os relatórios do mês

## ARQUIVOS MODIFICADOS

1. **`src/lib/financialApi.ts`** - Corrigidas 5 funções principais
2. **`scripts/SQL/051_verificar_discrepancia_volume.sql`** - Script para diagnosticar o problema
3. **`scripts/SQL/052_testar_correcao_volume.sql`** - Script para testar a correção

## TESTES RECOMENDADOS

1. Execute o script `051_verificar_discrepancia_volume.sql` para ver a diferença
2. Execute o script `052_testar_correcao_volume.sql` para verificar se a correção funcionou
3. Acesse o dashboard financeiro e verifique se os volumes agora batem com o dashboard principal

## OBSERVAÇÕES IMPORTANTES

- A correção mantém a consistência entre dashboard principal e módulo financeiro
- Os dados agora refletem o volume real bombeado, independente do status de pagamento
- Para análises específicas de faturamento, ainda é possível filtrar por status quando necessário

