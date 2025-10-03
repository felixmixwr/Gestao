# Sistema de Busca Avançada para Relatórios

## Funcionalidade Implementada

Foi implementado um sistema completo de busca na página de relatórios que permite aos usuários encontrar relatórios de forma rápida e eficiente através de múltiplos critérios.

## Tipos de Busca Disponíveis

### 🔍 **Busca Simples**
- **Campo único** com dropdown para seleção do tipo de busca
- **Busca em tempo real** com Enter ou botão de busca
- **Tipos de busca disponíveis:**
  - **ID do Relatório:** Busca por número do relatório (ex: RPT-20241201-0001)
  - **Data:** Busca por data específica (formato YYYY-MM-DD)
  - **Cliente:** Busca por nome do representante do cliente
  - **Bomba:** Busca por prefixo da bomba (ex: WR-001)
  - **Volume (m³):** Busca por volume realizado exato
  - **Valor (R$):** Busca por valor total exato

### 🔍 **Busca Avançada**
- **Interface expansível** com múltiplos campos de filtro
- **Filtros independentes** que podem ser combinados
- **Campos disponíveis:**
  - **ID do Relatório:** Busca parcial por número
  - **Nome do Cliente:** Busca parcial por nome do representante
  - **Prefixo da Bomba:** Busca parcial por prefixo
  - **Volume Mínimo/Máximo:** Faixa de volume (m³)
  - **Valor Mínimo/Máximo:** Faixa de valor (R$)

## Interface do Usuário

### **Barra de Busca Principal**
```
┌─────────────────────────────────────────────────────────────┐
│ [Campo de Busca] [Tipo ▼] [🔍 Buscar] [Limpar]             │
│                                                             │
│ [🔍 Busca Avançada]                                        │
└─────────────────────────────────────────────────────────────┘
```

### **Busca Avançada (Expandida)**
```
┌─────────────────────────────────────────────────────────────┐
│ Filtros Avançados                                           │
│                                                             │
│ ID do Relatório    │ Nome do Cliente    │ Prefixo da Bomba  │
│ [RPT-20241201...] │ [João Silva]       │ [WR-001]          │
│                                                             │
│ Volume Mín (m³)    │ Volume Máx (m³)    │ Valor Mín (R$)    │
│ [10.0]             │ [100.0]            │ [100.00]          │
│                                                             │
│ Valor Máx (R$)                                             │
│ [1000.00]                                                  │
│                                                             │
│ [🔍 Aplicar Filtros] [Limpar Filtros]                      │
└─────────────────────────────────────────────────────────────┘
```

## Funcionalidades Técnicas

### **Lógica de Busca**
- **Busca Case-Insensitive:** Todas as buscas de texto ignoram maiúsculas/minúsculas
- **Busca Parcial:** Para campos de texto, busca por substring
- **Busca Exata:** Para campos numéricos (volume/valor), busca por valor exato
- **Combinação de Filtros:** Múltiplos filtros podem ser aplicados simultaneamente

### **Performance**
- **Queries Otimizadas:** Uso de índices do banco de dados
- **Paginação:** Resultados limitados por página para melhor performance
- **Debounce Implícito:** Busca executada apenas ao pressionar Enter ou clicar no botão

### **Estados da Interface**
- **Loading:** Indicador de carregamento durante a busca
- **Resultados Vazios:** Mensagem quando nenhum resultado é encontrado
- **Filtros Ativos:** Indicador visual quando filtros estão aplicados
- **Limpeza de Filtros:** Botão para limpar todos os filtros de uma vez

## Exemplos de Uso

### **Busca Simples**
1. **Por ID:** Digite "RPT-20241201" e selecione "ID do Relatório"
2. **Por Cliente:** Digite "João" e selecione "Cliente"
3. **Por Volume:** Digite "50.5" e selecione "Volume (m³)"

### **Busca Avançada**
1. **Relatórios de um cliente específico:**
   - Nome do Cliente: "João Silva"
   
2. **Relatórios com volume entre 20 e 80 m³:**
   - Volume Mínimo: 20.0
   - Volume Máximo: 80.0
   
3. **Relatórios de valor alto:**
   - Valor Mínimo: 1000.00

4. **Combinação complexa:**
   - Prefixo da Bomba: "WR-"
   - Volume Mínimo: 30.0
   - Valor Máximo: 2000.00

## Arquivos Modificados

1. **`src/types/reports.ts`**
   - Atualizada interface `ReportFilters` com novos campos de busca
   - Adicionados campos para busca avançada

2. **`src/pages/reports/ReportsList.tsx`**
   - Implementada barra de busca principal
   - Adicionada interface de busca avançada
   - Implementada lógica de busca no backend
   - Adicionadas funções de controle de filtros

## Benefícios da Implementação

### **Para o Usuário**
- ✅ **Busca Rápida:** Encontra relatórios em segundos
- ✅ **Flexibilidade:** Múltiplas formas de buscar
- ✅ **Intuitividade:** Interface clara e fácil de usar
- ✅ **Eficiência:** Combina filtros para resultados precisos

### **Para o Sistema**
- ✅ **Performance:** Queries otimizadas
- ✅ **Escalabilidade:** Funciona com grandes volumes de dados
- ✅ **Manutenibilidade:** Código bem estruturado
- ✅ **Extensibilidade:** Fácil adicionar novos tipos de busca

## Casos de Uso Comuns

1. **Encontrar relatório específico:** Busca por ID exato
2. **Relatórios de um cliente:** Busca por nome do cliente
3. **Relatórios de uma bomba:** Busca por prefixo da bomba
4. **Relatórios de alto volume:** Filtro por volume mínimo
5. **Relatórios de alto valor:** Filtro por valor mínimo
6. **Análise de performance:** Combinação de múltiplos filtros

## Status da Implementação

✅ **Busca Simples:** Implementada e funcionando
✅ **Busca Avançada:** Implementada e funcionando
✅ **Interface Responsiva:** Adapta-se a diferentes tamanhos de tela
✅ **Integração com Filtros Existentes:** Funciona junto com filtros de status e data
✅ **Performance Otimizada:** Queries eficientes implementadas
✅ **Documentação Completa:** Guia de uso e exemplos fornecidos

A funcionalidade está pronta para uso e oferece uma experiência de busca completa e intuitiva para os usuários do sistema!










