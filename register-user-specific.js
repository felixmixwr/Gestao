// Script para registrar push notifications para usuário específico
// Execute este script no console do navegador após fazer login

import { createClient } from '@supabase/supabase-js';

// Configurações
const SUPABASE_URL = 'https://rgsovlqsezjeqohlbyod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnc292bHFzZXpqZXFvaGxieW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2Mzk1ODksImV4cCI6MjA3NDIxNTU4OX0.2mX7bKdKjKjKjKjKjKjKjKjKjKjKjKjKjKjKjKjKjKjK'; // Substitua pela sua chave anon
const VAPID_PUBLIC_KEY = 'BBNAVQi46g1rgjQ2nF9kkDt--WPXzFFVIhQm5D9UvAGlAfO1sCORVCnd6MFpEABZvy0PuyECaXL-WxAzuILcnpA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerPushForCurrentUser() {
  try {
    console.log('🚀 Iniciando registro de push notifications...');
    
    // Verificar se o usuário está logado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Usuário não autenticado:', userError?.message);
      alert('Você precisa estar logado para registrar notificações push!');
      return;
    }

    console.log('✅ Usuário autenticado:', user.id);
    console.log('📧 Email:', user.email);
    console.log('👤 Nome:', user.user_metadata?.full_name || 'N/A');

    // Verificar se o Service Worker está registrado
    if (!('serviceWorker' in navigator)) {
      console.error('❌ Service Worker não suportado');
      alert('Seu navegador não suporta Service Worker!');
      return;
    }

    // Registrar Service Worker
    console.log('📱 Registrando Service Worker...');
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service Worker registrado:', registration);

    // Aguardar Service Worker estar pronto
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker está pronto');

    // Verificar subscription existente
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('📱 Subscription existente encontrada:', subscription);
      
      // Verificar se está ativa no banco
      const { data: existingToken } = await supabase
        .from('user_push_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (existingToken) {
        console.log('✅ Token já está ativo no banco de dados');
        alert('Notificações push já estão registradas e ativas!');
        return;
      }
    } else {
      console.log('📱 Criando nova subscription...');
      
      // Tentar com applicationServerKey primeiro
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        console.log('✅ Subscription criada com applicationServerKey');
      } catch (error) {
        console.warn('⚠️ Erro com applicationServerKey:', error.message);
        
        // Tentar sem applicationServerKey
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true
          });
          console.log('✅ Subscription criada sem applicationServerKey');
        } catch (error2) {
          console.error('❌ Erro ao criar subscription:', error2.message);
          throw error2;
        }
      }
    }

    console.log('📱 Subscription details:', subscription);

    // Salvar no banco de dados
    console.log('💾 Salvando token no banco de dados...');
    
    // Desativar tokens antigos
    const { error: updateError } = await supabase
      .from('user_push_tokens')
      .update({ is_active: false })
      .eq('user_id', user.id);

    if (updateError) {
      console.warn('⚠️ Erro ao desativar tokens antigos:', updateError.message);
    }

    // Inserir novo token
    const { error: insertError } = await supabase
      .from('user_push_tokens')
      .insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        is_active: true
      });

    if (insertError) {
      console.error('❌ Erro ao salvar token:', insertError);
      throw insertError;
    }

    console.log('✅ Token salvo com sucesso no banco de dados!');
    
    // Verificar se foi salvo corretamente
    const { data: savedToken } = await supabase
      .from('user_push_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (savedToken) {
      console.log('✅ Token confirmado no banco:', savedToken);
      alert('🎉 Notificações push registradas com sucesso!\n\nAgora você receberá notificações quando novas programações forem adicionadas.');
    } else {
      console.error('❌ Token não foi encontrado no banco após salvar');
      alert('⚠️ Token foi salvo, mas não foi possível confirmar. Tente novamente.');
    }

  } catch (error) {
    console.error('❌ Erro ao registrar notificações push:', error);
    alert(`❌ Erro ao registrar notificações push:\n${error.message}\n\nVerifique o console para mais detalhes.`);
  }
}

// Executar automaticamente
registerPushForCurrentUser();

console.log('📋 Para executar manualmente, chame: registerPushForCurrentUser()');
