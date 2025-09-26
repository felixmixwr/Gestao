# Configuração do Banco de Dados - Sistema de Bombas

## ⚠️ Ordem de Execução dos Scripts SQL

Para configurar corretamente o sistema de bombas, execute os scripts SQL na seguinte ordem:

### 1. Primeiro: Criar a Tabela (Se não existir)
```sql
-- Execute no Supabase SQL Editor:
pump-database-create.sql
```

**Este script:**
- Cria a tabela `pumps` do zero
- Adiciona a coluna `total_value` na tabela `reports`
- Cria todos os índices necessários
- Configura triggers para atualização automática
- Insere dados de exemplo (opcional)

### 2. Segundo: Atualizar Tabela Existente (Se já existir)
```sql
-- Execute no Supabase SQL Editor:
pump-database-update.sql
```

**Este script:**
- Atualiza uma tabela `pumps` existente
- Adiciona novas colunas
- Modifica constraints
- Configura triggers

## 🔍 Como Verificar se a Tabela Existe

Execute esta query no Supabase SQL Editor para verificar:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'pumps'
) as pumps_table_exists;
```

- **Se retornar `true`**: Use `pump-database-update.sql`
- **Se retornar `false`**: Use `pump-database-create.sql`

## 📋 Estrutura Final da Tabela `pumps`

Após executar os scripts, a tabela terá:

```sql
CREATE TABLE pumps (
  id UUID PRIMARY KEY,
  prefix VARCHAR(50) UNIQUE NOT NULL,           -- Prefixo único (ex: BM-001)
  model VARCHAR(100),                            -- Modelo da bomba
  pump_type VARCHAR(20),                         -- 'Estacionária' ou 'Lança'
  brand VARCHAR(100),                            -- Marca da bomba
  capacity_m3h DECIMAL(10,2),                    -- Capacidade em m³/h
  year INTEGER,                                  -- Ano de fabricação
  status VARCHAR(20) DEFAULT 'Disponível',       -- Status atual
  owner_company_id UUID REFERENCES companies(id), -- Empresa proprietária
  total_billed DECIMAL(12,2) DEFAULT 0.0,         -- Total faturado
  notes TEXT,                                    -- Observações
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 Triggers Automáticos

O sistema inclui triggers que atualizam automaticamente:

1. **`total_billed`** - Atualizado sempre que um relatório for inserido/atualizado/deletado
2. **`updated_at`** - Atualizado sempre que a bomba for modificada

## 🚀 Após Executar os Scripts

1. **Verifique se tudo funcionou:**
   ```sql
   SELECT COUNT(*) FROM pumps;
   ```

2. **Teste a criação de uma bomba:**
   ```sql
   INSERT INTO pumps (prefix, model, pump_type, brand, capacity_m3h, year, status, owner_company_id)
   VALUES ('BM-TEST', 'Modelo Teste', 'Estacionária', 'Teste', 50.0, 2023, 'Disponível', 
           (SELECT id FROM companies LIMIT 1));
   ```

3. **Acesse as páginas do sistema:**
   - `/pumps` - Lista de bombas
   - `/pumps/new` - Criar nova bomba
   - `/pumps/:id` - Detalhes da bomba

## 🛠️ Solução de Problemas

### Erro: "relation pumps does not exist"
**Solução:** Execute primeiro o `pump-database-create.sql`

### Erro: "duplicate key value violates unique constraint"
**Solução:** O prefixo já existe. Use um prefixo diferente.

### Erro: "foreign key constraint fails"
**Solução:** Verifique se existe pelo menos uma empresa na tabela `companies`

## 📝 Dados de Exemplo

O script `pump-database-create.sql` inclui dados de exemplo:

- **BM-001**: Bomba Estacionária Schwing (Disponível)
- **BM-002**: Bomba Lança Putzmeister (Em Uso)  
- **BM-003**: Bomba Estacionária Schwing (Disponível)

## 🔗 Integração com Relatórios

O sistema está preparado para:

1. **Criar relatórios** que referenciam bombas
2. **Atualizar automaticamente** o `total_billed` da bomba
3. **Mostrar histórico** de relatórios por bomba

Para isso, certifique-se de que a tabela `reports` tenha a coluna `total_value`:

```sql
ALTER TABLE reports ADD COLUMN IF NOT EXISTS total_value DECIMAL(12,2) DEFAULT 0.0;
```

## ✅ Checklist de Verificação

- [ ] Tabela `pumps` criada/atualizada
- [ ] Coluna `total_value` adicionada à tabela `reports`
- [ ] Triggers criados e funcionando
- [ ] Índices criados para performance
- [ ] Dados de exemplo inseridos (opcional)
- [ ] Páginas do frontend funcionando
- [ ] Criação de bombas funcionando
- [ ] Listagem de bombas funcionando
- [ ] Detalhes de bombas funcionando
