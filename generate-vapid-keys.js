// Script para gerar chaves VAPID
// Execute: node generate-vapid-keys.js

import webpush from 'web-push';

// Gerar chaves VAPID
const vapidKeys = webpush.generateVAPIDKeys();

console.log('🔑 Chaves VAPID geradas:');
console.log('');
console.log('Public Key (para o frontend):');
console.log(vapidKeys.publicKey);
console.log('');
console.log('Private Key (para o backend):');
console.log(vapidKeys.privateKey);
console.log('');

// Criar arquivo .env.example
const envExample = `# VAPID Keys para Push Notifications
VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
VAPID_EMAIL=mailto:admin@worldrental.com`;

console.log('📝 Adicione estas variáveis ao seu arquivo .env:');
console.log('');
console.log(envExample);
console.log('');

console.log('📋 Próximos passos:');
console.log('1. Copie a Public Key para o arquivo src/hooks/useNotifications.ts');
console.log('2. Adicione a Private Key nas variáveis de ambiente do Supabase');
console.log('3. Configure as variáveis de ambiente no seu projeto');
console.log('');

console.log('⚠️  IMPORTANTE:');
console.log('- Mantenha a Private Key segura e nunca a exponha no frontend');
console.log('- Use a Public Key apenas no frontend');
console.log('- As chaves são específicas para o seu domínio');
