# 🚀 Guia de Deploy - WorldRental Felix Mix

## 📋 Pré-requisitos

- ✅ Node.js 18+ instalado
- ✅ Conta no GitHub
- ✅ Conta no Vercel
- ✅ Projeto Supabase configurado
- ✅ Token de acesso do GitHub

## 🔧 Configuração Inicial

### 1. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
cp env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
VITE_SUPABASE_URL=https://rgsovlqsezjeqohlbyod.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2Mzk1ODksImV4cCI6MjA3NDIxNTU4OX0.od07D8mGwg-nYC5-QzzBledOl2FciqxDR5S0Ut8Ah8k
VITE_OWNER_COMPANY_NAME=Felix Mix
VITE_SECOND_COMPANY_NAME=WorldRental
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Testar Localmente

```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 🌐 Deploy no GitHub

### 1. Inicializar Git (se não estiver inicializado)

```bash
git init
git add .
git commit -m "Initial commit: WorldRental Felix Mix project"
```

### 2. Configurar Repositório Remoto

```bash
git remote add origin https://github.com/felixmixwr/Gestao.git
git branch -M main
git push -u origin main
```

### 3. Configurar Token de Acesso

Use o token fornecido:
```
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
```

## 🚀 Deploy no Vercel

### Opção 1: Deploy Automático via GitHub

1. **Conectar Repositório**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com sua conta GitHub
   - Clique em "New Project"
   - Importe o repositório `felixmixwr/Gestao`

2. **Configurar Variáveis de Ambiente**
   - No painel do Vercel, vá em Settings > Environment Variables
   - Adicione as seguintes variáveis:
     ```
     VITE_SUPABASE_URL=https://rgsovlqsezjeqohlbyod.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2Mzk1ODksImV4cCI6MjA3NDIxNTU4OX0.od07D8mGwg-nYC5-QzzBledOl2FciqxDR5S0Ut8Ah8k
     VITE_OWNER_COMPANY_NAME=Felix Mix
     VITE_SECOND_COMPANY_NAME=WorldRental
     ```

3. **Deploy Automático**
   - O Vercel detectará automaticamente que é um projeto Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Deploy será feito automaticamente

### Opção 2: Deploy Manual via CLI

1. **Instalar Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login no Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

## 🔄 CI/CD com GitHub Actions

O projeto já inclui configuração automática de CI/CD:

- **Arquivo**: `.github/workflows/deploy.yml`
- **Trigger**: Push para `main` ou `master`
- **Ações**:
  - Instala dependências
  - Executa linter
  - Faz build do projeto
  - Deploy automático para Vercel

### Configurar Secrets no GitHub

1. Acesse: `https://github.com/felixmixwr/Gestao/settings/secrets/actions`
2. Adicione os seguintes secrets:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_OWNER_COMPANY_NAME
   VITE_SECOND_COMPANY_NAME
   VERCEL_TOKEN
   VERCEL_ORG_ID
   VERCEL_PROJECT_ID
   ```

## 🗄️ Configuração do Banco de Dados

### 1. Executar Migrações

Acesse o painel do Supabase e execute os scripts SQL na ordem:

1. `db/migrations/001_create_invoice_seq_and_table.sql`
2. `db/migrations/002_trigger_set_invoice_number.sql`
3. `db/migrations/003_view_pending_reports.sql`

### 2. Configurar RLS (Row Level Security)

Ative o RLS em todas as tabelas e configure as políticas de segurança.

## 📱 Configuração da Função Backend

### Deploy da Função de Notas Fiscais

```bash
cd functions/notes-generate
npm install
vercel --prod
```

## 🔍 Verificação Pós-Deploy

### 1. Testar Funcionalidades

- [ ] Login/Cadastro funcionando
- [ ] Dashboard carregando KPIs
- [ ] CRUD de clientes funcionando
- [ ] CRUD de bombas funcionando
- [ ] CRUD de relatórios funcionando
- [ ] Geração de notas fiscais funcionando

### 2. Verificar Logs

- Vercel: Dashboard > Functions > Logs
- Supabase: Dashboard > Logs

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de Build**
   - Verifique se todas as dependências estão instaladas
   - Execute `npm run build` localmente para testar

2. **Erro de Variáveis de Ambiente**
   - Verifique se todas as variáveis estão configuradas no Vercel
   - Confirme se os valores estão corretos

3. **Erro de Banco de Dados**
   - Verifique se as migrações foram executadas
   - Confirme se o RLS está configurado corretamente

4. **Erro de Autenticação**
   - Verifique se as credenciais do Supabase estão corretas
   - Confirme se o usuário foi criado no painel do Supabase

## 📞 Suporte

Para problemas ou dúvidas:

1. Verifique os logs do Vercel
2. Consulte a documentação do Supabase
3. Verifique se todas as configurações estão corretas
4. Teste localmente antes do deploy

## 🎉 Deploy Concluído!

Após seguir todos os passos, seu projeto estará disponível em:

- **GitHub**: https://github.com/felixmixwr/Gestao
- **Vercel**: https://seu-projeto.vercel.app
- **Supabase**: Painel de controle configurado

**Status**: ✅ Pronto para produção!
