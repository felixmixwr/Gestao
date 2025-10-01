-- Script para corrigir o erro da tabela notification_logs
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar se a tabela notification_logs existe e sua estrutura
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;

-- 2. Se a tabela não existir ou não tiver a coluna notification_type, criar/corrigir
-- Primeiro, vamos verificar se a tabela existe
DO $$
BEGIN
  -- Verificar se a tabela existe
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_logs') THEN
    -- Criar a tabela se não existir
    CREATE TABLE notification_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      notification_type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      data JSONB,
      sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      delivered BOOLEAN DEFAULT false,
      clicked BOOLEAN DEFAULT false,
      error_message TEXT
    );
    
    RAISE NOTICE 'Tabela notification_logs criada com sucesso!';
  ELSE
    -- Se a tabela existe, verificar se a coluna notification_type existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'notification_logs' 
      AND column_name = 'notification_type'
    ) THEN
      -- Adicionar a coluna se não existir
      ALTER TABLE notification_logs 
      ADD COLUMN notification_type VARCHAR(50) NOT NULL DEFAULT 'general';
      
      RAISE NOTICE 'Coluna notification_type adicionada com sucesso!';
    ELSE
      RAISE NOTICE 'Tabela notification_logs já existe com a coluna notification_type!';
    END IF;
  END IF;
END $$;

-- 3. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);

-- 4. Habilitar RLS se não estiver habilitado
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 5. Criar política RLS se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_logs' 
    AND policyname = 'Users can view their own notification logs'
  ) THEN
    CREATE POLICY "Users can view their own notification logs" ON notification_logs
      FOR SELECT 
      TO authenticated
      USING (user_id = auth.uid());
    
    RAISE NOTICE 'Política RLS criada com sucesso!';
  ELSE
    RAISE NOTICE 'Política RLS já existe!';
  END IF;
END $$;

-- 6. Teste: Inserir um registro de teste
INSERT INTO notification_logs (
  user_id,
  notification_type,
  title,
  body,
  data,
  delivered
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Pegar um user_id válido
  'general',
  'Setup Completo',
  'Sistema de notificações configurado com sucesso!',
  jsonb_build_object('setup', true, 'timestamp', NOW()),
  true
);

-- 7. Verificar se o insert funcionou
SELECT 
  id,
  notification_type,
  title,
  body,
  delivered,
  sent_at
FROM notification_logs 
ORDER BY sent_at DESC 
LIMIT 5;

-- 8. Mostrar estrutura final da tabela
SELECT 
  'notification_logs' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;

