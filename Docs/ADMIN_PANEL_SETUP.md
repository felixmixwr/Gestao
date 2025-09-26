# Painel Administrativo - Guia de Configuração

## Visão Geral

O painel administrativo foi criado para permitir que o usuário `tavaresambroziovinicius@gmail.com` gerencie o sistema, banir usuários e visualizar todos os logs de auditoria.

## Funcionalidades Implementadas

### 1. Sistema de Permissões
- **Super Admin**: Acesso total ao sistema
- **Admin**: Gerenciamento de usuários e logs
- **Moderator**: Visualização de logs (futuro)

### 2. Funcionalidades Principais
- ✅ **Dashboard Administrativo**: Estatísticas do sistema
- ✅ **Gerenciamento de Usuários**: Visualizar, banir usuários
- ✅ **Logs de Auditoria**: Visualizar todas as atividades
- ✅ **Sistema de Banimento**: Banir usuários com motivo e data de expiração
- ✅ **Proteção de Rotas**: Apenas admins podem acessar

## Configuração Inicial

### 1. Executar Migration do Banco de Dados

Execute o arquivo SQL no Supabase:

```sql
-- Execute o arquivo: db/migrations/006_create_admin_system.sql
```

### 2. Configurar Super Admin

Após executar a migration, configure o super admin:

#### Opção A: Via Console do Navegador
1. Faça login com `tavaresambroziovinicius@gmail.com`
2. Abra o console do navegador (F12)
3. Execute:
```javascript
setupAdmin()
```

#### Opção B: Via Código
```typescript
import { AdminSetup } from './src/lib/admin-setup'

const result = await AdminSetup.setupSuperAdmin()
console.log(result)
```

### 3. Acessar o Painel

Após a configuração, acesse:
- **URL**: `https://seudominio.com/admin`
- **Login**: Use `tavaresambroziovinicius@gmail.com`

## Estrutura do Sistema

### Tabelas Criadas

1. **admin_users**: Permissões de administradores
2. **banned_users**: Usuários banidos
3. **audit_logs**: Logs de auditoria completos

### Funções do Banco

- `is_admin(user_id)`: Verifica se usuário é admin
- `is_user_banned(user_id)`: Verifica se usuário está banido
- `ban_user(user_id, reason, banned_by, expires_at)`: Bane usuário
- `unban_user(user_id, unbanned_by)`: Remove ban
- `log_audit_event(...)`: Registra evento de auditoria

### Componentes Frontend

- `AdminPanel.tsx`: Componente principal
- `AdminDashboard.tsx`: Dashboard com estatísticas
- `AdminUsers.tsx`: Gerenciamento de usuários
- `AdminLogs.tsx`: Visualização de logs
- `AdminAPI.ts`: API para operações administrativas

## Como Usar

### 1. Dashboard
- Visualize estatísticas do sistema
- Acesse funcionalidades principais
- Monitore atividade recente

### 2. Gerenciar Usuários
- Visualize todos os usuários
- Veja status (ativo, admin, banido)
- Bana usuários com motivo
- Configure data de expiração do ban

### 3. Logs de Auditoria
- Filtre por ação, tipo de recurso, data
- Visualize detalhes completos
- Monitore todas as atividades do sistema

## Segurança

### 1. Proteção de Rotas
- Rota `/admin` protegida por `RequireAuth`
- Verificação adicional de permissões admin
- Redirecionamento para página de erro se não autorizado

### 2. Row Level Security (RLS)
- Políticas RLS configuradas no Supabase
- Apenas admins podem acessar dados administrativos
- Logs de auditoria protegidos

### 3. Validações
- Verificação de permissões em todas as operações
- Logs automáticos de ações administrativas
- Validação de dados de entrada

## Logs de Auditoria

### Tipos de Ações Registradas
- `CREATE`: Criação de recursos
- `UPDATE`: Atualização de recursos
- `DELETE`: Exclusão de recursos
- `LOGIN`: Login de usuários
- `LOGOUT`: Logout de usuários
- `BAN_USER`: Banimento de usuários
- `UNBAN_USER`: Remoção de ban
- `CREATE_ADMIN`: Criação de administradores

### Informações Capturadas
- Usuário que executou a ação
- Tipo de ação e recurso
- Valores antigos e novos
- Timestamp da ação
- Metadados adicionais

## Troubleshooting

### Erro: "Acesso negado"
- Verifique se o usuário está logado
- Confirme se o usuário tem permissões de admin
- Execute `AdminSetup.setupSuperAdmin()` se necessário

### Erro: "Tabela não encontrada"
- Execute a migration `006_create_admin_system.sql`
- Verifique se as tabelas foram criadas no Supabase

### Erro: "Função não encontrada"
- Confirme se as funções SQL foram criadas
- Verifique permissões no banco de dados

### Logs não aparecem
- Verifique se a função `log_audit_event` está funcionando
- Confirme se as políticas RLS estão corretas

## Desenvolvimento Futuro

### Funcionalidades Planejadas
- [ ] Gerenciamento de roles e permissões
- [ ] Notificações em tempo real
- [ ] Exportação de logs
- [ ] Dashboard com gráficos
- [ ] Sistema de backup
- [ ] Configurações do sistema

### Melhorias de Segurança
- [ ] Autenticação de dois fatores para admins
- [ ] Logs de tentativas de acesso
- [ ] Rate limiting para operações admin
- [ ] Criptografia de dados sensíveis

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs de auditoria
2. Consulte este documento
3. Execute verificações de setup
4. Entre em contato com o desenvolvedor

## Comandos Úteis

### Verificar Setup
```javascript
AdminSetup.checkAdminSetup()
```

### Listar Admins
```javascript
AdminSetup.listAdmins()
```

### Configurar Admin
```javascript
setupAdmin()
```

### Verificar Permissões
```javascript
AdminAPI.isAdmin()
AdminAPI.isSuperAdmin()
```
