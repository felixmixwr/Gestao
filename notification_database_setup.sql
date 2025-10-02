-- Setup do banco de dados para notificações push
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar colunas de notificação na tabela users
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

-- 2. Criar tabela para log de notificações enviadas
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

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_notification_enabled ON users(notification_enabled);
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- 4. Criar função para limpar tokens antigos (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_old_notification_tokens()
RETURNS void AS $$
BEGIN
  -- Limpar tokens de usuários que não acessaram o sistema há mais de 30 dias
  UPDATE users 
  SET 
    push_token = NULL,
    notification_enabled = false
  WHERE 
    notification_enabled = true 
    AND push_token IS NOT NULL
    AND updated_at < NOW() - INTERVAL '30 days';
    
  -- Log da limpeza
  INSERT INTO notification_logs (user_id, notification_type, title, body, data)
  VALUES (
    NULL, 
    'system', 
    'Limpeza de Tokens', 
    'Tokens antigos foram removidos automaticamente',
    jsonb_build_object('cleaned_at', NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Criar função para enviar notificação (será chamada pelo Edge Function)
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_notification_type VARCHAR(50),
  p_title VARCHAR(255),
  p_body TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Inserir log da notificação
  INSERT INTO notification_logs (
    user_id,
    notification_type,
    title,
    body,
    data
  ) VALUES (
    p_user_id,
    p_notification_type,
    p_title,
    p_body,
    p_data
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar view para estatísticas de notificações
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  DATE_TRUNC('day', sent_at) as date,
  notification_type,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE delivered = true) as delivered,
  COUNT(*) FILTER (WHERE clicked = true) as clicked,
  ROUND(
    COUNT(*) FILTER (WHERE delivered = true) * 100.0 / COUNT(*), 
    2
  ) as delivery_rate,
  ROUND(
    COUNT(*) FILTER (WHERE clicked = true) * 100.0 / COUNT(*) FILTER (WHERE delivered = true), 
    2
  ) as click_rate
FROM notification_logs
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', sent_at), notification_type
ORDER BY date DESC, notification_type;

-- 7. Comentários para documentação
COMMENT ON COLUMN users.push_token IS 'Token de notificação push do usuário (JSON do PushSubscription)';
COMMENT ON COLUMN users.notification_enabled IS 'Se o usuário tem notificações ativadas';
COMMENT ON COLUMN users.notification_preferences IS 'Preferências de notificação do usuário (JSON)';

COMMENT ON TABLE notification_logs IS 'Log de todas as notificações enviadas';
COMMENT ON COLUMN notification_logs.notification_type IS 'Tipo da notificação: maintenance, diesel, investment, general';
COMMENT ON COLUMN notification_logs.delivered IS 'Se a notificação foi entregue com sucesso';
COMMENT ON COLUMN notification_logs.clicked IS 'Se o usuário clicou na notificação';

-- 8. Política RLS para notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification logs" ON notification_logs
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

-- 9. Verificar se as colunas foram criadas
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('push_token', 'notification_enabled', 'notification_preferences');

-- 10. Verificar se a tabela notification_logs foi criada
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;

