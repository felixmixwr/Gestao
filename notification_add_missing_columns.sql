-- Adicionar colunas que estão faltando para o sistema de notificações completo
-- Baseado na estrutura atual da tabela notification_logs

-- 1. Adicionar coluna notification_type (para categorizar tipos de notificação)
ALTER TABLE notification_logs 
ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50) DEFAULT 'general';

-- 2. Adicionar coluna data (para dados extras em formato JSON)
ALTER TABLE notification_logs 
ADD COLUMN IF NOT EXISTS data JSONB;

-- 3. Adicionar coluna delivered (para controlar se foi entregue)
ALTER TABLE notification_logs 
ADD COLUMN IF NOT EXISTS delivered BOOLEAN DEFAULT false;

-- 4. Adicionar coluna clicked (para controlar se foi clicada)
ALTER TABLE notification_logs 
ADD COLUMN IF NOT EXISTS clicked BOOLEAN DEFAULT false;

-- 5. Adicionar coluna error_message (para armazenar erros)
ALTER TABLE notification_logs 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 6. Verificar estrutura final da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notification_logs'
ORDER BY ordinal_position;

-- 7. Teste de inserção completa
INSERT INTO notification_logs (
  user_id, 
  title, 
  body, 
  type,
  notification_type,
  data,
  delivered,
  status
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Sistema Completo', 
  'Todas as colunas adicionadas com sucesso!',
  'system',
  'system',
  jsonb_build_object('setup_completed_at', NOW(), 'version', '1.0'),
  true,
  'sent'
);

-- 8. Verificar se funcionou
SELECT COUNT(*) as total_logs FROM notification_logs;
SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 3;
SELECT 'Colunas adicionadas com sucesso!' as status;
