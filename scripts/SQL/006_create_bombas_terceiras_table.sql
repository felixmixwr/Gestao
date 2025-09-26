-- Script para criar a tabela bombas_terceiras
-- Este script cria a tabela para armazenar informações de bombas que pertencem a empresas terceiras

-- Criar enum para status das bombas terceiras
CREATE TYPE status_bomba_terceira AS ENUM ('ativa', 'em manutenção', 'indisponível');

-- Criar tabela bombas_terceiras
CREATE TABLE IF NOT EXISTS bombas_terceiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas_terceiras(id) ON DELETE CASCADE,
    prefixo VARCHAR(50) NOT NULL,
    modelo VARCHAR(100),
    ano INTEGER,
    status status_bomba_terceira DEFAULT 'ativa',
    proxima_manutencao DATE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_bombas_terceiras_empresa_id ON bombas_terceiras(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bombas_terceiras_prefixo ON bombas_terceiras(prefixo);
CREATE INDEX IF NOT EXISTS idx_bombas_terceiras_status ON bombas_terceiras(status);
CREATE INDEX IF NOT EXISTS idx_bombas_terceiras_proxima_manutencao ON bombas_terceiras(proxima_manutencao);
CREATE INDEX IF NOT EXISTS idx_bombas_terceiras_created_at ON bombas_terceiras(created_at);

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_bombas_terceiras_updated_at 
    BEFORE UPDATE ON bombas_terceiras 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Criar constraint para garantir que o prefixo seja único por empresa
CREATE UNIQUE INDEX IF NOT EXISTS idx_bombas_terceiras_empresa_prefixo 
    ON bombas_terceiras(empresa_id, prefixo);

-- Comentários na tabela e colunas
COMMENT ON TABLE bombas_terceiras IS 'Tabela para armazenar informações de bombas que pertencem a empresas terceiras';
COMMENT ON COLUMN bombas_terceiras.id IS 'Identificador único da bomba terceira';
COMMENT ON COLUMN bombas_terceiras.empresa_id IS 'Referência para a empresa terceira proprietária da bomba';
COMMENT ON COLUMN bombas_terceiras.prefixo IS 'Código identificador único da bomba (obrigatório)';
COMMENT ON COLUMN bombas_terceiras.modelo IS 'Modelo da bomba';
COMMENT ON COLUMN bombas_terceiras.ano IS 'Ano de fabricação da bomba';
COMMENT ON COLUMN bombas_terceiras.status IS 'Status atual da bomba (ativa, em manutenção, indisponível)';
COMMENT ON COLUMN bombas_terceiras.proxima_manutencao IS 'Data prevista para próxima manutenção';
COMMENT ON COLUMN bombas_terceiras.observacoes IS 'Observações adicionais sobre a bomba';
COMMENT ON COLUMN bombas_terceiras.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN bombas_terceiras.updated_at IS 'Data e hora da última atualização do registro';

-- Criar view para facilitar consultas com dados da empresa
CREATE OR REPLACE VIEW view_bombas_terceiras_com_empresa AS
SELECT 
    bt.id,
    bt.empresa_id,
    bt.prefixo,
    bt.modelo,
    bt.ano,
    bt.status,
    bt.proxima_manutencao,
    bt.observacoes,
    bt.created_at,
    bt.updated_at,
    et.nome_fantasia as empresa_nome_fantasia,
    et.razao_social as empresa_razao_social,
    et.cnpj as empresa_cnpj,
    et.telefone as empresa_telefone,
    et.email as empresa_email,
    et.endereco as empresa_endereco
FROM bombas_terceiras bt
LEFT JOIN empresas_terceiras et ON bt.empresa_id = et.id;

COMMENT ON VIEW view_bombas_terceiras_com_empresa IS 'View que combina dados das bombas terceiras com informações da empresa proprietária';

