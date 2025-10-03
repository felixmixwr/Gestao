-- Script alternativo para corrigir a constraint de valor na tabela expenses
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

-- 3. Criar nova constraint que permite valores negativos (despesas) e positivos (entradas)
-- Esta constraint permite qualquer valor numérico válido
ALTER TABLE expenses ADD CONSTRAINT expenses_valor_check 
CHECK (valor IS NOT NULL AND valor != 0);

-- 4. Verificar se a constraint foi criada corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'expenses'::regclass 
AND contype = 'c';

-- 5. Mostrar mensagem de sucesso
SELECT 'Constraint de valor corrigida! Agora permite valores negativos (despesas) e positivos (entradas).' as status;
