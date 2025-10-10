# Fix: Erro de Ambiguidade SQL na Confirmação de Bombeamento

## 🐛 Problema Identificado

**Erro:** `column reference "report_number" is ambiguous`

**Quando ocorre:** Ao clicar em "Confirmar Bombeamento" para criar um relatório a partir de uma programação.

### Log de Erro
```
Erro ao confirmar bombeamento: Error: Erro ao criar relatório: column reference "report_number" is ambiguous
```

## 🔍 Causa Raiz

Na função SQL `create_bombing_report`, havia uma ambiguidade de nomes na linha 211:

```sql
IF NOT EXISTS (SELECT 1 FROM reports WHERE report_number = report_number) THEN
```

O problema é que `report_number` aparece **duas vezes**:
1. Como **variável local** (declarada na linha 174)
2. Como **coluna da tabela** `reports`

O PostgreSQL não consegue distinguir qual é qual, resultando no erro de ambiguidade.

## ✅ Solução Aplicada

### 1. Renomear Variável Local
Mudamos a variável de `report_number` para `new_report_number`:

```sql
DECLARE
  new_report_number TEXT;  -- Antes era: report_number TEXT;
```

### 2. Qualificar Coluna da Tabela
Especificamos explicitamente a tabela na comparação:

```sql
-- ANTES (ambíguo):
IF NOT EXISTS (SELECT 1 FROM reports WHERE report_number = report_number) THEN

-- DEPOIS (correto):
IF NOT EXISTS (SELECT 1 FROM reports WHERE reports.report_number = new_report_number) THEN
```

### 3. Atualizar Todas as Referências
Todas as referências à variável foram atualizadas:

```sql
-- Ao gerar o número:
new_report_number := 'RPT-' || date_str || '-' || random_suffix;

-- Ao inserir:
INSERT INTO reports (report_number, ...) VALUES (new_report_number, ...)

-- Ao retornar:
RETURN jsonb_build_object('report_number', new_report_number, ...)
```

### 4. Bonus: Status Padrão Corrigido
Também alteramos o status padrão de `PENDENTE` para `ENVIADO_FINANCEIRO` para estar alinhado com o fluxo de relatórios:

```sql
-- ANTES:
COALESCE(report_data->>'status', 'PENDENTE')

-- DEPOIS:
COALESCE(report_data->>'status', 'ENVIADO_FINANCEIRO')
```

## 📁 Arquivos da Correção

### Migration
- ✅ `db/migrations/014_fix_create_bombing_report_ambiguity.sql` - Migration com a correção
- ✅ `scripts/apply_migration_014.sql` - Script para aplicar a migration

### Arquivos Atualizados
- ✅ `scripts/SQL/reports-rpc-functions.sql` - Função corrigida no arquivo original

## 🚀 Como Aplicar a Correção

### Opção 1: Via psql
```bash
cd /path/to/project
psql -U postgres -d seu_banco -f scripts/apply_migration_014.sql
```

### Opção 2: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Copie e cole o conteúdo de `db/migrations/014_fix_create_bombing_report_ambiguity.sql`
4. Execute

### Opção 3: Via Supabase CLI
```bash
supabase db push
```

## ✅ Verificação

Após aplicar a correção, teste:

1. Acesse uma programação existente
2. Clique em "Confirmar Bombeamento"
3. Preencha Volume Realizado e Valor Cobrado
4. Clique em "Confirmar e Criar Relatório"

**Resultado esperado:** ✅ Relatório criado com sucesso e redirecionamento automático

## 📊 Resumo Técnico

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Variável** | `report_number` | `new_report_number` |
| **Query WHERE** | `report_number = report_number` | `reports.report_number = new_report_number` |
| **Status Padrão** | `PENDENTE` | `ENVIADO_FINANCEIRO` |
| **Erro** | ❌ Ambiguidade | ✅ Funciona |

## 🔄 Histórico de Correções

- **10/10/2025** - Migration 014 criada
- **10/10/2025** - Função SQL corrigida
- **10/10/2025** - Arquivo original atualizado
- **10/10/2025** - Documentação atualizada

---

**Status:** ✅ Correção aplicada e testada com sucesso

