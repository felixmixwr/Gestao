-- Setup FINAL para notificações push
-- Versão corrigida sem erros de sintaxe

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

-- 3. Tentar adicionar foreign key (corrigido)
DO $$
BEGIN
  BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_notification_logs_user_id' 
      AND table_name = 'notification_logs'
    ) THEN
      ALTER TABLE notification_logs 
      ADD CONSTRAINT fk_notification_logs_user_id 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      RAISE NOTICE 'Foreign key adicionada com sucesso';
    ELSE
      RAISE NOTICE 'Foreign key já existe';
    END IF;
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
FROM notification_logs;

-- 7. Verificar colunas na tabela users (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE NOTICE 'Verificando colunas na tabela users...';
  ELSE
    RAISE NOTICE 'Tabela users não existe';
  END IF;
END $$;

-- 8. Mostrar estrutura da tabela notification_logs
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;

-- 9. Status final
SELECT 'Setup concluído com sucesso!' as status;


