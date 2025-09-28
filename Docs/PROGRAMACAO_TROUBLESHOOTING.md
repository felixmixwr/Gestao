# 🔧 Troubleshooting - Módulo de Programação

## 🚨 Problema: Erro ao acessar `/programacao/board`

Se você está enfrentando o erro "Ops! Algo deu errado" ao acessar `/programacao/board`, siga estes passos para resolver:

### 📋 **Passo 1: Verificar Conexão com Banco de Dados**

1. Acesse: `/programacao/test`
2. Clique em "Executar Testes"
3. Verifique se todas as tabelas estão funcionando

### 📋 **Passo 2: Executar Scripts SQL**

Se algum teste falhar, execute no Supabase:

```sql
-- Execute este arquivo completo:
scripts/SQL/setup_programacao_module.sql
```

### 📋 **Passo 3: Verificar Dependências**

Certifique-se de que as tabelas existem:
- ✅ `companies` (empresas)
- ✅ `pumps` (bombas) 
- ✅ `colaboradores` (colaboradores)
- ✅ `programacao` (programações)

### 📋 **Passo 4: Testar Funcionalidades**

1. **Acesse o quadro**: `/programacao/board`
2. **Crie uma programação**: Clique em "Nova Programação"
3. **Preencha o formulário** com dados válidos
4. **Salve** e verifique se aparece no quadro

## 🔍 **Diagnóstico de Problemas Comuns**

### ❌ **Erro: "relation 'empresas' does not exist"**
**Solução**: Execute o script `setup_programacao_module.sql`

### ❌ **Erro: "relation 'programacao' does not exist"**
**Solução**: Execute o script `setup_programacao_module.sql`

### ❌ **Erro: "relation 'colaboradores' does not exist"**
**Solução**: Execute o script `setup_programacao_module.sql`

### ❌ **Erro de autenticação**
**Solução**: Verifique se está logado no sistema

### ❌ **Erro de RLS (Row Level Security)**
**Solução**: Verifique se o usuário tem `company_id` definido na tabela `users`

## 🛠️ **Versões Alternativas Implementadas**

Se o quadro principal não funcionar, temos versões alternativas:

1. **Versão Simples**: `/programacao/board` (sem drag & drop)
2. **Versão de Teste**: `/programacao/test` (diagnóstico)
3. **Versão Fixa**: `/programacao/board` (com logs detalhados)

## 📞 **Logs Úteis**

Abra o console do navegador (F12) e verifique:

```javascript
// Logs esperados:
"Buscando programações de 2024-01-15 até 2024-01-22"
"Programações encontradas: []"
"Dados iniciais carregados: {empresasData: [], bombasData: [], colaboradoresData: []}"
```

## 🎯 **Próximos Passos**

1. ✅ Execute o script SQL
2. ✅ Teste a conexão
3. ✅ Crie dados de teste
4. ✅ Acesse o quadro
5. ✅ Teste o cadastro

## 📊 **Dados de Teste Recomendados**

Para testar o módulo, adicione:

### Empresa:
```sql
INSERT INTO companies (id, name) VALUES (gen_random_uuid(), 'Empresa Teste');
```

### Bomba:
```sql
INSERT INTO pumps (id, name, model, status, company_id) 
VALUES (gen_random_uuid(), 'Bomba 001', 'Modelo A', 'active', (SELECT id FROM companies LIMIT 1));
```

### Colaborador:
```sql
INSERT INTO colaboradores (id, nome, cargo, ativo, company_id)
VALUES (gen_random_uuid(), 'João Silva', 'Operador', true, (SELECT id FROM companies LIMIT 1));
```

---

**Status**: ✅ Problemas identificados e soluções implementadas  
**Última atualização**: $(date)




