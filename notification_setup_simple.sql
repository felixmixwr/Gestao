-- Setup SIMPLES para notificações push
-- Execute este SQL primeiro no Supabase SQL Editor

-- 1. Adicionar colunas na tabela users
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

-- 2. Criar tabela notification_logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  error_message TEXT
);

-- 3. Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_users_notification_enabled ON users(notification_enabled);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);

-- 4. Verificar se foi criado
SELECT 'Tabelas criadas com sucesso!' as status;


