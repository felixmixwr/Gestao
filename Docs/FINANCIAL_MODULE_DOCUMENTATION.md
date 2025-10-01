# Módulo Financeiro - WorldRental/Felix Mix

## Visão Geral

O módulo financeiro é um sistema completo de controle de despesas integrado ao sistema WorldRental/Felix Mix. Ele oferece funcionalidades avançadas para gestão financeira, análise de custos e integração com notas fiscais.

## Funcionalidades Principais

### 1. Dashboard Financeiro (`/financial`)
- **KPIs Principais**: Total de despesas, despesas por bomba, por empresa e por categoria
- **Gráficos Interativos**: 
  - Pizza: distribuição por categoria
  - Barras: despesas por bomba
  - Linha: evolução temporal
- **Filtros Avançados**: Por bomba, empresa, categoria, data e status
- **Lista Detalhada**: Tabela com paginação e ações rápidas

### 2. Gestão de Despesas
- **Criação** (`/financial/expenses/new`): Formulário completo com validação
- **Edição** (`/financial/expenses/edit/:id`): Modificação de despesas existentes
- **Visualização** (`/financial/expenses/view/:id`): Visualização detalhada (read-only)
- **Exclusão**: Com confirmação de segurança

### 3. Funcionalidade Especial para Combustível
- **Campos Específicos**: Quilometragem, quantidade de litros, custo por litro
- **Cálculo Automático**: Valor total calculado automaticamente
- **Feedback Visual**: Exibição do cálculo em tempo real

### 4. Integração com Notas Fiscais (`/financial/invoices`)
- **Importação Automática**: Carrega notas com status "Paga"
- **Mapeamento de Dados**: Converte automaticamente para despesas
- **Criação Facilitada**: Um clique para criar despesa a partir da nota

### 5. Relatórios Financeiros (`/financial/reports`)
- **Análise Temporal**: Relatórios por período personalizável
- **Comparações**: Por tipo de custo, categoria e bomba
- **Exportação**: PDF e Excel (funcionalidades futuras)
- **Gráficos Detalhados**: Visualizações avançadas

## Estrutura Técnica

### Arquivos Principais

```
src/
├── types/financial.ts              # Tipos TypeScript
├── lib/financialApi.ts            # Funções de API Supabase
├── components/financial/          # Componentes UI
│   ├── ExpenseCard.tsx           # Cards e KPIs
│   ├── ExpenseTable.tsx          # Tabela de despesas
│   ├── ExpenseForm.tsx           # Formulário de despesas
│   ├── ExpenseCharts.tsx         # Gráficos interativos
│   └── ExpenseFilters.tsx        # Sistema de filtros
└── pages/financial/              # Páginas do módulo
    ├── FinancialDashboard.tsx    # Dashboard principal
    ├── CreateExpense.tsx         # Criação/edição
    ├── InvoicesIntegration.tsx   # Integração com notas
    ├── FinancialReports.tsx      # Relatórios
    └── index.tsx                 # Roteamento do módulo
```

### Componentes UI Utilizados

- **Shadcn UI**: Card, Badge, Button, Input, Select, Table, Alert
- **Recharts**: Gráficos interativos (Pizza, Barras, Linha)
- **React Hook Form**: Gerenciamento de formulários
- **Zod**: Validação de dados

### Banco de Dados

#### Tabela `expenses`
```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL, -- 'Mão de obra', 'Diesel', 'Manutenção', 'Imposto', 'Outros'
    valor DECIMAL(10,2) NOT NULL,
    tipo_custo TEXT NOT NULL, -- 'fixo', 'variável'
    data_despesa DATE NOT NULL,
    bomba_id UUID REFERENCES pumps(id),
    company_id UUID REFERENCES companies(id),
    status TEXT DEFAULT 'pendente', -- 'pendente', 'pago', 'cancelado'
    quilometragem_atual INTEGER, -- Para combustível
    quantidade_litros DECIMAL(8,2), -- Para combustível
    custo_por_litro DECIMAL(8,2), -- Para combustível
    nota_fiscal_id UUID REFERENCES notas_fiscais(id),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Categorias de Despesas

### 1. Mão de obra 👷
- Salários de operadores
- Pagamentos de colaboradores
- Horas extras
- Benefícios

### 2. Diesel ⛽
- Abastecimento de combustível
- Campos específicos: quilometragem, litros, preço por litro
- Cálculo automático do valor total

### 3. Manutenção 🔧
- Reparos preventivos
- Troca de peças
- Serviços de mecânica
- Manutenção programada

### 4. Imposto 📋
- Tributos federais
- Taxas municipais
- Contribuições
- Multas

### 5. Outros 📦
- Despesas gerais
- Materiais diversos
- Serviços terceirizados
- Outros custos operacionais

## APIs e Funções

### Principais Funções

```typescript
// Gestão de despesas
getExpenses(filters?: ExpenseFilters): Promise<ExpenseWithRelations[]>
createExpense(data: CreateExpenseData): Promise<Expense>
updateExpense(data: UpdateExpenseData): Promise<Expense>
deleteExpense(id: string): Promise<void>

// Estatísticas
getFinancialStats(filters?: ExpenseFilters): Promise<FinancialStats>

// Integração com notas fiscais
getPaidInvoices(): Promise<InvoiceIntegration[]>
createExpenseFromInvoice(invoiceId: string, data: Partial<CreateExpenseData>): Promise<Expense>

// Dados auxiliares
getPumpsForSelect(companyId?: string): Promise<PumpOption[]>
getCompaniesForSelect(): Promise<CompanyOption[]>
```

### Filtros Disponíveis

```typescript
interface ExpenseFilters {
  company_id?: string;
  bomba_id?: string;
  categoria?: ExpenseCategory[];
  tipo_custo?: ExpenseType[];
  status?: ExpenseStatus[];
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}
```

## Validações

### Formulário de Despesas
- **Descrição**: Mínimo 3 caracteres
- **Categoria**: Obrigatória (enum)
- **Valor**: Maior que zero
- **Tipo de Custo**: Obrigatório (fixo/variável)
- **Data**: Obrigatória
- **Bomba**: Obrigatória (referência válida)
- **Empresa**: Obrigatória (referência válida)

### Campos Específicos do Combustível
- **Quilometragem**: Número positivo
- **Quantidade de Litros**: Número positivo
- **Custo por Litro**: Número positivo
- **Valor Total**: Calculado automaticamente

## Navegação

### Rotas Principais
- `/financial` - Dashboard principal
- `/financial/expenses/new` - Nova despesa
- `/financial/expenses/edit/:id` - Editar despesa
- `/financial/expenses/view/:id` - Visualizar despesa
- `/financial/invoices` - Integração com notas fiscais
- `/financial/reports` - Relatórios financeiros

### Navegação no Dashboard
- **Botão "+ Nova Despesa"**: Sempre visível e destacado
- **Filtros**: Expansíveis com filtros rápidos
- **Gráficos**: Interativos com tooltips
- **Tabela**: Paginação e ações inline

## Responsividade

### Mobile-First
- **Grid Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Componentes Flexíveis**: Cards e tabelas responsivos
- **Navegação Touch-Friendly**: Botões e links otimizados para touch
- **Gráficos Adaptativos**: Redimensionam automaticamente

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## Performance

### Otimizações Implementadas
- **Lazy Loading**: Componentes carregados sob demanda
- **Debounced Search**: Busca com delay para evitar requests excessivos
- **Paginação**: Limita dados carregados por vez
- **Índices de Banco**: Otimizados para consultas frequentes
- **Memoização**: Componentes memoizados quando apropriado

### Caching
- **React Query**: Para cache de dados da API (futuro)
- **Local Storage**: Para preferências do usuário
- **Supabase Cache**: Cache automático do Supabase

## Segurança

### Row Level Security (RLS)
```sql
-- Políticas de segurança (exemplo)
CREATE POLICY "Users can view their company expenses" ON expenses
    FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');
```

### Validações
- **Frontend**: Validação com Zod
- **Backend**: Constraints no banco de dados
- **API**: Validação de tipos TypeScript

## Extensibilidade

### Funcionalidades Futuras
- **Exportação PDF/Excel**: Implementação completa
- **Notificações**: Alertas de orçamento
- **Dashboard Personalizado**: Widgets configuráveis
- **Integração com Contabilidade**: APIs externas
- **Relatórios Automatizados**: Agendamento de relatórios

### Pontos de Extensão
- **Novas Categorias**: Facilmente adicionáveis
- **Novos Tipos de Gráfico**: Estrutura preparada
- **Filtros Customizados**: Sistema extensível
- **Integrações**: APIs preparadas para novas integrações

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Compilação TypeScript
```bash
# Verificar se todos os tipos estão importados
npm run build
```

#### 2. Erro de Conexão com Supabase
```bash
# Verificar variáveis de ambiente
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

#### 3. Gráficos Não Carregam
- Verificar se Recharts está instalado
- Verificar se dados estão sendo passados corretamente

#### 4. Filtros Não Funcionam
- Verificar se estado dos filtros está sendo atualizado
- Verificar se API está recebendo filtros corretos

### Logs e Debug
```typescript
// Habilitar logs detalhados
console.log('Financial API Debug:', { filters, expenses, stats });
```

## Contribuição

### Padrões de Código
- **TypeScript**: Tipagem estrita
- **ESLint**: Configuração padrão do projeto
- **Prettier**: Formatação consistente
- **Conventional Commits**: Padrão de commits

### Estrutura de Commits
```
feat(financial): add expense category filter
fix(financial): resolve chart rendering issue
docs(financial): update API documentation
```

### Testes
```bash
# Executar testes (quando implementados)
npm test
npm run test:coverage
```

## Changelog

### v1.0.0 (2025-01-29)
- ✅ Implementação inicial do módulo financeiro
- ✅ Dashboard com KPIs e gráficos
- ✅ Gestão completa de despesas
- ✅ Integração com notas fiscais
- ✅ Funcionalidade especial para combustível
- ✅ Sistema de filtros avançados
- ✅ Relatórios financeiros
- ✅ Interface responsiva e moderna
- ✅ Validação robusta com Zod
- ✅ Tipagem TypeScript completa






