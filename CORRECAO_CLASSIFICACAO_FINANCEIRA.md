# Correção da Classificação Financeira - Sistema Entrada/Saída

## Resumo das Alterações

Foi implementada uma nova classificação financeira que diferencia claramente **Entradas** (faturamento) de **Saídas** (despesas) no sistema financeiro.

## Principais Mudanças

### 1. **Nova Classificação de Transações**
- **Entrada**: Faturamento de relatórios pagos (valores positivos)
- **Saída**: Todas as despesas e custos (valores negativos)

### 2. **Atualizações no Banco de Dados**
- Nova coluna `tipo_transacao` na tabela `expenses`
- Nova coluna `relatorio_id` para vincular faturamento aos relatórios
- Índices e constraints para melhorar performance e integridade

### 3. **Modificações na API**
- Função `createExpense()` agora classifica automaticamente baseada no tipo
- Nova função `createFaturamentoFromReport()` para criar entradas de faturamento
- Nova função `syncFaturamentoFromReports()` para sincronizar todos os relatórios pagos
- Filtros atualizados para incluir tipo de transação

### 4. **Interface do Usuário**
- Nova coluna "Tipo Transação" na tabela de despesas
- Filtros por tipo de transação (Entrada/Saída)
- Cores diferenciadas: verde para entradas, vermelho para saídas
- Campo obrigatório no formulário de despesas
- Botão "Sincronizar Faturamento" no dashboard

### 5. **Integração com Relatórios**
- Relatórios com status "PAGO" são automaticamente convertidos em entradas de faturamento
- Sincronização manual via botão no dashboard
- Evita duplicação de entradas de faturamento

## Como Usar

### Para Despesas (Saídas):
1. Criar nova despesa normalmente
2. Selecionar "Saída" como tipo de transação
3. O valor será automaticamente negativo

### Para Faturamento (Entradas):
1. Usar o botão "Sincronizar Faturamento" no dashboard
2. Todos os relatórios pagos serão convertidos em entradas
3. Ou criar manualmente selecionando "Entrada"

### Filtros:
- Use o filtro "Tipo de Transação" para ver apenas entradas ou saídas
- Combine com outros filtros para análise específica

## Script de Atualização

Execute o arquivo `update_financial_classification.sql` no Supabase SQL Editor para:
- Adicionar as novas colunas
- Atualizar registros existentes
- Criar índices e constraints
- Verificar a integridade dos dados

## Benefícios

1. **Clareza Financeira**: Separação clara entre receitas e despesas
2. **Automação**: Faturamento automático a partir de relatórios pagos
3. **Filtros Avançados**: Possibilidade de analisar apenas entradas ou saídas
4. **Integridade**: Validação automática de tipos de transação
5. **Performance**: Índices otimizados para consultas frequentes

## Observações Importantes

- Todas as despesas existentes foram automaticamente classificadas como "Saída"
- Valores positivos são entradas, negativos são saídas
- O sistema evita duplicação de faturamento dos relatórios
- A sincronização pode ser executada múltiplas vezes sem problemas

