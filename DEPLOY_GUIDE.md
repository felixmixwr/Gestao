# 🚀 Guia de Deploy para Produção - Sistema de Notificações Push

## ✅ Status Atual
- ✅ Código commitado e enviado para o repositório
- ✅ Service Worker configurado
- ✅ VAPID Keys geradas
- ✅ Edge Function preparada
- ⏳ Deploy da Edge Function (próximo passo)
- ⏳ Configuração das variáveis de ambiente

## 🔑 Chaves VAPID Geradas

**Public Key (Frontend):**
```
BBNAVQi46g1rgjQ2nF9kkDt--WPXzFFVIhQm5D9UvAGlAfO1sCORVCnd6MFpEABZvy0PuyECaXL-WxAzuILcnpA
```

**Private Key (Backend):**
```
8LhjtU2IyxkOYINbsU1mxahcBWKPy90dEaBz1Tucz98
```

## 📋 Passo a Passo para Deploy

### 1. Deploy da Edge Function no Supabase

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard/project/rgsovlqsezjeqohlbyod
   - Faça login na sua conta

2. **Navegue para Edge Functions:**
   - No menu lateral, clique em "Edge Functions"
   - Clique em "Create a new function"

3. **Configure a função:**
   - **Nome:** `send-notification`
   - **Cole o código** do arquivo: `supabase/functions/send-notification/index.ts`
   - Clique em "Deploy"

### 2. Configurar Variáveis de Ambiente

1. **No Supabase Dashboard:**
   - Vá para "Settings" → "API" → "Edge Functions"
   - Na seção "Environment Variables", adicione:

```
VAPID_PUBLIC_KEY=BBNAVQi46g1rgjQ2nF9kkDt--WPXzFFVIhQm5D9UvAGlAfO1sCORVCnd6MFpEABZvy0PuyECaXL-WxAzuILcnpA
VAPID_PRIVATE_KEY=8LhjtU2IyxkOYINbsU1mxahcBWKPy90dEaBz1Tucz98
```

### 3. Testar o Sistema

1. **Acesse seu app em produção**
2. **Ative as notificações** no navegador quando solicitado
3. **Use o painel de teste** para enviar uma notificação
4. **Verifique os logs** na tabela `notification_logs`

## 🔧 Código da Edge Function

O código completo está em: `supabase/functions/send-notification/index.ts`

**Funcionalidades:**
- ✅ Recebe requisições de notificação
- ✅ Busca tokens de push dos usuários
- ✅ Envia notificações para dispositivos
- ✅ Registra logs de notificações
- ✅ Tratamento de erros completo

## 📱 Como Usar o Sistema

### Para Usuários:
1. O sistema solicita permissão automaticamente
2. Tokens são salvos automaticamente
3. Notificações aparecem mesmo com app fechado

### Para Desenvolvedores:
```typescript
import { notificationService } from '../services/notificationService'

// Enviar para usuário específico
await notificationService.sendPushNotification({
  userId: 'user-id',
  title: 'Nova Manutenção',
  body: 'Uma nova manutenção foi agendada'
})

// Enviar para todos os usuários
await notificationService.sendNotificationToAllUsers(
  'Lembrete',
  'Não esqueça de verificar suas bombas hoje!'
)
```

## 🗄️ Estrutura do Banco

### Tabelas Criadas:
- ✅ `notification_logs` - Registra todas as notificações
- ✅ `user_push_tokens` - Armazena tokens dos usuários

### Políticas RLS:
- ✅ Usuários só veem seus próprios dados
- ✅ Service role tem acesso completo

## 🎯 Checklist Final

- [ ] Edge Function deployada no Supabase
- [ ] Variáveis VAPID configuradas
- [ ] Teste de notificação funcionando
- [ ] Logs sendo registrados na tabela
- [ ] Notificações aparecendo em dispositivos

## 🆘 Troubleshooting

### Problemas Comuns:

1. **"No active push tokens found"**
   - Verifique se o usuário ativou as notificações
   - Confirme se o token foi salvo na tabela `user_push_tokens`

2. **"Permission denied"**
   - Verifique as políticas RLS
   - Confirme se o usuário está autenticado

3. **"Edge Function not found"**
   - Verifique se a função foi deployada
   - Confirme o nome da função: `send-notification`

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs da Edge Function no Supabase Dashboard
2. Consulte a tabela `notification_logs` para ver tentativas de envio
3. Teste com o painel de teste integrado no app

---

**🎉 Após completar estes passos, seu sistema de notificações push estará funcionando em produção!**
