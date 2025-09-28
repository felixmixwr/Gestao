# Configuração do Deploy no Vercel via GitHub Actions

## Problema
O GitHub Actions está falhando porque os secrets do Vercel não estão configurados no repositório.

## Solução

### 1. Obter as credenciais do Vercel

#### A. Vercel Token
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** → **Tokens**
3. Clique em **Create Token**
4. Dê um nome (ex: "GitHub Actions Deploy")
5. Copie o token gerado

#### B. Vercel Org ID
1. No Vercel Dashboard, vá em **Settings** → **General**
2. Na seção **Organization ID**, copie o ID

#### C. Vercel Project ID
1. Vá para o projeto no Vercel Dashboard
2. Na aba **Settings** → **General**
3. Na seção **Project ID**, copie o ID

### 2. Configurar os Secrets no GitHub

1. Acesse seu repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione os seguintes secrets:

```
VERCEL_TOKEN = [token_do_vercel]
VERCEL_ORG_ID = [organization_id]
VERCEL_PROJECT_ID = [project_id]
```

### 3. Secrets já existentes (verificar se estão configurados)

```
VITE_SUPABASE_URL = [sua_url_do_supabase]
VITE_SUPABASE_ANON_KEY = [sua_chave_anonima_do_supabase]
VITE_OWNER_COMPANY_NAME = [nome_da_empresa_principal]
VITE_SECOND_COMPANY_NAME = [nome_da_segunda_empresa]
```

### 4. Verificar se o projeto está conectado ao Vercel

1. No Vercel Dashboard, verifique se o projeto está conectado ao repositório GitHub
2. Se não estiver, conecte o repositório no Vercel

### 5. Testar o deploy

Após configurar os secrets, faça um novo push para triggerar o GitHub Actions:

```bash
git commit --allow-empty -m "test: trigger deploy after configuring Vercel secrets"
git push origin main
```

## Troubleshooting

### Erro: "Input required and not supplied: vercel-token"
- Verifique se o secret `VERCEL_TOKEN` está configurado no GitHub
- Certifique-se de que o nome do secret está exatamente como `VERCEL_TOKEN`

### Erro: "fatal: not a git repository"
- **RESOLVIDO**: Adicionado checkout do código no job de deploy
- O workflow agora faz checkout do repositório antes do deploy
- Desabilitado github-comment e github-deployment para evitar conflitos

### Erro: "Organization not found"
- Verifique se o `VERCEL_ORG_ID` está correto
- Certifique-se de que o token tem permissões para a organização

### Erro: "Project not found"
- Verifique se o `VERCEL_PROJECT_ID` está correto
- Certifique-se de que o projeto existe no Vercel

## Estrutura do Workflow

O arquivo `.github/workflows/deploy.yml` está configurado para:

1. **Build**: Instalar dependências, rodar linting e build
2. **Deploy**: Fazer deploy para Vercel usando os secrets configurados

```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    working-directory: ./
```

## Próximos passos

1. Configure os secrets no GitHub
2. Faça um push para testar
3. Monitore o GitHub Actions para verificar se o deploy foi bem-sucedido
