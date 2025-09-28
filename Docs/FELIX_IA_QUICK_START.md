# Felix IA - Guia de Início Rápido

## 🚀 Configuração em 5 Passos

### 1. Configurar Variáveis de Ambiente

Copie o arquivo `env.felix-ia.example` para `.env.local` e configure:

```bash
cp env.felix-ia.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
# OpenAI (OBRIGATÓRIO)
OPENAI_API_KEY=sua_chave_openai_aqui

# Supabase (OBRIGATÓRIO)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Executar Migração do Banco

No Supabase SQL Editor, execute:

```sql
-- Execute o arquivo: db/migrations/018_create_felix_ia_tables.sql
```

### 3. Instalar Dependências

```bash
npm install openai @radix-ui/react-scroll-area
```

### 4. Testar Configuração

Acesse `/felix-ia/test` e execute todos os testes.

### 5. Usar o Felix IA

Acesse `/felix-ia` e comece a conversar!

## 🎯 Exemplos de Uso

### Consultas Básicas
```
"Mostre os custos da semana"
"Qual o consumo de diesel da bomba FM-001?"
"Gere um relatório de manutenções"
```

### Consultas Avançadas
```
"Compare o desempenho das bombas FM-001 e FM-002 em dezembro"
"Analise os custos de combustível vs volume bombeado"
"Quais bombas precisam de manutenção preventiva?"
```

## 📊 Funcionalidades

- ✅ Chat inteligente com GPT-4
- ✅ Gráficos automáticos (linha, barras, pizza)
- ✅ Consultas em dados reais do Supabase
- ✅ Ações rápidas pré-configuradas
- ✅ Interface responsiva e moderna

## 🔧 Troubleshooting

### Erro: "OpenAI API key não configurada"
- Verifique se `OPENAI_API_KEY` está definida no `.env.local`
- Confirme que a chave é válida

### Erro: "Não há registros..."
- Execute a migração SQL
- Verifique se há dados nas tabelas
- Confirme as políticas RLS do Supabase

### Gráficos não aparecem
- Verifique se Recharts está instalado
- Confirme se os dados estão no formato correto

## 📚 Documentação Completa

Para mais detalhes, consulte: `Docs/FELIX_IA_MODULE_DOCUMENTATION.md`

## 🆘 Suporte

Em caso de problemas:
1. Execute os testes em `/felix-ia/test`
2. Verifique os logs do console
3. Consulte a documentação completa
4. Entre em contato com a equipe de desenvolvimento

---

**Status**: ✅ Pronto para uso  
**Versão**: 1.0.0  
**Última atualização**: Dezembro 2024
