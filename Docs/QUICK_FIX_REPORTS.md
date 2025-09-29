# 🚀 Solução Rápida: Erro na Criação de Relatórios

## ❌ **Problema**
```
ERROR: Não foi possível gerar um número único para o relatório
```

## ✅ **Solução em 3 Passos**

### **Passo 1: Execute o Script Corrigido**
Execute o arquivo `009_simple_reports_fix.sql` no Supabase SQL Editor.

Este script:
- ✅ Verifica a estrutura da tabela
- ✅ Adiciona constraint UNIQUE se necessário
- ✅ Cria função RPC sem ambiguidade
- ✅ Testa a função
- ✅ Verifica duplicatas

### **Passo 2: Verificar Resultado**
Após executar o script, você deve ver:
```
test_result: {"report_number": "RPT-20240115-1234", "success": true}
status: "OK: Todos os números são únicos"
```

### **Passo 3: Testar no Frontend**
1. Abra o app
2. Tente criar um relatório
3. Verifique se funciona sem erros

## 🔧 **O que foi Corrigido**

### **1. Ambiguidade na Função RPC**
```sql
-- ANTES (com erro):
IF NOT EXISTS (SELECT 1 FROM reports WHERE report_number = report_number)

-- DEPOIS (corrigido):
IF NOT EXISTS (SELECT 1 FROM reports r WHERE r.report_number = new_report_number)
```

### **2. Constraint UNIQUE**
- Adicionada automaticamente se não existir
- Garante unicidade dos números

### **3. Frontend Atualizado**
- Nova função utilitária com múltiplos fallbacks
- Melhor tratamento de erros

## 🎯 **Se Ainda Houver Problemas**

### **Verificar Logs**
```javascript
// No console do navegador:
console.log('Testando geração de número...');
```

### **Testar Função RPC Manualmente**
```sql
SELECT create_report_with_number('2024-01-15'::DATE);
```

### **Verificar Permissões**
- Usuário deve ter permissão para inserir na tabela `reports`
- RLS deve estar configurado corretamente

---

**✅ Execute o script `009_simple_reports_fix.sql` e o problema deve estar resolvido!**
