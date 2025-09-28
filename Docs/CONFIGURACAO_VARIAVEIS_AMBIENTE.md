# 🔧 Configuração das Variáveis de Ambiente

## Problema Identificado
O servidor Node.js não consegue acessar as variáveis de ambiente do frontend (VITE_*), causando erro "Missing credentials" na OpenAI.

## Solução

### 1. Criar arquivo `.env.local` na raiz do projeto:

```bash
# Configuração da OpenAI (para Felix IA)
VITE_OPENAI_API_KEY=sua_chave_openai_aqui


# Configuração do Supabase (já configurado)
VITE_SUPABASE_URL=https://rgsovlqsezjeqohlbyod.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2Mzk1ODksImV4cCI6MjA3NDIxNTU4OX0.od07D8mGwg-nYC5-QzzBledOl2FciqxDR5S0Ut8Ah8k

# Configurações das empresas
VITE_OWNER_COMPANY_NAME=Felix Mix
VITE_SECOND_COMPANY_NAME=WorldRental
```

### 2. Obter sua chave da OpenAI:
1. Acesse: https://platform.openai.com/api-keys
2. Crie uma nova chave de API
3. Substitua `sua_chave_openai_aqui` pela sua chave real

### 3. Executar o projeto:

```bash
# Opção 1: Executar tudo junto (recomendado)
npm run dev:full

# Opção 2: Executar separadamente
# Terminal 1:
npm run dev:api

# Terminal 2:
npm run dev
```

## Testando

1. Execute `npm run dev:full`
2. Acesse `http://localhost:3000/felix-ia/test`
3. Execute os testes novamente

**Resultados esperados:**
- ✅ "Verificar OpenAI API Key" - deve passar
- ✅ "Testar endpoint /api/felix-ia" - deve passar
- ✅ "Testar função getPumpExpenses" - deve passar

## Logs Esperados

**Servidor de API:**
```
🚀 Servidor de API rodando em http://localhost:3001
📡 Endpoint Felix IA: http://localhost:3001/api/felix-ia
```

**Frontend:**
```
VITE v7.1.7  ready in 1234 ms
➜  Local:   http://localhost:3000/
```

## Arquivos Modificados

- ✅ `server.js` - Adicionado dotenv para carregar variáveis
- ✅ `api/felix-ia.js` - Criado versão JavaScript compatível
- ✅ `api/felix-ia.js` - Suporte a variáveis VITE_ e padrão
- ✅ `package.json` - Scripts para desenvolvimento

## Próximos Passos

1. Configure sua chave da OpenAI no `.env.local`
2. Execute `npm run dev:full`
3. Teste o módulo Felix IA
4. Se tudo funcionar, faça deploy para produção
