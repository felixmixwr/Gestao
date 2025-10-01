# 🚀 INSTRUÇÕES PARA REGISTRAR NOTIFICAÇÕES PUSH

## 📋 PROBLEMA IDENTIFICADO

O usuário `7f8e5032-a10a-4905-85fe-78cca2b29e05` (Vinicius Ambrozio) não possui tokens de push ativos registrados no banco de dados, por isso recebeu "Nenhuma inscrição ativa encontrada".

## 🔧 SOLUÇÃO: REGISTRAR TOKEN DE PUSH

### **Passo 1: Verificar Status Atual**
Execute este SQL no Supabase SQL Editor:
```sql
-- Verificar tokens para o usuário específico
SELECT 
    id,
    user_id,
    endpoint,
    is_active,
    created_at,
    updated_at
FROM user_push_tokens 
WHERE user_id = '7f8e5032-a10a-4905-85fe-78cca2b29e05'
ORDER BY created_at DESC;
```

### **Passo 2: Registrar Token de Push**
1. **Abra o aplicativo em produção** e faça login
2. **Abra o console do navegador** (F12)
3. **Cole e execute o script** `register-user-specific.js`:

```javascript
// O script está no arquivo register-user-specific.js
// Ele irá:
// ✅ Verificar se você está logado
// ✅ Registrar o Service Worker
// ✅ Criar push subscription
// ✅ Salvar token no banco de dados
// ✅ Confirmar registro
```

### **Passo 3: Verificar Registro**
Execute este SQL para confirmar:
```sql
SELECT 
    user_id,
    endpoint,
    is_active,
    created_at
FROM user_push_tokens 
WHERE user_id = '7f8e5032-a10a-4905-85fe-78cca2b29e05'
AND is_active = true;
```

### **Passo 4: Testar Notificação**
Execute o script `test-notification-simple.js` no console:
```javascript
// Este script testa o envio de notificação
// diretamente para o seu usuário
```

## 🎯 RESULTADO ESPERADO

Após executar o script de registro:
- ✅ Token será salvo na tabela `user_push_tokens`
- ✅ Campo `is_active` será `true`
- ✅ Teste de notificação funcionará
- ✅ Notificações automáticas de programação funcionarão

## 🔍 TROUBLESHOOTING

Se ainda não funcionar:
1. **Verifique permissões do navegador** para notificações
2. **Limpe cache do Service Worker** com `clear-sw-cache.js`
3. **Execute `diagnose-notifications.js`** para diagnóstico completo

## 📱 PRÓXIMOS PASSOS

Após o registro bem-sucedido:
1. ✅ Teste criando uma nova programação
2. ✅ Verifique se recebe notificação automaticamente
3. ✅ Confirme que outros usuários também podem se registrar

---

**🎉 Com o token registrado, o sistema de notificações estará 100% funcional!**
