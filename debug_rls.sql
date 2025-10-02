-- Debug para problemas de RLS
-- Execute este SQL para diagnosticar o problema

-- 1. Verificar se o usuário está autenticado
SELECT 
    auth.uid() as user_id,
    auth.email() as user_email,
    current_user as current_db_user;

-- 2. Verificar se o usuário tem company_id
SELECT 
    id,
    email,
    company_id,
    full_name
FROM users 
WHERE id = auth.uid();

-- 3. Verificar se existem pumps com owner_company_id
SELECT 
    id,
    prefix,
    model,
    owner_company_id
FROM pumps 
LIMIT 5;

-- 4. Verificar se existem companies
SELECT 
    id,
    name
FROM companies 
LIMIT 5;

-- 5. Verificar políticas RLS atuais
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'expenses';

-- 6. Verificar permissões na tabela expenses
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'expenses';

-- 7. Teste simples de inserção (substitua os valores pelos corretos)
-- Descomente e ajuste os valores conforme necessário:
/*
INSERT INTO expenses (
    descricao,
    categoria,
    valor,
    tipo_custo,
    data_despesa,
    pump_id,
    company_id,
    status,
    payment_method
) VALUES (
    'Teste RLS',
    'Diesel',
    100.00,
    'variável',
    '2024-12-15',
    'SEU_PUMP_ID_AQUI',
    'SEU_COMPANY_ID_AQUI',
    'pendente',
    'cartao'
);
*/
