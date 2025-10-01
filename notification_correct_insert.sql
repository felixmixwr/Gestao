-- Script para inserção correta na tabela notification_logs
-- Baseado na estrutura real da tabela

-- 1. Inserção correta com apenas as colunas que existem
INSERT INTO notification_logs (
  user_id, 
  title, 
  body, 
  type,
  status
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Setup Completo', 
  'Sistema de notificações configurado com sucesso!',
  'system',
  'sent'
);

-- 2. Se der erro de user_id, tentar sem ele (user_id é nullable)
-- INSERT INTO notification_logs (
--   title, 
--   body, 
--   type,
--   status
-- ) VALUES (
--   'Setup Completo', 
--   'Sistema de notificações configurado com sucesso!',
--   'system',
--   'sent'
-- );

-- 3. Verificar se funcionou
SELECT COUNT(*) as total_logs FROM notification_logs;
SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 5;
SELECT 'Setup concluído com sucesso!' as status;
