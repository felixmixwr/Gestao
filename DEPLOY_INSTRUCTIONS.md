# Instruções para Deploy no Vercel

## Arquivos Criados/Modificados para Correção das Rotas

### 1. Arquivos de Configuração
- ✅ `vercel.json` (raiz do projeto)
- ✅ `public/_redirects` 
- ✅ `public/vercel.json`
- ✅ `.vercelignore`

### 2. Conteúdo dos Arquivos

#### `vercel.json` (raiz):
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### `public/_redirects`:
```
/*    /index.html   200
```

#### `public/vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Como Fazer o Deploy

### Opção 1: Via CLI do Vercel
```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Fazer deploy
vercel --prod
```

### Opção 2: Via GitHub (Recomendado)
1. Faça commit das alterações:
```bash
git add .
git commit -m "Fix: Configure Vercel routing for React Router SPA"
git push origin main
```

2. O Vercel fará deploy automático se estiver conectado ao GitHub

### Opção 3: Upload Manual
1. Acesse o dashboard do Vercel
2. Faça upload da pasta `dist` completa
3. Certifique-se de que os arquivos `_redirects` e `vercel.json` estão incluídos

## Verificação Pós-Deploy

Após o deploy, teste estas rotas:
- ✅ `https://gestao-two.vercel.app/` (página inicial)
- ✅ `https://gestao-two.vercel.app/reports/new` (novo relatório)
- ✅ `https://gestao-two.vercel.app/reports` (lista de relatórios)
- ✅ `https://gestao-two.vercel.app/clients/new` (novo cliente)

## Troubleshooting

Se ainda não funcionar:
1. Verifique se o deploy foi feito corretamente
2. Aguarde alguns minutos para propagação
3. Limpe o cache do navegador
4. Verifique os logs do Vercel no dashboard

## Arquivos no Diretório `dist`
Após o build, o diretório `dist` deve conter:
- `index.html`
- `_redirects`
- `vercel.json`
- `assets/` (com CSS e JS)
