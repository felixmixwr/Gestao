-- =============================================
-- Script para verificar se os campos existem na tabela programacao
-- =============================================

-- Verificar estrutura da tabela programacao
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'programacao' 
    AND column_name IN ('volume_previsto', 'quantidade_material', 'peca_concretada', 'fck', 'brita', 'slump')
ORDER BY column_name;

-- Verificar se existem dados nas programações
SELECT 
    id,
    horario,
    cliente,
    volume_previsto,
    quantidade_material,
    peca_concretada,
    fck,
    brita,
    slump
FROM programacao 
LIMIT 5;

-- Contar quantas programações têm os campos preenchidos
SELECT 
    COUNT(*) as total_programacoes,
    COUNT(volume_previsto) as com_volume_previsto,
    COUNT(quantidade_material) as com_quantidade_material,
    COUNT(peca_concretada) as com_peca_concretada,
    COUNT(fck) as com_fck,
    COUNT(brita) as com_brita,
    COUNT(slump) as com_slump
FROM programacao;
