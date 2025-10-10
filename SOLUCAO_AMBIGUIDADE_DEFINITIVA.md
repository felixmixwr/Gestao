# 🔧 Solução Definitiva - Ambiguidade SQL

## 🚨 Problema
```
Error: column reference "report_number" is ambiguous
```

## 🔍 Causa Raiz
A função `create_bombing_report` no Supabase tinha variáveis com nomes **idênticos** às colunas da tabela `reports`, causando ambiguidade no PostgreSQL.

### ❌ Código Problemático:
```sql
DECLARE
  report_number TEXT;  -- ❌ Mesmo nome da coluna
  
IF NOT EXISTS (SELECT 1 FROM reports WHERE report_number = report_number) THEN
  -- ❌ PostgreSQL não sabe se é a variável ou a coluna
END IF;
```

## ✅ Solução Aplicada

### 1. **Renomear TODAS as variáveis com prefixo `v_`**
```sql
DECLARE
  v_report_number TEXT;  -- ✅ Prefixo evita ambiguidade
  v_report_id UUID;
  v_date_str TEXT;
  -- ... todas com v_
```

### 2. **Renomear parâmetro com prefixo `p_`**
```sql
CREATE FUNCTION create_bombing_report(p_report_data JSONB)  -- ✅ p_ para parâmetro
```

### 3. **Usar aliases explícitos em queries**
```sql
SELECT p.owner_company_id 
FROM pumps p  -- ✅ Alias 'p'
WHERE p.id = ...

IF NOT EXISTS (
  SELECT 1 
  FROM reports r  -- ✅ Alias 'r'
  WHERE r.report_number = v_report_number  -- ✅ Prefixo 'v_'
) THEN
```

## 📋 Como Aplicar

### **EXECUTE ESTE SQL NO SUPABASE:**

Arquivo: `EXECUTAR_ESTE_AGORA.sql`

1. **Abra Supabase Dashboard**
2. **SQL Editor** → New Query
3. **Cole o conteúdo completo do arquivo**
4. **Execute (RUN)**
5. **Aguarde confirmação** ✅

### **Após Executar:**

1. **Feche TODAS as abas do navegador** (Ctrl+Shift+T para reabrir)
2. **Abra nova aba:** http://localhost:5173
3. **Teste confirmar bombeamento**
4. **Deve funcionar!** 🎉

## 📊 Arquivos Atualizados

### ✅ Banco de Dados (Supabase):
- `EXECUTAR_ESTE_AGORA.sql` - Script de correção definitiva

### ✅ Código Local:
- `scripts/SQL/reports-rpc-functions.sql` - Atualizado
- `src/lib/programacao-api.ts` - Corrigido campo `bomba_prefixo`

## 🔍 Verificação

Execute no Supabase para confirmar:

```sql
SELECT 
  proname as "Função",
  prosrc LIKE '%v_report_number%' as "Tem v_",
  prosrc LIKE '%p_report_data%' as "Tem p_"
FROM pg_proc 
WHERE proname = 'create_bombing_report';
```

**Resultado esperado:**
| Função | Tem v_ | Tem p_ |
|--------|--------|--------|
| create_bombing_report | true | true |

## 🎯 Resultado Final

- ✅ Ambiguidade eliminada
- ✅ Todas variáveis prefixadas
- ✅ Todos aliases explícitos
- ✅ GRANT aplicado para authenticated e anon
- ✅ Status padrão: ENVIADO_FINANCEIRO

---

**Data da correção:** 2025-10-10  
**Versão:** Final


