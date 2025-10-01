-- Adicionar APENAS as colunas na tabela users
-- Execute este SQL depois de criar a tabela notification_logs

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

-- Verificar se as colunas foram adicionadas
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('push_token', 'notification_enabled', 'notification_preferences');

SELECT 'Colunas adicionadas na tabela users!' as status;


