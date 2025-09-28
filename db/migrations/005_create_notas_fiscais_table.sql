-- Migration: Create notas_fiscais table
-- Description: Creates the new notas_fiscais table for the new NF workflow

-- Create notas_fiscais table
CREATE TABLE IF NOT EXISTS notas_fiscais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    relatorio_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    numero_nota VARCHAR(50) NOT NULL,
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    anexo_url TEXT,
    status VARCHAR(20) DEFAULT 'Faturada' CHECK (status IN ('Faturada', 'Paga', 'Cancelada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_relatorio_id ON notas_fiscais(relatorio_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_numero_nota ON notas_fiscais(numero_nota);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_status ON notas_fiscais(status);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_data_emissao ON notas_fiscais(data_emissao);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_notas_fiscais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notas_fiscais_updated_at
    BEFORE UPDATE ON notas_fiscais
    FOR EACH ROW
    EXECUTE FUNCTION update_notas_fiscais_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read all notas fiscais
CREATE POLICY "Allow authenticated users to read notas fiscais" ON notas_fiscais
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to insert notas fiscais
CREATE POLICY "Allow authenticated users to insert notas fiscais" ON notas_fiscais
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow authenticated users to update notas fiscais
CREATE POLICY "Allow authenticated users to update notas fiscais" ON notas_fiscais
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to delete notas fiscais
CREATE POLICY "Allow authenticated users to delete notas fiscais" ON notas_fiscais
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add comment to table
COMMENT ON TABLE notas_fiscais IS 'Tabela para armazenar notas fiscais vinculadas a relatórios';
COMMENT ON COLUMN notas_fiscais.relatorio_id IS 'ID do relatório ao qual a nota fiscal está vinculada';
COMMENT ON COLUMN notas_fiscais.numero_nota IS 'Número da nota fiscal';
COMMENT ON COLUMN notas_fiscais.data_emissao IS 'Data de emissão da nota fiscal';
COMMENT ON COLUMN notas_fiscais.data_vencimento IS 'Data de vencimento da nota fiscal';
COMMENT ON COLUMN notas_fiscais.valor IS 'Valor da nota fiscal';
COMMENT ON COLUMN notas_fiscais.anexo_url IS 'URL do anexo (PDF ou XML) armazenado no Supabase Storage';
COMMENT ON COLUMN notas_fiscais.status IS 'Status da nota fiscal: Faturada, Paga, Cancelada';
