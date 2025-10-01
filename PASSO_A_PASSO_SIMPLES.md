# 🚀 REGISTRO DE NOTIFICAÇÕES - PASSO A PASSO

## 📋 O QUE VOCÊ PRECISA FAZER:

### **Passo 1: Abrir o Aplicativo**
1. Abra o seu aplicativo em produção
2. Faça login normalmente
3. Abra o console do navegador (pressione F12)

### **Passo 2: Executar Script (COLE E ENTER)**
Cole este código no console e pressione ENTER:

```javascript
// Script de registro automático
(async function() {
  try {
    console.log('🚀 Iniciando registro...');
    
    // Verificar usuário logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('❌ Faça login primeiro!');
      return;
    }
    console.log('✅ Usuário:', user.id);
    
    // Registrar Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker pronto');
    
    // Criar subscription
    const VAPID_KEY = 'BBNAVQi46g1rgjQ2nF9kkDt--WPXzFFVIhQm5D9UvAGlAfO1sCORVCnd6MFpEABZvy0PuyECaXL-WxAzuILcnpA';
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: new Uint8Array(atob(VAPID_KEY.replace(/-/g,'+').replace(/_/g,'/')).split('').map(c => c.charCodeAt(0)))
    });
    console.log('✅ Subscription criada');
    
    // Salvar no banco
    await supabase.from('user_push_tokens').update({is_active: false}).eq('user_id', user.id);
    const {error} = await supabase.from('user_push_tokens').insert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      is_active: true
    });
    
    if (error) throw error;
    console.log('✅ Token salvo!');
    alert('🎉 Notificações registradas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    alert('❌ Erro: ' + error.message);
  }
})();
```

### **Passo 3: Testar (OPCIONAL)**
Para testar, cole este código:

```javascript
// Teste de notificação
fetch('https://rgsovlqsezjeqohlbyod.supabase.co/functions/v1/send-notification', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2Mzk1ODksImV4cCI6MjA3NDIxNTU4OX0.2mX7bKdKjKjKjKjKjKjKjKjKjKjKjKjKjKjKjKjKjKjK'
  },
  body: JSON.stringify({
    userIds: ['7f8e5032-a10a-4905-85fe-78cca2b29e05'],
    title: '🧪 Teste!',
    body: 'Notificação funcionando!'
  })
}).then(r => r.json()).then(console.log);
```

## ✅ **RESULTADO ESPERADO:**
- Alert de sucesso
- Token salvo no banco
- Notificações funcionando

## 🔍 **SE DER ERRO:**
Me envie a mensagem de erro do console que eu ajudo a resolver!
