-- Setup STEP BY STEP para notificações push
-- Execute cada bloco separadamente para identificar o problema

-- BLOCO 1: Verificar se as tabelas existem
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_name IN ('users', 'notification_logs')
ORDER BY table_name;

-- BLOCO 2: Criar apenas a tabela notification_logs
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

-- BLOCO 3: Verificar se a tabela foi criada
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;

-- BLOCO 4: Adicionar colunas na tabela users (se existir)
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

-- BLOCO 5: Inserir registro de teste
INSERT INTO notification_logs (user_id, notification_type, title, body, data, delivered)
VALUES (
  NULL, 
  'system', 
  'Setup Completo', 
  'Sistema de notificações configurado com sucesso!',
  jsonb_build_object('setup_completed_at', NOW()),
  true
);

-- BLOCO 6: Verificar resultado final
SELECT COUNT(*) as total_logs FROM notification_logs;
SELECT 'Setup concluído!' as status;


