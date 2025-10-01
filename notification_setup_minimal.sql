-- Setup MINIMAL para notificações push
-- Versão mais simples, sem foreign keys

-- 1. Criar tabela notification_logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  error_message TEXT
);

-- 2. Adicionar colunas na tabela users (se existir)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "maintenance_reminders": true,
  "diesel_refueling": true,
  "investments": true,
  "general_updates": true,
  "sound_enabled": true,
  "vibration_enabled": true
}'::jsonb;

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_users_notification_enabled ON users(notification_enabled);

-- 4. Inserir registro de teste
INSERT INTO notification_logs (user_id, notification_type, title, body, data, delivered)
VALUES (
  NULL, 
  'system', 
  'Setup Completo', 
  'Sistema de notificações configurado com sucesso!',
  jsonb_build_object('setup_completed_at', NOW()),
  true
);

-- 5. Verificar resultado
SELECT 'Tabela notification_logs criada!' as status;
SELECT COUNT(*) as total_logs FROM notification_logs;


