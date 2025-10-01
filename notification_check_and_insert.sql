-- Script para verificar estrutura e inserir apenas com colunas existentes
-- Baseado nos erros: notification_type e data não existem

-- 1. Verificar TODAS as colunas da tabela notification_logs
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;

-- 2. Tentar inserção apenas com colunas que sabemos que existem
-- Baseado nos erros anteriores, sabemos que existem: id, user_id, title, body, type, url, sent_at, status

INSERT INTO notification_logs (
  user_id, 
  title, 
  body, 
  type
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Setup Completo', 
  'Sistema de notificações configurado com sucesso!',
  'system'
);

-- 3. Se der erro de user_id, tentar sem ele
-- INSERT INTO notification_logs (
--   title, 
--   body, 
--   type
-- ) VALUES (
--   'Setup Completo', 
--   'Sistema de notificações configurado com sucesso!',
--   'system'
-- );

-- 4. Verificar se funcionou
SELECT COUNT(*) as total_logs FROM notification_logs;
SELECT * FROM notification_logs ORDER BY id DESC LIMIT 5;
SELECT 'Setup concluído com sucesso!' as status;
