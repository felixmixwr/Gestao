# Correção do Problema de Carregamento de Nomes de Clientes

## 🔍 **Problema Identificado**

Ao criar uma programação e escolher o cliente, os nomes não estavam carregando corretamente no dropdown. O problema estava relacionado ao campo `name` da tabela `clients` que não estava sendo preenchido adequadamente.

### **Causa Raiz:**
1. A tabela `clients` tem um campo `name` obrigatório (NOT NULL)
2. O formulário de criação de clientes estava salvando apenas `rep_name` e `company_name`
3. A API de programação (`ProgramacaoAPI.getClientes()`) busca o campo `name`
4. Como o campo `name` estava vazio, os clientes não apareciam corretamente no dropdown

## ✅ **Solução Implementada**

### 1. **Correção no Código Frontend**
**Arquivo:** `src/pages/clients/NewClient.tsx`

```javascript
async function doInsert(values: FormValues) {
  // Preparar dados para inserção, garantindo que o campo 'name' seja preenchido
  const insertData = {
    ...values,
    // Garantir que o campo 'name' seja preenchido com company_name ou rep_name
    name: values.company_name || values.rep_name || 'Cliente sem nome'
  }
  
  // ... resto do código
}
```

### 2. **Script SQL para Corrigir Dados Existentes**
**Arquivo:** `scripts/SQL/fix-clients-name-field.sql`

```sql
-- Atualizar o campo 'name' onde está NULL ou vazio
UPDATE clients 
SET name = COALESCE(
    NULLIF(company_name, ''), 
    NULLIF(rep_name, ''), 
    'Cliente ' || SUBSTRING(id::text, 1, 8)
)
WHERE name IS NULL OR name = '';
```

### 3. **Trigger para Prevenção Futura**
**Arquivo:** `scripts/SQL/create-client-name-trigger.sql`

```sql
-- Criar função para preencher automaticamente o campo 'name'
CREATE OR REPLACE FUNCTION fill_client_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.name IS NULL OR NEW.name = '' THEN
        NEW.name = COALESCE(
            NULLIF(NEW.company_name, ''), 
            NULLIF(NEW.rep_name, ''), 
            'Cliente ' || SUBSTRING(NEW.id::text, 1, 8)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER trigger_fill_client_name
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION fill_client_name();
```

## 🚀 **Como Aplicar a Correção**

### **Passo 1: Executar Script SQL**
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Execute o script `fix-clients-name-field.sql`
4. Execute o script `create-client-name-trigger.sql`

### **Passo 2: Deploy do Código**
1. Faça commit das alterações:
```bash
git add src/pages/clients/NewClient.tsx
git commit -m "Fix: Ensure client name field is populated correctly"
git push origin main
```

2. Faça deploy no Vercel

### **Passo 3: Verificação**
1. Acesse a página de criação de programação
2. Teste o dropdown de clientes
3. Verifique se os nomes aparecem corretamente

## 📋 **Estrutura da Tabela Clients**

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- Campo obrigatório que estava vazio
  email TEXT,
  phone TEXT,
  company_id UUID REFERENCES companies(id) NOT NULL,
  rep_name TEXT,                         -- Nome do representante
  company_name TEXT,                     -- Nome da empresa
  -- outros campos...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 **Lógica de Preenchimento do Campo 'name'**

**Prioridade:**
1. `company_name` (se não estiver vazio)
2. `rep_name` (se não estiver vazio)
3. `'Cliente ' + primeiros 8 caracteres do ID` (fallback)

## ✅ **Resultado Esperado**

Após aplicar a correção:
- ✅ Novos clientes terão o campo `name` preenchido automaticamente
- ✅ Clientes existentes terão o campo `name` corrigido
- ✅ Dropdown de clientes na programação funcionará corretamente
- ✅ Nomes dos clientes aparecerão adequadamente

## 🐛 **Prevenção de Problemas Similares**

1. **Trigger automático** garante que futuros clientes sempre tenham `name` preenchido
2. **Validação no frontend** garante que o campo seja preenchido antes do envio
3. **Logs detalhados** ajudam a identificar problemas similares no futuro

## 📊 **Monitoramento**

Para verificar se a correção funcionou:

```sql
-- Verificar se todos os clientes têm o campo 'name' preenchido
SELECT 
    COUNT(*) as total_clients,
    COUNT(name) as clients_with_name,
    COUNT(*) - COUNT(name) as clients_without_name
FROM clients;

-- Deve retornar: clients_without_name = 0
```
