-- =============================================
-- Script Consolidado para Módulo de Programação
-- =============================================
-- Este script cria todas as tabelas e dependências necessárias
-- para o módulo de programação funcionar corretamente.

-- 1. Verificar e ajustar tabela colaboradores
-- Primeiro, verificar se a tabela existe
DO $$
BEGIN
    -- Se a tabela não existir, criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'colaboradores') THEN
        CREATE TABLE colaboradores (
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
        RAISE NOTICE '✅ Tabela colaboradores criada com sucesso';
    ELSE
        RAISE NOTICE '✅ Tabela colaboradores já existe';
        
        -- Verificar se a coluna cargo existe, se não, adicionar
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'colaboradores' AND column_name = 'cargo') THEN
            ALTER TABLE colaboradores ADD COLUMN cargo TEXT;
            RAISE NOTICE '✅ Coluna cargo adicionada à tabela colaboradores';
        ELSE
            RAISE NOTICE '✅ Coluna cargo já existe na tabela colaboradores';
        END IF;
        
        -- Verificar se a coluna company_id existe, se não, adicionar
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'colaboradores' AND column_name = 'company_id') THEN
            ALTER TABLE colaboradores ADD COLUMN company_id UUID REFERENCES companies(id);
            RAISE NOTICE '✅ Coluna company_id adicionada à tabela colaboradores';
        ELSE
            RAISE NOTICE '✅ Coluna company_id já existe na tabela colaboradores';
        END IF;
        
        -- Verificar se a coluna ativo existe, se não, adicionar
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'colaboradores' AND column_name = 'ativo') THEN
            ALTER TABLE colaboradores ADD COLUMN ativo BOOLEAN DEFAULT true;
            RAISE NOTICE '✅ Coluna ativo adicionada à tabela colaboradores';
        ELSE
            RAISE NOTICE '✅ Coluna ativo já existe na tabela colaboradores';
        END IF;
    END IF;
END $$;

-- Índices para colaboradores
CREATE INDEX IF NOT EXISTS idx_colaboradores_nome ON colaboradores(nome);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo ON colaboradores(cargo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_company_id ON colaboradores(company_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_ativo ON colaboradores(ativo);

-- RLS para colaboradores
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their company's colaboradores" ON colaboradores
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Trigger para colaboradores
CREATE OR REPLACE FUNCTION update_colaboradores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_colaboradores_updated_at
    BEFORE UPDATE ON colaboradores
    FOR EACH ROW
    EXECUTE FUNCTION update_colaboradores_updated_at();

-- 2. Criar tabela programacao
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

-- Índices para programacao
CREATE INDEX IF NOT EXISTS idx_programacao_data ON programacao(data);
CREATE INDEX IF NOT EXISTS idx_programacao_company_id ON programacao(company_id);
CREATE INDEX IF NOT EXISTS idx_programacao_bomba_id ON programacao(bomba_id);
CREATE INDEX IF NOT EXISTS idx_programacao_prefixo_obra ON programacao(prefixo_obra);

-- RLS para programacao
ALTER TABLE programacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their company's programacao" ON programacao
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Trigger para programacao
CREATE OR REPLACE FUNCTION update_programacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_programacao_updated_at
    BEFORE UPDATE ON programacao
    FOR EACH ROW
    EXECUTE FUNCTION update_programacao_updated_at();

-- Comentários
COMMENT ON TABLE colaboradores IS 'Tabela para armazenar colaboradores da empresa';
COMMENT ON COLUMN colaboradores.nome IS 'Nome completo do colaborador';
COMMENT ON COLUMN colaboradores.cargo IS 'Cargo/função do colaborador';
COMMENT ON COLUMN colaboradores.ativo IS 'Indica se o colaborador está ativo na empresa';

COMMENT ON TABLE programacao IS 'Tabela para armazenar programações de obras e bombas';
COMMENT ON COLUMN programacao.prefixo_obra IS 'Prefixo identificador da obra';
COMMENT ON COLUMN programacao.auxiliares_bomba IS 'Array com IDs dos auxiliares de bomba (mínimo 2)';
COMMENT ON COLUMN programacao.volume_previsto IS 'Volume de concreto previsto em m³';

-- Verificar se as tabelas foram criadas corretamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'colaboradores') THEN
        RAISE NOTICE '✅ Tabela colaboradores criada/verificada com sucesso';
    ELSE
        RAISE EXCEPTION '❌ Erro ao criar tabela colaboradores';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'programacao') THEN
        RAISE NOTICE '✅ Tabela programacao criada/verificada com sucesso';
    ELSE
        RAISE EXCEPTION '❌ Erro ao criar tabela programacao';
    END IF;
    
    RAISE NOTICE '🎉 Módulo de Programação configurado com sucesso!';
END $$;
