-- =============================================
-- SCRIPT PARA CORRIGIR VALORES DE DESPESAS
-- =============================================
-- Este script corrige despesas que estão com valores positivos
-- quando deveriam ser negativos (saídas de dinheiro)

-- 1. Verificar despesas com valores positivos (que deveriam ser negativos)
SELECT 
    id,
    descricao,
    categoria,
    valor,
    data_despesa,
    pump_id,
    company_id
FROM expenses 
WHERE valor > 0
ORDER BY data_despesa DESC;

-- 2. Contar quantas despesas precisam ser corrigidas
SELECT 
    COUNT(*) as total_despesas_positivas,
    SUM(valor) as valor_total_positivo
FROM expenses 
WHERE valor > 0;

-- 3. CORRIGIR: Converter todos os valores positivos para negativos
-- ATENÇÃO: Execute apenas se você tem certeza de que quer fazer essa correção
UPDATE expenses 
SET valor = -ABS(valor)
WHERE valor > 0;

-- 4. Verificar se a correção foi aplicada
SELECT 
    COUNT(*) as total_despesas_apos_correcao,
    SUM(valor) as valor_total_apos_correcao
FROM expenses;

-- 5. Verificar se ainda existem valores positivos (deveria retornar 0)
SELECT COUNT(*) as despesas_ainda_positivas
FROM expenses 
WHERE valor > 0;

-- 6. Mostrar algumas despesas corrigidas para verificação
SELECT 
    id,
    descricao,
    categoria,
    valor,
    data_despesa,
    pump_id
FROM expenses 
WHERE valor < 0
ORDER BY data_despesa DESC
LIMIT 10;

-- =============================================
-- INSTRUÇÕES DE USO:
-- =============================================
-- 1. Execute primeiro as consultas 1 e 2 para verificar o que será alterado
-- 2. Se estiver satisfeito com os resultados, execute a correção (UPDATE)
-- 3. Execute as consultas 4, 5 e 6 para verificar se a correção foi aplicada
-- 4. Faça backup do banco antes de executar o UPDATE
-- =============================================







