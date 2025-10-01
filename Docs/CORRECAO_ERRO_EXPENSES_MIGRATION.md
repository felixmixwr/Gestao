# Correção do Erro na Migração da Tabela Expenses

## 🚨 Problema Identificado

**Erro:** `ERROR: 42703: column "categoria" does not exist@012_create_expenses_table.sql`

## 🔍 Análise do Problema

O erro ocorreu porque:

1. **Tabela já existia parcialmente**: A tabela `expenses` pode ter sido criada anteriormente com uma estrutura incompleta ou corrompida
2. **Dependências não verificadas**: O script original não verificava se as tabelas dependentes (`pumps`, `companies`, `notas_fiscais`) existiam
3. **Uso de `IF NOT EXISTS`**: O comando `CREATE TABLE IF NOT EXISTS` não recria a tabela se ela já existir, mesmo com estrutura incorreta

## ✅ Solução Implementada

### 1. Script de Diagnóstico
Criado `check_expenses_table.sql` para verificar:
- Se a tabela `expenses` existe
- Estrutura atual da tabela
- Status das tabelas dependentes
- Políticas RLS ativas

### 2. Script de Migração Corrigido
Atualizado `execute_expenses_migration.sql` com:

#### Verificações de Dependências
```sql
DO $$
BEGIN
    -- Verificar se a tabela pumps existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pumps') THEN
        RAISE EXCEPTION 'Tabela pumps não existe. Execute primeiro a migração das bombas.';
    END IF;
    
    -- Verificar se a tabela companies existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        RAISE EXCEPTION 'Tabela companies não existe. Execute primeiro a migração das empresas.';
    END IF;
END $$;
```

#### Recreação Completa da Tabela
```sql
-- Remover a tabela expenses se ela existir (para recriar do zero)
DROP TABLE IF EXISTS expenses CASCADE;

-- Criar a tabela expenses
CREATE TABLE expenses (
    -- estrutura completa...
);
```

#### Políticas RLS Completas
- Política para SELECT
- Política para INSERT
- Política para UPDATE
- Política para DELETE

## 🚀 Como Executar a Correção

### Passo 1: Diagnóstico
Execute primeiro o script de diagnóstico:
```sql
-- Execute no SQL Editor do Supabase
\i scripts/check_expenses_table.sql
```

### Passo 2: Migração Corrigida
Execute o script corrigido:
```sql
-- Execute no SQL Editor do Supabase
\i scripts/execute_expenses_migration.sql
```

### Passo 3: Verificação
Após a execução, verifique se tudo foi criado corretamente:
```sql
-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT policyname, cmd, permissive, roles 
FROM pg_policies 
WHERE tablename = 'expenses';

-- Teste de inserção (opcional)
INSERT INTO expenses (
    descricao, categoria, valor, tipo_custo, data_despesa, 
    pump_id, company_id, status
) VALUES (
    'Teste de inserção', 'Outros', 100.00, 'fixo', 
    CURRENT_DATE, 
    (SELECT id FROM pumps LIMIT 1),
    (SELECT id FROM companies LIMIT 1),
    'pendente'
);
```

## 📋 Estrutura Final da Tabela Expenses

| Campo | Tipo | Descrição | Restrições |
|-------|------|-----------|------------|
| `id` | UUID | Chave primária | Auto-gerado |
| `descricao` | TEXT | Descrição da despesa | NOT NULL |
| `categoria` | TEXT | Categoria da despesa | CHECK (Mão de obra, Diesel, Manutenção, Imposto, Outros) |
| `valor` | DECIMAL(10,2) | Valor da despesa | NOT NULL, > 0 |
| `tipo_custo` | TEXT | Tipo do custo | CHECK (fixo, variável) |
| `data_despesa` | DATE | Data da despesa | NOT NULL |
| `pump_id` | UUID | ID da bomba | FK para pumps |
| `company_id` | UUID | ID da empresa | FK para companies |
| `status` | TEXT | Status da despesa | CHECK (pendente, pago, cancelado) |
| `quilometragem_atual` | INTEGER | Quilometragem atual | Opcional |
| `quantidade_litros` | DECIMAL(8,2) | Quantidade de litros | Opcional |
| `custo_por_litro` | DECIMAL(8,2) | Custo por litro | Opcional |
| `nota_fiscal_id` | UUID | ID da nota fiscal | FK para notas_fiscais |
| `observacoes` | TEXT | Observações | Opcional |
| `created_at` | TIMESTAMP | Data de criação | Auto-gerado |
| `updated_at` | TIMESTAMP | Data de atualização | Auto-atualizado |

## 🔒 Segurança (RLS)

A tabela está protegida com Row Level Security:
- Usuários só podem ver despesas da sua empresa
- Usuários só podem inserir/atualizar/deletar despesas da sua empresa
- Políticas baseadas no `company_id` do usuário autenticado

## 📊 Índices Criados

### Índices Simples
- `idx_expenses_company_id`
- `idx_expenses_pump_id`
- `idx_expenses_categoria`
- `idx_expenses_data_despesa`
- `idx_expenses_status`
- `idx_expenses_tipo_custo`
- `idx_expenses_nota_fiscal_id`

### Índices Compostos
- `idx_expenses_company_data` (company_id, data_despesa)
- `idx_expenses_pump_data` (pump_id, data_despesa)
- `idx_expenses_categoria_data` (categoria, data_despesa)

## ⚠️ Observações Importantes

1. **Backup**: Sempre faça backup antes de executar migrações
2. **Ordem**: Execute as migrações na ordem correta (dependências primeiro)
3. **Teste**: Teste a inserção de dados após a migração
4. **RLS**: Verifique se as políticas RLS estão funcionando corretamente

## 🎯 Próximos Passos

Após executar a migração corrigida:
1. Teste a inserção de dados de exemplo
2. Verifique se as políticas RLS estão funcionando
3. Implemente a interface de usuário para gerenciar despesas
4. Configure relatórios e dashboards para análise financeira


