-- Setup DEBUG para notificações push
-- Execute este SQL para diagnosticar o problema

-- 1. Verificar se a tabela users existe
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_name = 'users';

-- 2. Verificar estrutura da tabela users
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 3. Verificar se já existem colunas de notificação
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('push_token', 'notification_enabled', 'notification_preferences');

-- 4. Verificar se a tabela notification_logs já existe
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_name = 'notification_logs';

-- 5. Se a tabela users existir, adicionar colunas
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
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
    
    RAISE NOTICE 'Colunas adicionadas à tabela users';
  ELSE
    RAISE NOTICE 'Tabela users não existe!';
  END IF;
END $$;

-- 6. Criar tabela notification_logs se não existir
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

-- 7. Adicionar foreign key se a tabela users existir
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE notification_logs 
    ADD CONSTRAINT IF NOT EXISTS fk_notification_logs_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Foreign key adicionada';
  ELSE
    RAISE NOTICE 'Foreign key não adicionada - tabela users não existe';
  END IF;
END $$;

-- 8. Verificar resultado final
SELECT 
  'users' as tabela,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('push_token', 'notification_enabled', 'notification_preferences')

UNION ALL

SELECT 
  'notification_logs' as tabela,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'notification_logs'
ORDER BY tabela, column_name;


