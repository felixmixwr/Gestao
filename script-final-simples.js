// SCRIPT FINAL - SEM IMPORTAÇÕES DINÂMICAS
// Cole este código no console

(async function() {
  try {
    console.log('🚀 Iniciando registro...');
    
    // Verificar se já existe supabase globalmente
    let supabaseClient;
    if (window.supabase) {
      supabaseClient = window.supabase;
      console.log('✅ Usando supabase global');
    } else {
      console.log('❌ Supabase não encontrado globalmente');
      
      // Tentar encontrar o cliente em outras variáveis globais
      const possibleClients = [
        window.supabaseClient,
        window.supa,
        window.sb,
        window.db
      ];
      
      for (const client of possibleClients) {
        if (client && client.auth && client.from) {
          supabaseClient = client;
          console.log('✅ Supabase encontrado em variável global');
          break;
        }
      }
      
      if (!supabaseClient) {
        alert('❌ Não foi possível encontrar o cliente Supabase.\n\nTente executar este script na página principal do app (dashboard) onde o Supabase está carregado.');
        return;
      }
    }
    
    // Verificar usuário logado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      alert('❌ Erro ao verificar usuário: ' + (userError?.message || 'Usuário não encontrado'));
      return;
    }
    console.log('✅ Usuário:', user.id);
    
    // Registrar Service Worker
    if (!('serviceWorker' in navigator)) {
      alert('❌ Service Worker não suportado neste navegador');
      return;
    }
    
    console.log('📱 Registrando Service Worker...');
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker registrado');
    
    // Criar push subscription
    console.log('🔔 Criando push subscription...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: new Uint8Array(atob('BBNAVQi46g1rgjQ2nF9kkDt--WPXzFFVIhQm5D9UvAGlAfO1sCORVCnd6MFpEABZvy0PuyECaXL-WxAzuILcnpA'.replace(/-/g,'+').replace(/_/g,'/')).split('').map(c => c.charCodeAt(0)))
    });
    console.log('✅ Push subscription criada');
    
    // Salvar token no banco
    console.log('💾 Salvando token no banco...');
    
    // Desativar tokens antigos
    const { error: updateError } = await supabaseClient
      .from('user_push_tokens')
      .update({ is_active: false })
      .eq('user_id', user.id);
    
    if (updateError) {
      console.warn('⚠️ Erro ao desativar tokens antigos:', updateError.message);
    }
    
    // Inserir novo token
    const { error: insertError } = await supabaseClient
      .from('user_push_tokens')
      .insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        is_active: true
      });
    
    if (insertError) {
      console.error('❌ Erro ao inserir token:', insertError);
      throw insertError;
    }
    
    console.log('✅ Token salvo com sucesso!');
    alert('🎉 SUCESSO!\n\nNotificações push registradas com sucesso!\n\nAgora você receberá notificações quando novas programações forem adicionadas.');
    
  } catch (error) {
    console.error('❌ Erro completo:', error);
    alert('❌ Erro: ' + error.message + '\n\nVerifique o console para mais detalhes.');
  }
})();
