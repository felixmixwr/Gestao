-- Script para corrigir a constraint de valor na tabela expenses
-- Execute este script no Supabase SQL Editor

-- 1. Verificar a constraint atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'expenses'::regclass 
AND contype = 'c';

-- 2. Remover a constraint atual (se existir)
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_valor_check;

-- 3. Criar nova constraint que permite valores negativos
ALTER TABLE expenses ADD CONSTRAINT expenses_valor_check 
CHECK (valor IS NOT NULL);

-- 4. Verificar se a constraint foi criada corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'expenses'::regclass 
AND contype = 'c';

-- 5. Testar inserção de valor negativo (opcional)
-- INSERT INTO expenses (descricao, valor, categoria, tipo_custo, data_despesa, pump_id, company_id, status)
-- VALUES ('Teste valor negativo', -100.00, 'Outros', 'fixo', '2025-10-03', 
--         (SELECT id FROM pumps LIMIT 1), 
--         (SELECT id FROM companies LIMIT 1), 'pago');

-- 6. Mostrar mensagem de sucesso
SELECT 'Constraint de valor corrigida com sucesso! Agora permite valores negativos.' as status;
