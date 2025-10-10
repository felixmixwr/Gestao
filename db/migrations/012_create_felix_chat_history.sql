-- Migration: Create felix_chat_history table
-- Description: Tabela para armazenar histórico de conversas com a FELIX IA

-- Criar tabela felix_chat_history
CREATE TABLE IF NOT EXISTS felix_chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id TEXT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_felix_chat_history_user_id ON felix_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_felix_chat_history_company_id ON felix_chat_history(company_id);
CREATE INDEX IF NOT EXISTS idx_felix_chat_history_updated_at ON felix_chat_history(updated_at DESC);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_felix_chat_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_felix_chat_history_updated_at
    BEFORE UPDATE ON felix_chat_history
    FOR EACH ROW
    EXECUTE FUNCTION update_felix_chat_history_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE felix_chat_history ENABLE ROW LEVEL SECURITY;

-- Política RLS: Usuários só podem ver seus próprios chats
CREATE POLICY "Users can only see their own chat history" ON felix_chat_history
    FOR ALL USING (auth.uid() = user_id);

-- Política RLS: Usuários só podem inserir seus próprios chats
CREATE POLICY "Users can only insert their own chat history" ON felix_chat_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política RLS: Usuários só podem atualizar seus próprios chats
CREATE POLICY "Users can only update their own chat history" ON felix_chat_history
    FOR UPDATE USING (auth.uid() = user_id);

-- Política RLS: Usuários só podem deletar seus próprios chats
CREATE POLICY "Users can only delete their own chat history" ON felix_chat_history
    FOR DELETE USING (auth.uid() = user_id);

-- Comentários na tabela e colunas
COMMENT ON TABLE felix_chat_history IS 'Histórico de conversas com a FELIX IA';
COMMENT ON COLUMN felix_chat_history.id IS 'ID único do histórico de chat';
COMMENT ON COLUMN felix_chat_history.user_id IS 'ID do usuário proprietário do chat';
COMMENT ON COLUMN felix_chat_history.company_id IS 'ID da empresa (multi-tenant)';
COMMENT ON COLUMN felix_chat_history.messages IS 'Array JSON com as mensagens do chat';
COMMENT ON COLUMN felix_chat_history.created_at IS 'Data de criação do histórico';
COMMENT ON COLUMN felix_chat_history.updated_at IS 'Data da última atualização';

-- Inserir dados de exemplo (opcional - remover em produção)
-- INSERT INTO felix_chat_history (user_id, company_id, messages) VALUES
-- (
--     '00000000-0000-0000-0000-000000000000', -- Substituir por ID real do usuário
--     'empresa-exemplo',
--     '[
--         {
--             "id": "1",
--             "type": "assistant",
--             "content": "Olá! Sou a FELIX IA, sua assistente empresarial.",
--             "timestamp": "2024-03-15T10:00:00.000Z"
--         }
--     ]'::jsonb
-- );





