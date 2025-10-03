-- =============================================
-- CORREÇÃO: Constraint expenses_discount_type_check
-- =============================================
-- Problema: A constraint não permite valores NULL/undefined
-- Solução: Alterar constraint para permitir NULL

-- 1. Remover a constraint atual
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_discount_type_check;

-- 2. Adicionar nova constraint que permite NULL
ALTER TABLE expenses 
ADD CONSTRAINT expenses_discount_type_check 
CHECK (discount_type IS NULL OR discount_type IN ('fixed', 'percentage'));

-- 3. Verificar se a correção foi aplicada
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'expenses_discount_type_check';

-- 4. Verificar dados existentes
SELECT 
    id,
    description,
    discount_type,
    discount_value,
    valor
FROM expenses 
WHERE discount_type IS NOT NULL
LIMIT 10;
