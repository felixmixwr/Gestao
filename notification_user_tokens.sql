-- Criar tabela para armazenar tokens de push dos usuários
-- Necessário para o sistema de notificações push funcionar

-- 1. Criar tabela user_push_tokens
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(is_active);

-- 3. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_user_push_tokens_updated_at ON user_push_tokens;
CREATE TRIGGER trigger_update_user_push_tokens_updated_at
  BEFORE UPDATE ON user_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_user_push_tokens_updated_at();

-- 5. Configurar RLS (Row Level Security)
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
CREATE POLICY "Users can manage their own push tokens" ON user_push_tokens
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all push tokens" ON user_push_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- 7. Verificar estrutura da tabela criada
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_push_tokens'
ORDER BY ordinal_position;

-- 8. Teste de inserção (simulado)
INSERT INTO user_push_tokens (
  user_id,
  endpoint,
  p256dh,
  auth
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'https://fcm.googleapis.com/fcm/send/test-endpoint',
  'test-p256dh-key',
  'test-auth-key'
);

-- 9. Verificar se funcionou
SELECT COUNT(*) as total_tokens FROM user_push_tokens;
SELECT 'Tabela user_push_tokens criada com sucesso!' as status;

