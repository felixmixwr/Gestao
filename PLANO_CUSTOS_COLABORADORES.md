# 💰 Plano de Custos de Colaboradores - Módulo Financeiro

## 🎯 Visão Geral

Implementei um **plano completo de custos de colaboradores** integrado ao módulo financeiro, permitindo acompanhar todos os gastos relacionados à mão de obra da empresa.

## 🔧 Funcionalidades Implementadas

### 1. **Função de Cálculo de Custos**
- **Localização**: `src/lib/financialApi.ts` - função `getColaboradoresCosts()`
- **Cálculo Automático**: 
  - ✅ **Salários fixos** (contratos fixos)
  - ✅ **Valores de pagamento** (contratos diaristas)
  - ✅ **Horas extras** do mês atual
  - ✅ **Custo total** (salários + horas extras)

### 2. **Integração no Dashboard**
- **Card específico**: "Custos Colaboradores" no dashboard principal
- **Informações exibidas**:
  - 💰 **Custo total** dos colaboradores
  - 💼 **Salários** separados
  - ⏰ **Horas extras** separadas
  - 🔗 **Link direto** para módulo de colaboradores

### 3. **Estrutura de Dados**
```typescript
interface ColaboradoresCosts {
  custo_salarios: number      // Total de salários
  custo_horas_extras: number  // Total de horas extras
  custo_total: number         // Soma total
}
```

## 📊 Como Funciona

### **Contratos Fixos**
- Usa o campo `salario_fixo` da tabela `colaboradores`
- Valor mensal fixo independente de dias trabalhados

### **Contratos Diaristas**
- Soma os valores de `valor_pagamento_1` + `valor_pagamento_2`
- Permite pagamentos em duas parcelas no mês

### **Horas Extras**
- Busca da tabela `colaboradores_horas_extras`
- Filtra apenas horas extras do mês atual
- Usa o campo `valor_calculado` (já calculado automaticamente)

## 🎨 Interface Visual

### **Card no Dashboard**
```
┌─────────────────────────────────────┐
│ 👥 Custos Colaboradores            │
│ R$ 25.000,00                        │
│ Salários: R$ 20.000,00 +           │
│ Extras: R$ 5.000,00                │
│ [Ver colaboradores →]              │
└─────────────────────────────────────┘
```

### **Cores e Ícones**
- **Cor**: Laranja (orange)
- **Ícone**: Pessoas/Colaboradores
- **Link**: Direciona para `/colaboradores`

## 🔄 Atualização Automática

### **Frequência**
- ✅ Atualizado **automaticamente** a cada carregamento do dashboard
- ✅ Dados **em tempo real** do banco de dados
- ✅ Sem necessidade de configuração manual

### **Dados em Tempo Real**
- ✅ Salários atualizados conforme cadastro de colaboradores
- ✅ Horas extras calculadas automaticamente
- ✅ Contratos alterados refletem no cálculo

## 📈 Benefícios

### **Para Gestão Financeira**
- ✅ **Visão completa** dos custos de mão de obra
- ✅ **Controle de despesas** por categoria
- ✅ **Acompanhamento mensal** de gastos com pessoal

### **Para Tomada de Decisão**
- ✅ **Dados precisos** para orçamento
- ✅ **Análise de custos** por tipo de contrato
- ✅ **Controle de horas extras**

### **Para Relatórios**
- ✅ **Integração** com módulo financeiro
- ✅ **Dados exportáveis** para relatórios
- ✅ **Histórico** de custos por mês

## 🚀 Próximos Passos (Opcionais)

### **Melhorias Futuras**
- 📊 **Gráficos** de evolução dos custos
- 📅 **Comparativo** mês anterior
- 📋 **Relatórios** específicos de custos
- 💾 **Exportação** para Excel/PDF

### **Integrações Adicionais**
- 🏦 **Integração** com folha de pagamento
- 📊 **Dashboard** específico de RH
- 📈 **Projeções** de custos futuros

## ✅ Status: Implementado e Funcional

O plano de custos de colaboradores está **100% implementado** e integrado ao sistema financeiro, fornecendo visibilidade completa dos gastos com mão de obra no dashboard principal.

---

*Implementado em: Dezembro 2024*
*Arquivos modificados: financialApi.ts, dashboard-api.ts, Dashboard.tsx*
