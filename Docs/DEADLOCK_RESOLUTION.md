# Resolução de Deadlock - Sistema de Auditoria

## Problema Identificado

O erro "deadlock detected" ocorreu ao tentar aplicar a migration `009_add_missing_audit_triggers.sql`. Este é um problema comum quando múltiplas transações tentam acessar os mesmos recursos do banco de dados simultaneamente.

## Solução Implementada

### 1. Migration Segura

Criei uma versão segura da migration: `009_add_missing_audit_triggers_safe.sql`

**Características da versão segura:**
- ✅ Verifica existência das tabelas antes de criar triggers
- ✅ Usa transações menores para evitar deadlocks
- ✅ Tratamento de erros robusto
- ✅ Logs informativos para debug
- ✅ Usa `COALESCE` para tabelas que podem não existir

### 2. Como Aplicar a Correção

#### Opção 1: Usar a Migration Segura (Recomendado)

1. **Acesse o Supabase Dashboard**
2. **Vá para SQL Editor**
3. **Execute a migration segura:**
   ```sql
   -- Copie e cole o conteúdo de: db/migrations/009_add_missing_audit_triggers_safe.sql
   ```

#### Opção 2: Aplicar Triggers Individualmente

Se o deadlock persistir, aplique os triggers um por vez:

```sql
-- 1. Verificar se a tabela existe
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';

-- 2. Criar trigger individualmente
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Repita para cada tabela: pumps, notes, colaboradores_dependentes, etc.
```

### 3. Verificação Pós-Aplicação

Após aplicar a migration, verifique se os triggers foram criados:

```sql
-- Verificar triggers criados
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE 'audit_%'
ORDER BY event_object_table;
```

### 4. Teste do Sistema

1. **Acesse `/admin` → "Auditoria"**
2. **Verifique se as estatísticas aparecem**
3. **Faça uma alteração em qualquer tabela**
4. **Confirme se o log aparece na auditoria**

## Tabelas que Serão Monitoradas

Após aplicar a migration, estas tabelas terão triggers de auditoria:

### Tabelas Principais
- ✅ `clients` - Clientes
- ✅ `companies` - Empresas  
- ✅ `bombas` - Bombas
- ✅ `pumps` - Bombas (Pumps)
- ✅ `reports` - Relatórios
- ✅ `notas_fiscais` - Notas Fiscais
- ✅ `notes` - Notas
- ✅ `colaboradores` - Colaboradores
- ✅ `programacao` - Programação

### Tabelas Relacionadas
- ✅ `colaboradores_dependentes` - Dependentes
- ✅ `colaboradores_documentos` - Documentos
- ✅ `colaboradores_horas_extras` - Horas Extras
- ✅ `empresas_terceiras` - Empresas Terceiras
- ✅ `pagamentos_receber` - Pagamentos a Receber
- ✅ `bombas_terceiras` - Bombas Terceiras
- ✅ `invoices` - Faturas
- ✅ `users` - Usuários

### Tabelas Administrativas
- ✅ `admin_users` - Usuários Admin
- ✅ `banned_users` - Usuários Banidos

## Prevenção de Deadlocks Futuros

### Boas Práticas
1. **Use transações menores** quando possível
2. **Verifique existência** de objetos antes de modificá-los
3. **Aplique mudanças em lotes pequenos**
4. **Use `IF EXISTS`** para operações de DROP
5. **Monitore logs** do banco para identificar problemas

### Comandos Úteis para Debug
```sql
-- Ver transações ativas
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Ver locks ativos
SELECT * FROM pg_locks WHERE NOT granted;

-- Ver deadlocks nos logs
-- (Verificar logs do Supabase Dashboard)
```

## Status Atual

- ✅ Migration segura criada
- ✅ Sistema de auditoria implementado
- ✅ Interface administrativa funcionando
- ⏳ Aguardando aplicação da migration no Supabase

## Próximos Passos

1. **Aplicar a migration segura** no Supabase
2. **Verificar se os triggers foram criados**
3. **Testar o sistema de auditoria**
4. **Confirmar que todas as alterações são registradas**

O sistema de auditoria está pronto para uso assim que a migration for aplicada com sucesso.
