# Sistema de Relatórios - Documentação

## Visão Geral

O sistema de relatórios permite gerenciar relatórios de bombeamento com funcionalidades completas de criação, visualização, filtros e controle de status.

## Arquivos Criados

### 1. `src/types/reports.ts`
Define os tipos TypeScript para o sistema de relatórios:
- `ReportStatus`: Status possíveis dos relatórios
- `Report`: Interface principal do relatório
- `ReportWithRelations`: Relatório com dados relacionados (cliente, bomba, empresa)
- `CreateReportData`: Dados para criação de relatório
- `ReportFilters`: Filtros para listagem
- `NoteData`: Dados para notas fiscais

### 2. `src/pages/reports/ReportsList.tsx`
**Rota:** `/reports`

**Funcionalidades:**
- Lista todos os relatórios em tabela paginada (20 por página)
- Filtros por status, data, bomba e cliente
- Ações: Ver detalhes, WhatsApp, Alterar status
- Ordenação padrão por data (mais recente primeiro)
- Cores de status: Pendente (vermelho), Confirmado (amarelo), Pago (verde), Nota Emitida (azul)

**Filtros disponíveis:**
- Status (multi-select)
- Data inicial e final
- Prefixo da bomba
- Cliente (autocomplete)

### 3. `src/pages/reports/NewReport.tsx`
**Rota:** `/reports/new`

**Funcionalidades:**
- Formulário completo para criação de relatórios
- Auto-preenchimento de dados do cliente e bomba
- Geração automática de número único do relatório
- Validação com Zod schema
- Atualização automática do total faturado da bomba

**Campos obrigatórios:**
- Data
- Cliente
- Nome do representante
- Endereço da obra
- Bomba
- Volume realizado
- Valor total

**Campos opcionais:**
- Telefone do cliente
- Volume planejado
- Equipe
- Observações

### 4. `src/pages/reports/ReportDetails.tsx`
**Rota:** `/reports/:id`

**Funcionalidades:**
- Visualização completa dos dados do relatório
- Ações: WhatsApp, Editar, Alterar status, Adicionar NF
- Histórico de mudanças (quando disponível)
- Modal para criação de nota fiscal

## Funcionalidades Especiais

### Geração de Número de Relatório
O sistema tenta usar uma RPC `create_report_with_number` se disponível, caso contrário gera no frontend:
- Formato: `RPT-YYYYMMDD-XXXX`
- Verifica unicidade antes de inserir
- Máximo 10 tentativas

### Integração WhatsApp
Template automático:
```
Olá {rep_name}, aqui é Henrique da {owner_company}. 
Sobre o bombeamento {report_number} em {date}: 
volume {realized_volume} m³, valor R$ {total_value}. 
Confirma a forma de pagamento e se posso emitir a nota? 
Obrigado.
```

### Controle de Status
- **PENDENTE**: Status inicial
- **CONFIRMADO**: Cliente confirmou o bombeamento
- **PAGO**: Pagamento realizado (registra data de pagamento)
- **NOTA_EMITIDA**: Nota fiscal emitida

### Atualização de Total Faturado
Ao criar um relatório, o sistema atualiza automaticamente o campo `total_billed` da bomba:
- Tenta usar RPC `increment_pump_total_billed` se disponível
- Caso contrário, faz fetch + update manual

## RPC Functions (Opcionais)

O arquivo `reports-rpc-functions.sql` contém funções SQL avançadas:

### 1. `create_report_with_number`
Gera número único de relatório com validações.

### 2. `increment_pump_total_billed`
Atualiza total faturado da bomba de forma segura.

### 3. `get_reports_stats`
Retorna estatísticas de relatórios por período.

### 4. `create_bombing_report`
Função completa para criar relatório com todas as validações.

## Como Usar

### 1. Configurar Rotas
Adicione as rotas no seu sistema de roteamento:

```typescript
// Exemplo com React Router
<Route path="/reports" element={<ReportsList />} />
<Route path="/reports/new" element={<NewReport />} />
<Route path="/reports/:id" element={<ReportDetails />} />
```

### 2. Instalar Dependências
```bash
npm install date-fns zod
```

### 3. Configurar Banco de Dados
Execute o arquivo `reports-rpc-functions.sql` no Supabase SQL Editor se desejar usar as funcionalidades avançadas.

### 4. Estrutura da Tabela Reports
Certifique-se de que a tabela `reports` tenha os seguintes campos:

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  client_id UUID REFERENCES clients(id),
  client_rep_name TEXT NOT NULL,
  client_phone TEXT,
  work_address TEXT NOT NULL,
  pump_id UUID REFERENCES pumps(id),
  pump_prefix TEXT NOT NULL,
  pump_owner_company_id UUID REFERENCES companies(id),
  planned_volume NUMERIC,
  realized_volume NUMERIC NOT NULL,
  team TEXT,
  total_value NUMERIC NOT NULL,
  status TEXT DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'PAGO', 'NOTA_EMITIDA')),
  observations TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Segurança e Performance

- Uso de transactions/RPC quando possível
- Validação de dados com Zod
- Desabilitação de botões durante operações
- Logs de erro com contexto
- Paginação para grandes volumes de dados
- Índices recomendados nos campos de filtro

## Troubleshooting

### Erro de Geração de Número
Se a geração de número único falhar, verifique:
1. Se a tabela `reports` tem constraint UNIQUE em `report_number`
2. Se há muitos relatórios na mesma data
3. Se a RPC `create_report_with_number` está funcionando

### Erro de Atualização de Bomba
Se a atualização do total faturado falhar:
1. Verifique se a bomba existe
2. Verifique se o campo `total_billed` existe na tabela `pumps`
3. Verifique permissões RLS

### Problemas de Performance
Para grandes volumes de dados:
1. Adicione índices nos campos de filtro
2. Use paginação adequada
3. Considere cache para dados de clientes/bombas
