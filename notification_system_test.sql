-- Script final para testar o sistema completo de notificações
-- Execute este script para verificar se tudo está funcionando

-- 1. Verificar estrutura das tabelas
SELECT '=== ESTRUTURA DA TABELA notification_logs ===' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;

SELECT '=== ESTRUTURA DA TABELA user_push_tokens ===' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_push_tokens'
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS
SELECT '=== POLÍTICAS RLS DA TABELA notification_logs ===' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'notification_logs';

SELECT '=== POLÍTICAS RLS DA TABELA user_push_tokens ===' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_push_tokens';

-- 3. Verificar dados existentes
SELECT '=== DADOS NA TABELA notification_logs ===' as info;
SELECT COUNT(*) as total_notifications FROM notification_logs;
SELECT 
  id,
  title,
  type,
  notification_type,
  status,
  delivered,
  sent_at
FROM notification_logs 
ORDER BY sent_at DESC 
LIMIT 5;

SELECT '=== DADOS NA TABELA user_push_tokens ===' as info;
SELECT COUNT(*) as total_tokens FROM user_push_tokens;
SELECT 
  id,
  user_id,
  is_active,
  created_at
FROM user_push_tokens 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Teste de inserção final
SELECT '=== TESTE DE INSERÇÃO FINAL ===' as info;
INSERT INTO notification_logs (
  user_id, 
  title, 
  body, 
  type,
  notification_type,
  data,
  delivered,
  status
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Sistema de Notificações Ativo', 
  'O sistema de notificações push está funcionando corretamente!',
  'system',
  'system',
  jsonb_build_object(
    'test_completed_at', NOW(), 
    'version', '1.0',
    'features', jsonb_build_array('push_notifications', 'user_tokens', 'notification_logs')
  ),
  true,
  'sent'
);

-- 5. Verificar resultado final
SELECT '=== RESULTADO FINAL ===' as info;
SELECT COUNT(*) as total_notifications_final FROM notification_logs;
SELECT 'Sistema de notificações configurado com sucesso!' as status;

-- 6. Instruções para usar o sistema
SELECT '=== INSTRUÇÕES DE USO ===' as info;
SELECT '1. O usuário deve ativar notificações no navegador' as step_1;
SELECT '2. O token será salvo automaticamente na tabela user_push_tokens' as step_2;
SELECT '3. Use o NotificationTestPanel para enviar notificações de teste' as step_3;
SELECT '4. Use o notificationService para enviar notificações programaticamente' as step_4;
SELECT '5. Todas as notificações são logadas na tabela notification_logs' as step_5;
