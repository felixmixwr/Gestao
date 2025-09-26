# Migrações do Banco de Dados - Módulo de Notas Fiscais

Este diretório contém os scripts SQL para configurar o módulo de Notas Fiscais (Invoices) no Supabase.

## 📋 Scripts Disponíveis

### 001_create_invoice_seq_and_table.sql
- Cria a sequence `invoice_number_seq` para numeração automática
- Cria a tabela `invoices` com todas as colunas necessárias
- Configura índices para performance
- Habilita Row Level Security (RLS)
- Cria políticas de segurança

### 002_trigger_set_invoice_number.sql
- Cria função `set_invoice_number()` para popular automaticamente o campo `nf_number`
- Cria trigger `trg_set_invoice_number` que executa antes de INSERT
- Formata o número da nota fiscal com zero-padding de 6 dígitos

### 003_view_pending_reports.sql
- Cria view `pending_reports_for_invoice` - relatórios pendentes de nota fiscal
- Cria view `reports_with_invoices` - relatórios já com nota fiscal
- Cria view `invoice_statistics` - estatísticas de notas fiscais por empresa

### 004_fix_views_robust.sql (Opcional - Correção)
- Corrige as views para serem mais robustas
- Inclui função `column_exists()` para verificar colunas
- Inclui função `create_dynamic_pending_reports_view()` para criar view dinamicamente
- Use este script se encontrar erros de colunas inexistentes

## 🚀 Como Executar

### Opção 1: SQL Editor do Supabase (Recomendado)
1. Acesse o painel do Supabase
2. Vá em **SQL Editor**
3. Execute os scripts **na ordem**:
   - `001_create_invoice_seq_and_table.sql`
   - `002_trigger_set_invoice_number.sql`
   - `003_view_pending_reports.sql`
   - `004_fix_views_robust.sql` (se encontrar erros de colunas)

### Opção 2: psql (linha de comando)
```bash
# Conecte ao seu banco Supabase
psql "postgresql://postgres:[password]@[host]:5432/postgres"

# Execute as migrações na ordem
\i db/migrations/001_create_invoice_seq_and_table.sql
\i db/migrations/002_trigger_set_invoice_number.sql
\i db/migrations/003_view_pending_reports.sql
\i db/migrations/004_fix_views_robust.sql
```

## ⚠️ Importante

- **Execute os scripts na ordem correta** (001 → 002 → 003)
- Verifique se a tabela `reports` já existe antes de executar
- Se houver divergência de nomes de tabelas no seu DB atual, adapte os nomes antes de executar
- As migrações são **idempotentes** (podem ser executadas múltiplas vezes sem problemas)

## 🔍 Verificação Pós-Execução

Após executar as migrações, verifique se tudo foi criado corretamente:

```sql
-- Verificar se a tabela invoices foi criada
SELECT * FROM invoices LIMIT 1;

-- Verificar se a sequence existe
SELECT nextval('invoice_number_seq');

-- Verificar se as views foram criadas
SELECT * FROM pending_reports_for_invoice LIMIT 1;
SELECT * FROM reports_with_invoices LIMIT 1;
SELECT * FROM invoice_statistics LIMIT 1;

-- Verificar se o trigger está funcionando
INSERT INTO invoices (report_id, nf_date, nf_value) 
VALUES (NULL, CURRENT_DATE, 100.00);
SELECT nf_number FROM invoices ORDER BY created_at DESC LIMIT 1;
```

## 📊 Estrutura da Tabela invoices

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `report_id` | UUID | Referência ao relatório (FK) |
| `nf_seq` | INTEGER | Sequência numérica da nota |
| `nf_number` | TEXT | Número formatado (000001, 000002, etc.) |
| `nf_date` | DATE | Data da nota fiscal |
| `nf_value` | NUMERIC(12,2) | Valor total da nota |
| `nf_due_date` | DATE | Data de vencimento |
| `company_logo` | TEXT | Caminho para logo da empresa |
| `phone` | TEXT | Telefone da empresa |
| `company_name` | TEXT | Nome da empresa |
| `address` | TEXT | Endereço da empresa |
| `cnpj_cpf` | TEXT | CNPJ/CPF da empresa |
| `city` | TEXT | Cidade |
| `cep` | TEXT | CEP |
| `uf` | TEXT | Estado (UF) |
| `descricao` | TEXT | Descrição dos serviços |
| `obs` | TEXT | Observações |
| `file_xlsx_path` | TEXT | Caminho para arquivo Excel |
| `file_pdf_path` | TEXT | Caminho para arquivo PDF |
| `created_by` | UUID | Usuário que criou (FK) |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data de atualização |

## 🔐 Segurança (RLS)

As políticas de Row Level Security garantem que:
- Usuários só veem notas fiscais da sua empresa
- Usuários só podem gerenciar notas fiscais da sua empresa
- A segurança é aplicada automaticamente pelo Supabase

## 🎯 Views Disponíveis

### pending_reports_for_invoice
Lista relatórios com status 'NOTA_EMITIDA' que ainda não possuem nota fiscal vinculada.

### reports_with_invoices  
Lista todos os relatórios que já possuem nota fiscal emitida, incluindo dados da nota.

### invoice_statistics
Estatísticas de notas fiscais por empresa (total, últimos 30 dias, últimos 7 dias, valores médios).