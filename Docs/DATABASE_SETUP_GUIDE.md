# 🗄️ Guia de Configuração do Banco de Dados

## 📋 **Status Atual**

✅ **Página de Cadastro Criada** - `/signup`  
✅ **Sistema de Autenticação Atualizado** - Com função de cadastro  
✅ **Página de Teste** - `/test` com configuração automática  
⏳ **Banco de Dados** - Precisa ser configurado no Supabase  

## 🚀 **Como Configurar o Banco**

### **Opção 1: Configuração Automática (Recomendada)**

1. **Acesse a página de teste**: `http://localhost:3000/test`
2. **Clique em "Configurar Banco"** - Isso criará a empresa padrão
3. **Clique em "Ver Instruções"** - Para ver o SQL no console
4. **Execute o SQL** no painel do Supabase conforme as instruções

### **Opção 2: Configuração Manual Completa**

1. **Acesse o painel do Supabase**: https://supabase.com/dashboard
2. **Vá para seu projeto**: `rgsovlqsezjeqohlbyod`
3. **Acesse SQL Editor** (ícone de banco de dados no menu lateral)
4. **Execute o arquivo completo**: `database-setup.sql`

## 📝 **SQL Básico para Início Rápido**

Se quiser começar rapidamente, execute apenas este SQL:

```sql
-- Criar tabela companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir empresa padrão
INSERT INTO companies (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Felix Mix')
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Política básica para companies
CREATE POLICY "Companies are viewable by everyone" ON companies
  FOR SELECT USING (true);
```

## 🎯 **Funcionalidades Disponíveis**

### **Página de Cadastro** (`/signup`)
- ✅ Formulário completo com validação
- ✅ Campos: Nome, Email, Senha, Confirmar Senha, Nome da Empresa
- ✅ Validação com Zod
- ✅ Integração com Supabase Auth
- ✅ Redirecionamento automático após cadastro

### **Sistema de Autenticação**
- ✅ Login (`/login`)
- ✅ Cadastro (`/signup`)
- ✅ Logout
- ✅ Proteção de rotas
- ✅ Context global de autenticação

### **Página de Teste** (`/test`)
- ✅ Teste de conexão com Supabase
- ✅ Configuração automática básica
- ✅ Instruções de setup
- ✅ Verificação de variáveis de ambiente

## 🔧 **Próximos Passos**

1. **Configure o banco** usando uma das opções acima
2. **Teste o cadastro** em `/signup`
3. **Faça login** em `/login`
4. **Navegue pelas páginas** para testar o sistema

## 🐛 **Resolução de Problemas**

### **Erro: "relation does not exist"**
- Execute o SQL de criação das tabelas
- Verifique se está no projeto correto do Supabase

### **Erro: "permission denied"**
- Verifique as políticas RLS
- Execute as políticas de permissão do `database-setup.sql`

### **Erro: "invalid JWT"**
- Verifique se a chave anônima está correta no `.env`
- Confirme se está usando o projeto correto

## 📊 **Estrutura do Banco**

```
companies (empresas)
├── id (UUID)
├── name (TEXT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

users (usuários - será criada pelo Supabase Auth)
├── id (UUID)
├── email (TEXT)
├── full_name (TEXT)
├── company_id (UUID)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

clients (clientes)
├── id (UUID)
├── name (TEXT)
├── email (TEXT)
├── phone (TEXT)
├── company_id (UUID)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

pumps (bombas)
├── id (UUID)
├── name (TEXT)
├── model (TEXT)
├── serial_number (TEXT)
├── status (active/inactive/maintenance)
├── company_id (UUID)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

reports (relatórios)
├── id (UUID)
├── report_number (TEXT)
├── client_id (UUID)
├── pump_id (UUID)
├── company_id (UUID)
├── start_date (TIMESTAMPTZ)
├── end_date (TIMESTAMPTZ)
├── total_hours (INTEGER)
├── notes (TEXT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

notes (notas)
├── id (UUID)
├── title (TEXT)
├── content (TEXT)
├── company_id (UUID)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

## ✅ **Checklist de Configuração**

- [ ] Executar SQL de criação das tabelas
- [ ] Testar conexão na página `/test`
- [ ] Testar cadastro na página `/signup`
- [ ] Testar login na página `/login`
- [ ] Verificar se as rotas protegidas funcionam
- [ ] Testar sistema de toast notifications

## 🎉 **Pronto para Usar!**

Após configurar o banco, o sistema estará 100% funcional com:
- ✅ Cadastro de usuários
- ✅ Login/logout
- ✅ Proteção de rotas
- ✅ Sistema de notificações
- ✅ Estrutura completa para desenvolvimento

**Acesse agora**: `http://localhost:3000/signup` para começar! 🚀


