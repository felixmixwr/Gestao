-- Criar tabela programacao
CREATE TABLE IF NOT EXISTS programacao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prefixo_obra TEXT NOT NULL,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    fc TEXT,
    cliente TEXT NOT NULL,
    responsavel TEXT,
    cep TEXT NOT NULL,
    endereco TEXT NOT NULL,
    numero TEXT NOT NULL,
    bairro TEXT,
    cidade TEXT,
    estado TEXT,
    volume_previsto NUMERIC,
    fck TEXT,
    brita TEXT,
    slump TEXT,
    equipe TEXT,
    motorista_operador TEXT,
    auxiliares_bomba TEXT[], -- Array de auxiliares
    bomba_id UUID REFERENCES pumps(id),
    company_id UUID REFERENCES companies(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_programacao_data ON programacao(data);
CREATE INDEX IF NOT EXISTS idx_programacao_company_id ON programacao(company_id);
CREATE INDEX IF NOT EXISTS idx_programacao_bomba_id ON programacao(bomba_id);
CREATE INDEX IF NOT EXISTS idx_programacao_prefixo_obra ON programacao(prefixo_obra);

-- Ativar RLS (Row Level Security)
ALTER TABLE programacao ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso apenas aos dados da empresa do usuário
CREATE POLICY "Users can only access their company's programacao" ON programacao
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_programacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_programacao_updated_at
    BEFORE UPDATE ON programacao
    FOR EACH ROW
    EXECUTE FUNCTION update_programacao_updated_at();

-- Comentários na tabela
COMMENT ON TABLE programacao IS 'Tabela para armazenar programações de obras e bombas';
COMMENT ON COLUMN programacao.prefixo_obra IS 'Prefixo identificador da obra';
COMMENT ON COLUMN programacao.auxiliares_bomba IS 'Array com IDs dos auxiliares de bomba (mínimo 2)';
COMMENT ON COLUMN programacao.volume_previsto IS 'Volume de concreto previsto em m³';
