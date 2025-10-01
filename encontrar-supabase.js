// Script para encontrar onde o Supabase está disponível
// Execute este script no console

(function() {
  console.log('🔍 Procurando Supabase em diferentes locais...');
  
  // Verificar diferentes variáveis globais onde o Supabase pode estar
  const possibleLocations = [
    'window.supabase',
    'window.supabaseClient', 
    'window.supa',
    'window.sb',
    'window.db',
    'window.$supabase'
  ];
  
  let foundSupabase = null;
  let foundLocation = null;
  
  for (const location of possibleLocations) {
    try {
      const value = eval(location);
      if (value && typeof value === 'object' && value.auth) {
        foundSupabase = value;
        foundLocation = location;
        console.log(`✅ Supabase encontrado em: ${location}`);
        console.log('📱 Objeto:', value);
        break;
      }
    } catch (e) {
      // Ignorar erros de eval
    }
  }
  
  if (!foundSupabase) {
    console.log('❌ Supabase não encontrado em nenhuma variável global');
    console.log('🔍 Verificando window object...');
    
    // Listar todas as propriedades do window que podem ser o Supabase
    const windowProps = Object.keys(window).filter(key => 
      key.toLowerCase().includes('supabase') || 
      key.toLowerCase().includes('supa') ||
      key.toLowerCase().includes('client')
    );
    
    console.log('📋 Propriedades do window que podem ser Supabase:', windowProps);
    
    for (const prop of windowProps) {
      try {
        const value = window[prop];
        if (value && typeof value === 'object' && value.auth) {
          foundSupabase = value;
          foundLocation = `window.${prop}`;
          console.log(`✅ Supabase encontrado em: window.${prop}`);
          break;
        }
      } catch (e) {
        // Ignorar erros
      }
    }
  }
  
  if (foundSupabase) {
    console.log(`🎉 SUPABASE ENCONTRADO EM: ${foundLocation}`);
    
    // Testar se o usuário está logado
    foundSupabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        console.error('❌ Erro ao verificar usuário:', error);
      } else if (user) {
        console.log('✅ Usuário logado:', user.id);
      } else {
        console.log('⚠️ Nenhum usuário logado');
      }
    });
    
    // Criar uma variável global temporária
    window.tempSupabase = foundSupabase;
    console.log('🔧 Supabase disponível como: window.tempSupabase');
    
    alert(`✅ SUPABASE ENCONTRADO!\n\nLocalização: ${foundLocation}\n\nDisponível como: window.tempSupabase\n\nAgora você pode usar window.tempSupabase para testar a Edge Function.`);
    
  } else {
    console.log('❌ Supabase não encontrado em lugar nenhum');
    alert('❌ SUPABASE NÃO ENCONTRADO\n\nO Supabase não está disponível nesta página.\n\nTente:\n1. Executar na página principal do app\n2. Aguardar o carregamento completo\n3. Verificar se o app está funcionando corretamente');
  }
})();
