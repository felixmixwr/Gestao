-- Script final para corrigir a tabela notification_logs
-- Baseado no erro: column "notification_type" does not exist

-- 1. Verificar estrutura real da tabela notification_logs
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;

-- 2. Adicionar a coluna notification_type que está faltando
ALTER TABLE notification_logs 
ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50) DEFAULT 'general';

-- 3. Verificar se a coluna foi adicionada
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;

-- 4. Inserção correta com todas as colunas necessárias
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
  'system',
  'system',
  jsonb_build_object('setup_completed_at', NOW()),
  true
);

-- 5. Verificar se funcionou
SELECT COUNT(*) as total_logs FROM notification_logs;
SELECT 'Setup concluído com sucesso!' as status;
