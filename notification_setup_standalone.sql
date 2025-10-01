-- Setup STANDALONE para notificações push
-- Este SQL funciona independente da estrutura existente

-- 1. Criar tabela notification_logs (sem dependências)
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

-- 2. Tentar adicionar colunas na tabela users (se existir)
DO $$
BEGIN
  BEGIN
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
    
    RAISE NOTICE 'Colunas adicionadas à tabela users com sucesso';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Erro ao adicionar colunas na tabela users: %', SQLERRM;
  END;
END $$;

-- 3. Tentar adicionar foreign key (se possível)
DO $$
BEGIN
  BEGIN
    ALTER TABLE notification_logs 
    ADD CONSTRAINT IF NOT EXISTS fk_notification_logs_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Foreign key adicionada com sucesso';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Foreign key não pôde ser adicionada: %', SQLERRM;
  END;
END $$;

-- 4. Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- 5. Inserir registro de teste
INSERT INTO notification_logs (user_id, notification_type, title, body, data, delivered)
VALUES (
  NULL, 
  'system', 
  'Setup Completo', 
  'Sistema de notificações configurado com sucesso!',
  jsonb_build_object('setup_completed_at', NOW()),
  true
);

-- 6. Verificar se tudo foi criado
SELECT 
  'notification_logs' as tabela,
  COUNT(*) as registros
FROM notification_logs

UNION ALL

SELECT 
  'users' as tabela,
  COUNT(*) as registros
FROM users
WHERE notification_enabled IS NOT NULL;

-- 7. Mostrar estrutura final
SELECT 'Setup concluído! Verifique os resultados acima.' as status;


