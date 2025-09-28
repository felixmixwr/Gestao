-- Script para criar tabela colaboradores se não existir
-- Necessário para o módulo de programação

CREATE TABLE IF NOT EXISTS colaboradores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL,
    telefone TEXT,
    email TEXT,
    ativo BOOLEAN DEFAULT true,
    company_id UUID REFERENCES companies(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_colaboradores_nome ON colaboradores(nome);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo ON colaboradores(cargo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_company_id ON colaboradores(company_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_ativo ON colaboradores(ativo);

-- Ativar RLS
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso apenas aos dados da empresa do usuário
CREATE POLICY "Users can only access their company's colaboradores" ON colaboradores
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_colaboradores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_colaboradores_updated_at
    BEFORE UPDATE ON colaboradores
    FOR EACH ROW
    EXECUTE FUNCTION update_colaboradores_updated_at();

-- Comentários na tabela
COMMENT ON TABLE colaboradores IS 'Tabela para armazenar colaboradores da empresa';
COMMENT ON COLUMN colaboradores.nome IS 'Nome completo do colaborador';
COMMENT ON COLUMN colaboradores.cargo IS 'Cargo/função do colaborador';
COMMENT ON COLUMN colaboradores.ativo IS 'Indica se o colaborador está ativo na empresa';




