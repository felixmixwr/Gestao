-- =============================================
-- Script APENAS para Módulo de Programação
-- =============================================
-- Este script cria APENAS a tabela programacao
-- e se adapta à estrutura existente da tabela colaboradores.

-- Criar tabela programacao
CREATE TABLE IF NOT EXISTS programacao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prefixo_obra TEXT, -- Agora opcional
    data DATE NOT NULL,
    horario TIME NOT NULL,
    cliente_id UUID REFERENCES clients(id), -- Referência para tabela clients
    cliente TEXT, -- Para compatibilidade com dados antigos
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
    motorista_operador TEXT,
    auxiliares_bomba TEXT[], -- Array de auxiliares
    bomba_id UUID REFERENCES pumps(id),
    company_id UUID REFERENCES companies(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para programacao
CREATE INDEX IF NOT EXISTS idx_programacao_data ON programacao(data);
CREATE INDEX IF NOT EXISTS idx_programacao_company_id ON programacao(company_id);
CREATE INDEX IF NOT EXISTS idx_programacao_bomba_id ON programacao(bomba_id);
CREATE INDEX IF NOT EXISTS idx_programacao_cliente_id ON programacao(cliente_id);
CREATE INDEX IF NOT EXISTS idx_programacao_prefixo_obra ON programacao(prefixo_obra);

-- RLS para programacao
ALTER TABLE programacao ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso apenas aos dados da empresa do usuário (apenas se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'programacao' AND policyname = 'Users can only access their company''s programacao'
    ) THEN
        CREATE POLICY "Users can only access their company's programacao" ON programacao
            FOR ALL USING (
                company_id IN (
                    SELECT company_id FROM users 
                    WHERE id = auth.uid()
                )
            );
        RAISE NOTICE '✅ Política RLS criada para programacao';
    ELSE
        RAISE NOTICE '✅ Política RLS já existe para programacao';
    END IF;
END $$;

-- Trigger para programacao
CREATE OR REPLACE FUNCTION update_programacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger apenas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_programacao_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_programacao_updated_at
            BEFORE UPDATE ON programacao
            FOR EACH ROW
            EXECUTE FUNCTION update_programacao_updated_at();
        RAISE NOTICE '✅ Trigger updated_at criado para programacao';
    ELSE
        RAISE NOTICE '✅ Trigger updated_at já existe para programacao';
    END IF;
END $$;

-- Comentários
COMMENT ON TABLE programacao IS 'Tabela para armazenar programações de obras e bombas';
COMMENT ON COLUMN programacao.prefixo_obra IS 'Prefixo identificador da obra';
COMMENT ON COLUMN programacao.auxiliares_bomba IS 'Array com IDs dos auxiliares de bomba (mínimo 2)';
COMMENT ON COLUMN programacao.volume_previsto IS 'Volume de concreto previsto em m³';

-- Verificar se a tabela foi criada corretamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'programacao') THEN
        RAISE NOTICE '✅ Tabela programacao criada/verificada com sucesso';
    ELSE
        RAISE EXCEPTION '❌ Erro ao criar tabela programacao';
    END IF;
    
    RAISE NOTICE '🎉 Módulo de Programação configurado com sucesso!';
    RAISE NOTICE '📝 Nota: Usando estrutura existente da tabela colaboradores';
END $$;
