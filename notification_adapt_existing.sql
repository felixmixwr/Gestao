-- Adaptar à estrutura real da tabela notification_logs
-- Baseado no erro mostrado

-- 1. Primeiro, vamos ver a estrutura REAL da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;

-- 2. Inserção adaptada à estrutura real
-- Baseado no erro, a tabela tem: id, user_id, title, body, type, url, sent_at, status, notification_type, data, delivered, clicked, error_message

INSERT INTO notification_logs (
  user_id, 
  title, 
  body, 
  type, 
  notification_type, 
  data, 
  delivered
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Pegar um user_id válido
  'Setup Completo', 
  'Sistema de notificações configurado com sucesso!',
  'system', -- Esta é a coluna "type" que estava faltando
  'system', -- Esta é a coluna "notification_type"
  jsonb_build_object('setup_completed_at', NOW()),
  true
);

-- 3. Se der erro de user_id, tentar sem ele
-- INSERT INTO notification_logs (
--   title, 
--   body, 
--   type, 
--   notification_type, 
--   data, 
--   delivered
-- ) VALUES (
--   'Setup Completo', 
--   'Sistema de notificações configurado com sucesso!',
--   'system',
--   'system',
--   jsonb_build_object('setup_completed_at', NOW()),
--   true
-- );

-- 4. Verificar se funcionou
SELECT COUNT(*) as total_logs FROM notification_logs;
SELECT 'Setup concluído!' as status;


