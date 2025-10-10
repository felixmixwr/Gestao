# 👤 FELIX IA - Personalização por Usuário

## ✅ Tabela já existe!

A tabela `felix_chat_history` já foi criada na **migration 012** com a seguinte estrutura:

```sql
CREATE TABLE felix_chat_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  company_id TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📊 Estrutura das Mensagens (JSONB)

Cada usuário tem **UM registro** na tabela, e as mensagens são armazenadas em array JSON:

```json
{
  "messages": [
    {
      "id": "uuid",
      "type": "user",
      "content": "Olá FELIX!",
      "timestamp": "2025-10-10T10:00:00Z"
    },
    {
      "id": "uuid",
      "type": "assistant",
      "content": "Olá [Nome do Usuário]! Como posso ajudar?",
      "timestamp": "2025-10-10T10:00:01Z"
    }
  ]
}
```

## 🔒 Segurança (RLS)

✅ **Row Level Security habilitado**
- Cada usuário **só vê** suas próprias mensagens
- Isolamento total entre usuários

## 🎯 Implementação

### 1. **Buscar histórico do usuário**
```typescript
const { data: chatHistory } = await supabase
  .from('felix_chat_history')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

### 2. **Salvar nova mensagem**
```typescript
const updatedMessages = [...existingMessages, newMessage];

await supabase
  .from('felix_chat_history')
  .upsert({
    user_id: user.id,
    company_id: userCompanyId,
    messages: updatedMessages
  });
```

### 3. **Personalização com nome do usuário**
- Buscar nome do usuário no JWT ou tabela `users`
- Passar nome no contexto para a FELIX IA
- FELIX responde usando o nome do usuário

## 🚀 Próximos Passos

1. ✅ Adaptar `felix-ia.tsx` para usar a tabela existente
2. ✅ Carregar histórico ao iniciar
3. ✅ Salvar mensagens no Supabase
4. ✅ Passar nome do usuário no contexto
5. ✅ FELIX reconhece e usa o nome do usuário

---

**Vou implementar agora!** 🔧


