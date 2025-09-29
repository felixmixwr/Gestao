-- Versão alternativa do SQL para criar tabela de push subscriptions
-- Esta versão remove objetos existentes antes de recriar

-- Remove trigger se existir
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;

-- Remove política se existir
DROP POLICY IF EXISTS "Users can only see their own push subscriptions" ON push_subscriptions;

-- Remove função se existir (opcional - pode ser usada por outras tabelas)
-- DROP FUNCTION IF EXISTS update_updated_at_column();

-- Tabela para armazenar subscriptions de push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- RLS (Row Level Security)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para usuários só poderem ver suas próprias subscriptions
CREATE POLICY "Users can only see their own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_push_subscriptions_updated_at 
  BEFORE UPDATE ON push_subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE push_subscriptions IS 'Armazena subscriptions de push notifications dos usuários';
COMMENT ON COLUMN push_subscriptions.user_id IS 'ID do usuário autenticado';
COMMENT ON COLUMN push_subscriptions.subscription IS 'Dados da subscription (endpoint, keys) em formato JSON';
COMMENT ON COLUMN push_subscriptions.created_at IS 'Data de criação da subscription';
COMMENT ON COLUMN push_subscriptions.updated_at IS 'Data da última atualização da subscription';
