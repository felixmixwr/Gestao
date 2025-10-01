// COPIE E COLE NO CONSOLE DO NAVEGADOR
// Este script faz tudo automaticamente

(async function() {
  try {
    console.log('🚀 Registrando notificações...');
    
    // Verificar login
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('❌ Faça login primeiro!');
      return;
    }
    console.log('✅ Usuário:', user.id);
    
    // Registrar Service Worker
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker OK');
    
    // Criar subscription
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: new Uint8Array(atob('BBNAVQi46g1rgjQ2nF9kkDt--WPXzFFVIhQm5D9UvAGlAfO1sCORVCnd6MFpEABZvy0PuyECaXL-WxAzuILcnpA'.replace(/-/g,'+').replace(/_/g,'/')).split('').map(c => c.charCodeAt(0)))
    });
    console.log('✅ Subscription OK');
    
    // Salvar token
    await supabase.from('user_push_tokens').update({is_active: false}).eq('user_id', user.id);
    await supabase.from('user_push_tokens').insert({
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      is_active: true
    });
    
    console.log('✅ Token salvo!');
    alert('🎉 SUCESSO! Notificações registradas!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    alert('❌ Erro: ' + error.message);
  }
})();
