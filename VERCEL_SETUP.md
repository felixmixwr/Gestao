# 🚀 CONFIGURAÇÃO PARA VERCEL - WorldRental Felix Mix

## 📋 Variáveis de Ambiente para Vercel

Configure as seguintes variáveis de ambiente no painel da Vercel:

### 🔧 Variáveis Obrigatórias:

```
VITE_SUPABASE_URL=https://rgsovlqsezjeqohlbyod.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2Mzk1ODksImV4cCI6MjA3NDIxNTU4OX0.od07D8mGwg-nYC5-QzzBledOl2FciqxDR5S0Ut8Ah8k
VITE_OWNER_COMPANY_NAME=Felix Mix
VITE_SECOND_COMPANY_NAME=WorldRental
```

### 🔧 Variáveis Opcionais:

```
VITE_API_BASE_URL=https://your-backend-url.vercel.app
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
```

## 📝 Como Configurar na Vercel:

### 1. Acesse o Painel da Vercel
- Vá para [vercel.com](https://vercel.com)
- Faça login com sua conta GitHub

### 2. Importe o Projeto
- Clique em "New Project"
- Selecione o repositório `felixmixwr/Gestao`
- Clique em "Import"

### 3. Configure as Variáveis de Ambiente
- No painel do projeto, vá em "Settings"
- Clique em "Environment Variables"
- Adicione cada variável uma por uma:

**Variável 1:**
- Name: `VITE_SUPABASE_URL`
- Value: `https://rgsovlqsezjeqohlbyod.supabase.co`
- Environment: `Production`, `Preview`, `Development`

**Variável 2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2Mzk1ODksImV4cCI6MjA3NDIxNTU4OX0.od07D8mGwg-nYC5-QzzBledOl2FciqxDR5S0Ut8Ah8k`
- Environment: `Production`, `Preview`, `Development`

**Variável 3:**
- Name: `VITE_OWNER_COMPANY_NAME`
- Value: `Felix Mix`
- Environment: `Production`, `Preview`, `Development`

**Variável 4:**
- Name: `VITE_SECOND_COMPANY_NAME`
- Value: `WorldRental`
- Environment: `Production`, `Preview`, `Development`

### 4. Deploy
- Após configurar as variáveis, clique em "Deploy"
- O Vercel detectará automaticamente que é um projeto Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## 🔍 Verificação Pós-Deploy:

### 1. Teste as Funcionalidades
- [ ] Login/Cadastro funcionando
- [ ] Dashboard carregando KPIs
- [ ] CRUD de clientes funcionando
- [ ] CRUD de bombas funcionando
- [ ] CRUD de relatórios funcionando
- [ ] Geração de notas fiscais funcionando

### 2. Verificar Logs
- Vercel Dashboard > Functions > Logs
- Supabase Dashboard > Logs

## 🚨 Troubleshooting:

### Problemas Comuns:

1. **Erro de Build**
   - Verifique se todas as variáveis estão configuradas
   - Confirme se os valores estão corretos

2. **Erro de Banco de Dados**
   - Verifique se as migrações foram executadas no Supabase
   - Confirme se o RLS está configurado corretamente

3. **Erro de Autenticação**
   - Verifique se as credenciais do Supabase estão corretas
   - Confirme se o usuário foi criado no painel do Supabase

## 📱 Configuração da Função Backend:

### Deploy da Função de Notas Fiscais
```bash
cd functions/notes-generate
npm install
vercel --prod
```

## 🎉 Deploy Concluído!

Após seguir todos os passos, seu projeto estará disponível em:
- **GitHub**: https://github.com/felixmixwr/Gestao
- **Vercel**: https://seu-projeto.vercel.app
- **Supabase**: Painel de controle configurado

**Status**: ✅ Pronto para produção!
