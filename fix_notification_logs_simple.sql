-- Script SIMPLES para corrigir o erro da tabela notification_logs
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT 
  'Tabela existe:' as status,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'notification_logs'
  ) as tabela_existe;

-- 2. Se a tabela não existir, criar ela
CREATE TABLE IF NOT EXISTS notification_logs (
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

-- 3. Habilitar RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 4. Criar política RLS
DROP POLICY IF EXISTS "Users can view their own notification logs" ON notification_logs;
CREATE POLICY "Users can view their own notification logs" ON notification_logs
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Agora testar o INSERT que estava falhando
INSERT INTO notification_logs (
  user_id,
  title,
  body,
  notification_type,
  data,
  delivered
) VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Pegar um user_id válido
  'Setup Completo',
  'Sistema de notificações configurado com sucesso!',
  'general',
  jsonb_build_object('setup', true),
  true
);

-- 6. Verificar se funcionou
SELECT COUNT(*) as total_logs FROM notification_logs;

