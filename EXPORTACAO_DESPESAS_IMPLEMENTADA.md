# 📊 Sistema de Exportação de Despesas - IMPLEMENTADO

## ✅ **FUNCIONALIDADE COMPLETA IMPLEMENTADA!**

### 🎯 **Características Principais:**

#### 📄 **Exportação Profissional em PDF**
- **Formato**: A4 Retrato, profissional e organizado
- **Paginação**: Configurável (25, 50, 100, 200 itens por página)
- **Layout**: Tabela estruturada com todas as informações necessárias
- **Cabeçalho**: Logo, título, data de geração, estatísticas rápidas
- **Rodapé**: Informações da empresa, timestamp, numeração de páginas

#### 🔧 **Opções de Configuração**
- **Itens por página**: 25 (padrão), 50, 100, 200
- **Resumo executivo**: Estatísticas e análises no início
- **Filtros aplicados**: Nome da empresa, bomba, período
- **Informações detalhadas**: Todas as colunas de despesas

#### 📋 **Dados Incluídos no PDF:**

##### **Cabeçalho:**
- Título: "RELATÓRIO DE DESPESAS"
- Subtítulo com filtros aplicados (empresa, bomba)
- Data e hora de geração
- Estatísticas rápidas (total de despesas, valor total, despesas pagas)

##### **Resumo Executivo (Opcional):**
- Total de despesas e valor total
- Despesas pagas vs pendentes
- Análise por categoria (Mão de obra, Diesel, Manutenção, etc.)
- Análise por tipo de custo (Fixo vs Variável)

##### **Tabela Detalhada:**
- **#**: Número sequencial
- **Data**: Data da despesa (formato brasileiro)
- **Descrição**: Descrição da despesa (truncada se necessário)
- **Categoria**: Tipo da despesa
- **Tipo**: Fixo ou Variável
- **Bomba**: Prefixo da bomba
- **Empresa**: Nome da empresa (truncado se necessário)
- **Status**: Pago, Pendente ou Cancelado
- **Valor**: Valor da despesa (sempre positivo para exibição)

##### **Rodapé:**
- Informações da empresa (Felix Mix / WorldRental)
- Timestamp de geração
- Numeração de páginas (Página X de Y)

### 🚀 **Como Usar:**

#### 1. **Acesse os Relatórios Financeiros**
- Vá para `/financial/reports`
- Configure os filtros de período desejado
- Aguarde o carregamento das despesas

#### 2. **Localize o Botão de Exportação**
- Botão "Exportar PDF" no canto superior direito
- Mostra o número de despesas disponíveis
- Fica desabilitado se não houver despesas

#### 3. **Configure as Opções**
- **Itens por página**: Escolha entre 25, 50, 100 ou 200
- **Resumo executivo**: Ative/desative para incluir análises
- **Gráficos**: Em desenvolvimento (desabilitado)

#### 4. **Exporte o PDF**
- Clique em "Exportar PDF"
- O arquivo será baixado automaticamente
- Nome do arquivo inclui data e filtros aplicados

### 📁 **Nome do Arquivo:**
Formato: `despesas_YYYY-MM-DD_[empresa]_[bomba]_[periodo].pdf`

Exemplos:
- `despesas_2025-01-15.pdf` (todas as despesas)
- `despesas_2025-01-15_FELIX_MIX.pdf` (filtrado por empresa)
- `despesas_2025-01-15_bomba_WM-001.pdf` (filtrado por bomba)
- `despesas_2025-01-15_2025-01-01_a_2025-01-31.pdf` (filtrado por período)

### 🎨 **Design Profissional:**

#### **Cores:**
- **Azul corporativo**: #0066CC (títulos, cabeçalhos)
- **Cinza**: #808080 (textos secundários)
- **Vermelho**: #DC2626 (valores de despesas)
- **Verde**: #16A34A (despesas pagas)
- **Amarelo**: #CA8A04 (despesas pendentes)

#### **Tipografia:**
- **Títulos**: Helvetica Bold, 20pt
- **Subtítulos**: Helvetica Normal, 14pt
- **Cabeçalho da tabela**: Helvetica Bold, 8pt
- **Dados da tabela**: Helvetica Normal, 7pt
- **Rodapé**: Helvetica Normal, 8pt

#### **Layout:**
- **Margens**: 15mm em todos os lados
- **Espaçamento**: Consistente e profissional
- **Alternância de cores**: Linhas pares com fundo cinza claro
- **Quebra de página**: Automática quando necessário

### 🔧 **Arquivos Implementados:**

1. **`src/utils/expenses-exporter.ts`**
   - Classe `ExpensesExporter` com todas as funcionalidades
   - Métodos para cabeçalho, resumo, tabela e rodapé
   - Configurações de layout e formatação

2. **`src/components/financial/ExpensesExportButton.tsx`**
   - Componente React com interface de configuração
   - Modal com opções de exportação
   - Resumo das despesas antes da exportação

3. **`src/pages/financial/FinancialReports.tsx`**
   - Integração do botão na página de relatórios
   - Passagem de dados e filtros para o exportador

### 📊 **Exemplo de Uso:**

```typescript
// Dados de exemplo
const expensesData = {
  expenses: [...], // Array de despesas
  filters: {
    data_inicio: '2025-01-01',
    data_fim: '2025-01-31'
  },
  companyName: 'FELIX MIX',
  pumpPrefix: 'WM-001'
};

// Opções de exportação
const options = {
  itemsPerPage: 50,
  includeSummary: true,
  includeCharts: false
};

// Exportar
await ExpensesExporter.exportToPDF(expensesData, options);
```

### 🎉 **Benefícios:**

- ✅ **Profissional**: Layout corporativo e organizado
- ✅ **Flexível**: Múltiplas opções de configuração
- ✅ **Completo**: Todas as informações necessárias
- ✅ **Eficiente**: Paginação otimizada
- ✅ **Consistente**: Segue padrão dos outros relatórios
- ✅ **Automático**: Download direto do arquivo
- ✅ **Informativo**: Nome do arquivo descritivo

### 🔄 **Próximas Melhorias:**

- [ ] Gráficos de análise (em desenvolvimento)
- [ ] Exportação para Excel
- [ ] Filtros avançados na exportação
- [ ] Templates personalizáveis
- [ ] Agendamento de relatórios

---

**Status**: ✅ **IMPLEMENTADO E FUNCIONAL**  
**Data**: Janeiro 2025  
**Versão**: 1.0  
**Compatibilidade**: Todas as despesas do sistema

