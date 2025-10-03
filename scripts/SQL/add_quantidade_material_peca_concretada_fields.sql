-- =============================================
-- Script para adicionar campos de Quantidade de Material e Peça a ser Concretada
-- na tabela programacao
-- =============================================

-- Adicionar campo quantidade_material
ALTER TABLE programacao 
ADD COLUMN IF NOT EXISTS quantidade_material NUMERIC;

-- Adicionar campo peca_concretada
ALTER TABLE programacao 
ADD COLUMN IF NOT EXISTS peca_concretada TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN programacao.quantidade_material IS 'Quantidade de material em m³ para a programação';
COMMENT ON COLUMN programacao.peca_concretada IS 'Descrição da peça que será concretada (ex: Laje, Viga, Pilar, etc.)';

-- Verificar se os campos foram adicionados corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'programacao' 
    AND column_name IN ('quantidade_material', 'peca_concretada')
ORDER BY column_name;
