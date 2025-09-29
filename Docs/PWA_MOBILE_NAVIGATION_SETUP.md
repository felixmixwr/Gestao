# 📱 PWA Mobile Navigation & Push Notifications - Setup Guide

## 🎯 Funcionalidades Implementadas

### ✅ Navegação Mobile com Tabs Fixas
- **BottomTabs.tsx**: Componente de navegação fixa no rodapé (apenas mobile)
- **5 tabs principais**: Início, Relatórios, Financeiro, Bombas, Programação
- **Animações suaves** com Framer Motion
- **Badges de notificação** em cada tab
- **Desktop preservado**: Layout atual mantido intacto

### ✅ PWA Configuration
- **manifest.json**: Configuração completa para PWA
- **Service Worker**: Cache e notificações push
- **Meta tags**: Apple Touch Icons e configurações mobile
- **Shortcuts**: Atalhos para funcionalidades principais

### ✅ Sistema de Notificações Push
- **Hook useNotifications**: Gerenciamento de permissões e subscriptions
- **Hook useSendNotification**: Envio de notificações via Edge Function
- **NotificationManager**: Componente para gerenciar notificações em tempo real
- **Supabase Integration**: Armazenamento de subscriptions e envio via Edge Functions

## 🚀 Setup Instructions

### 1. Configuração do Supabase

#### 1.1 Criar tabela de push subscriptions
Execute o arquivo SQL no Supabase SQL Editor:
```sql
-- Arquivo: db/migrations/006_create_push_subscriptions_table.sql
```

#### 1.2 Configurar Edge Function
1. No Supabase Dashboard, vá para **Edge Functions**
2. Crie uma nova função chamada `send-notification`
3. Cole o conteúdo do arquivo `functions/send-notification/index.ts`
4. Deploy a função

#### 1.3 Configurar variáveis de ambiente
Adicione ao seu `.env`:
```env
VITE_VAPID_PUBLIC_KEY=sua_chave_vapid_publica
FCM_SERVER_KEY=sua_chave_fcm_server
```

### 2. Configuração do Firebase Cloud Messaging (FCM)

#### 2.1 Criar projeto Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative o Cloud Messaging

#### 2.2 Configurar Web App
1. Adicione uma Web App ao projeto
2. Copie as configurações do Firebase
3. Baixe o `firebase-messaging-sw.js`

#### 2.3 Gerar chaves VAPID
1. No Firebase Console, vá para **Project Settings > Cloud Messaging**
2. Em **Web configuration**, gere um novo par de chaves VAPID
3. Use a chave pública no `VITE_VAPID_PUBLIC_KEY`

### 3. Configuração de Ícones PWA

Crie os ícones necessários na pasta `public/icons/`:
```
public/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
├── icon-512x512.png
├── notification.png
├── badge.png
├── calendar-shortcut.png
├── reports-shortcut.png
└── finance-shortcut.png
```

### 4. Testando as Funcionalidades

#### 4.1 Testar PWA
1. Execute `npm run build`
2. Sirva os arquivos estáticos
3. Acesse via HTTPS
4. Instale como PWA no dispositivo mobile

#### 4.2 Testar Notificações
1. Abra o app no mobile
2. Aceite as permissões de notificação
3. Use o hook `useSendNotification` para enviar notificações de teste

## 📱 Como Usar

### Navegação Mobile
- As tabs aparecem automaticamente em dispositivos mobile (sm/md)
- Desktop mantém o layout atual com sidebar
- Cada tab tem ícone + label + badge de notificação

### Notificações Push
```typescript
import { useSendNotification } from '../hooks/useSendNotification'

function MyComponent() {
  const { sendProgramacaoNotification } = useSendNotification()
  
  const handleCreateProgramacao = async (data) => {
    // ... lógica de criação
    await sendProgramacaoNotification(data)
  }
}
```

### Gerenciamento de Notificações
```typescript
import { useNotifications } from '../hooks/useNotifications'

function NotificationSettings() {
  const { 
    isSupported, 
    permission, 
    initializeNotifications,
    unsubscribeFromPush 
  } = useNotifications()
  
  // Inicializar notificações
  useEffect(() => {
    if (isSupported) {
      initializeNotifications()
    }
  }, [])
}
```

## 🔧 Estrutura de Arquivos Criados

```
src/
├── components/
│   ├── layout/
│   │   └── BottomTabs.tsx          # Tabs de navegação mobile
│   └── NotificationManager.tsx      # Gerenciador de notificações
├── hooks/
│   ├── useNotifications.ts          # Hook para gerenciar notificações
│   └── useSendNotification.ts      # Hook para enviar notificações
public/
├── sw.js                           # Service Worker
├── manifest.json                   # PWA Manifest
└── icons/                          # Ícones PWA
functions/
└── send-notification/
    └── index.ts                    # Edge Function Supabase
db/migrations/
└── 006_create_push_subscriptions_table.sql
```

## 🎨 Customização

### Cores das Tabs
As cores ativas das tabs estão definidas em `BottomTabs.tsx`:
```typescript
// Cor ativa: text-blue-600
// Cor inativa: text-gray-500
```

### Animações
As animações estão configuradas com Framer Motion:
```typescript
// Tap animation
whileTap={{ scale: 0.95 }}

// Color transition
transition={{ duration: 0.1 }}
```

### Notificações
Personalize os tipos de notificação em `useSendNotification.ts`:
```typescript
const sendCustomNotification = useCallback(async (data) => {
  return sendNotification({
    notification: {
      title: 'Título personalizado',
      body: 'Corpo da notificação',
      icon: '/icons/custom.png',
      url: '/custom-route'
    }
  })
}, [sendNotification])
```

## 🐛 Troubleshooting

### Notificações não funcionam
1. Verifique se o HTTPS está configurado
2. Confirme se as permissões foram concedidas
3. Verifique se o Service Worker está registrado
4. Confirme se as chaves VAPID estão corretas

### PWA não instala
1. Verifique se o manifest.json está acessível
2. Confirme se todos os ícones existem
3. Teste em ambiente HTTPS
4. Verifique se o Service Worker está funcionando

### Tabs não aparecem no mobile
1. Verifique se a classe `md:hidden` está aplicada
2. Confirme se o componente está sendo renderizado
3. Teste em diferentes tamanhos de tela

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console do navegador
2. Teste em diferentes dispositivos
3. Confirme se todas as dependências estão instaladas
4. Verifique se o Supabase está configurado corretamente

---

**✅ Implementação completa!** O sistema está pronto para uso em produção com navegação mobile otimizada e notificações push funcionais.
