-- ============================================
-- FELIX IA - Histórico de Conversas por Usuário
-- ============================================

-- 1. Criar tabela de histórico de chat
CREATE TABLE IF NOT EXISTS felix_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context_data JSONB, -- Dados de contexto da mensagem
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_felix_chat_user_id ON felix_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_felix_chat_created_at ON felix_chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_felix_chat_user_created ON felix_chat_history(user_id, created_at DESC);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE felix_chat_history ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de segurança - Usuário só vê suas próprias mensagens
DROP POLICY IF EXISTS "Users can view own chat history" ON felix_chat_history;
CREATE POLICY "Users can view own chat history" 
  ON felix_chat_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON felix_chat_history;
CREATE POLICY "Users can insert own messages" 
  ON felix_chat_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own messages" ON felix_chat_history;
CREATE POLICY "Users can delete own messages" 
  ON felix_chat_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. Criar função para limpar mensagens antigas (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_felix_messages()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Manter apenas as últimas 100 mensagens por usuário
  DELETE FROM felix_chat_history
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM felix_chat_history
    ) sub
    WHERE rn > 100
  );
END;
$$;

-- 6. Comentários
COMMENT ON TABLE felix_chat_history IS 'Histórico de conversas do FELIX IA por usuário';
COMMENT ON COLUMN felix_chat_history.user_id IS 'ID do usuário (auth.users)';
COMMENT ON COLUMN felix_chat_history.message_type IS 'Tipo: user ou assistant';
COMMENT ON COLUMN felix_chat_history.content IS 'Conteúdo da mensagem';
COMMENT ON COLUMN felix_chat_history.context_data IS 'Dados de contexto (JSON)';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela felix_chat_history criada com sucesso!';
  RAISE NOTICE '✅ RLS habilitado - cada usuário vê apenas suas mensagens';
  RAISE NOTICE '✅ Índices criados para performance';
END $$;


