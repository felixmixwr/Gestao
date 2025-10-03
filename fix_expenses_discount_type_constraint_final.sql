-- =============================================
-- CORREÇÃO FINAL: Constraint expenses_discount_type_check
-- =============================================
-- Problema: A constraint não permite valores NULL/undefined
-- Solução: Alterar constraint para permitir NULL

-- 1. Verificar constraint atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'expenses_discount_type_check';

-- 2. Remover a constraint atual
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_discount_type_check;

-- 3. Adicionar nova constraint que permite NULL
ALTER TABLE expenses 
ADD CONSTRAINT expenses_discount_type_check 
CHECK (discount_type IS NULL OR discount_type IN ('fixed', 'percentage'));

-- 4. Verificar se a correção foi aplicada
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'expenses_discount_type_check';

-- 5. Verificar dados existentes com discount_type
SELECT 
    id,
    descricao,
    discount_type,
    discount_value,
    valor,
    created_at
FROM expenses 
WHERE discount_type IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 6. Verificar se há registros com valores inválidos
SELECT 
    id,
    descricao,
    discount_type,
    discount_value
FROM expenses 
WHERE discount_type IS NOT NULL 
AND discount_type NOT IN ('fixed', 'percentage');

-- 7. Se houver registros inválidos, corrigi-los
-- UPDATE expenses 
-- SET discount_type = NULL 
-- WHERE discount_type IS NOT NULL 
-- AND discount_type NOT IN ('fixed', 'percentage');
