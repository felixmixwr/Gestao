-- Script para corrigir dados da tabela clients
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar dados atuais da tabela clients
SELECT 'DADOS ATUAIS DA TABELA CLIENTS' as info;
SELECT 
    id,
    name,
    email,
    phone,
    company_name,
    created_at
FROM clients 
ORDER BY created_at DESC;

-- 2. Atualizar o campo name com o company_name onde name está NULL
UPDATE clients 
SET name = company_name 
WHERE name IS NULL OR name = '';

-- 3. Verificar se a atualização funcionou
SELECT 'DADOS APÓS ATUALIZAÇÃO' as info;
SELECT 
    id,
    name,
    email,
    phone,
    company_name,
    created_at
FROM clients 
ORDER BY created_at DESC;

-- 4. Verificar se há outros campos NULL que precisam ser preenchidos
SELECT 'VERIFICAR OUTROS CAMPOS NULL' as info;
SELECT 
    id,
    name,
    email,
    phone,
    company_name,
    CASE 
        WHEN name IS NULL THEN 'NAME IS NULL'
        WHEN email IS NULL THEN 'EMAIL IS NULL'
        WHEN phone IS NULL THEN 'PHONE IS NULL'
        WHEN company_name IS NULL THEN 'COMPANY_NAME IS NULL'
        ELSE 'ALL FIELDS OK'
    END as status
FROM clients;

-- 5. Se necessário, preencher campos vazios com dados padrão
-- (Execute apenas se necessário)
/*
UPDATE clients 
SET 
    email = COALESCE(email, 'sem-email@exemplo.com'),
    phone = COALESCE(phone, '00000000000')
WHERE email IS NULL OR phone IS NULL;
*/

-- 6. Testar o JOIN novamente após a correção
SELECT 'TESTE DO JOIN APÓS CORREÇÃO' as info;
SELECT 
    r.id,
    r.report_number,
    r.client_id,
    r.client_rep_name,
    c.name as client_name,
    c.email as client_email,
    c.phone as client_phone,
    c.company_name as client_company_name
FROM reports r
LEFT JOIN clients c ON r.client_id = c.id
WHERE r.report_number = '#REL-03';
