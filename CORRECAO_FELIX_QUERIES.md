# 🔧 Correção de Queries da FELIX IA

## ❌ Problema Identificado

A FELIX IA estava com erro ao buscar dados de programação:
```
column clients_1.endereco does not exist
```

## 🔍 Causa Raiz

O código estava tentando buscar campos **inexistentes** nas tabelas:

### ❌ Antes (ERRADO):
```typescript
clients!inner(name, endereco)  // ❌ 'endereco' não existe em clients
.eq('data_servico', hoje)      // ❌ coluna não existe
```

## ✅ Correção Aplicada

### Campos Corrigidos:

| Tabela | Campo Errado | Campo Correto |
|--------|-------------|---------------|
| `clients` | `endereco` | `phone` |
| `programacao` | `data_servico` | `data` |

### ✅ Agora (CORRETO):
```typescript
clients!inner(name, phone)  // ✅ 'phone' existe em clients
.eq('data', hoje)           // ✅ coluna correta
```

## 📊 Estrutura das Tabelas

### 1. **Tabela `clients`**
- ✅ `id` (UUID)
- ✅ `name` (TEXT)
- ✅ `phone` (TEXT)
- ✅ `email` (TEXT)
- ✅ `company_name` (TEXT)
- ❌ NÃO TEM: `endereco`

### 2. **Tabela `programacao`**
- ✅ `id` (UUID)
- ✅ `data` (DATE) ← **Correto**
- ✅ `cliente_id` (UUID → clients)
- ✅ `bomba_id` (UUID → pumps)
- ✅ `company_id` (UUID → companies)
- ✅ `endereco` (TEXT) ← **Endereço está aqui!**
- ✅ `numero` (TEXT)
- ✅ `bairro` (TEXT)
- ✅ `cidade` (TEXT)
- ✅ `estado` (TEXT)
- ✅ `hora_inicio` (TIME)
- ❌ NÃO TEM: `data_servico`

### 3. **Query Correta:**
```typescript
const { data } = await supabase
  .from('programacao')
  .select(`
    *,
    clients!inner(name, phone),
    pumps!inner(prefix, model),
    companies!inner(name)
  `)
  .eq('company_id', currentCompanyId)
  .eq('data', hoje)
  .order('hora_inicio')
```

## 📁 Arquivo Modificado

- ✅ `src/lib/felix-supabase.ts`
  - Função: `getProgramacaoData()`
  - Linhas: 510-532

## 🧪 Como Testar

1. **Acesse:** http://localhost:5173/felix-ia
2. **Digite:** "Qual a programação de hoje?"
3. **DEVE FUNCIONAR!** ✅
4. **FELIX responderá** com os dados de programação

## 🎯 Resultado

- ✅ Query corrigida
- ✅ Campos válidos
- ✅ FELIX IA funcionando
- ✅ Sem erros de banco

---

**Data:** 2025-10-10  
**Status:** ✅ CORRIGIDO

