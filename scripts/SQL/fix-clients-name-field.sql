-- Script para corrigir o campo 'name' na tabela clients
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar dados atuais da tabela clients
SELECT 'VERIFICANDO DADOS ATUAIS DA TABELA CLIENTS' as status;
SELECT 
    id,
    name,
    rep_name,
    company_name,
    email,
    phone,
    created_at
FROM clients 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Contar quantos clientes têm o campo 'name' vazio ou NULL
SELECT 'CONTAGEM DE CLIENTES COM NAME VAZIO' as status;
SELECT 
    COUNT(*) as total_clients,
    COUNT(name) as clients_with_name,
    COUNT(*) - COUNT(name) as clients_without_name
FROM clients;

-- 3. Atualizar o campo 'name' onde está NULL ou vazio
-- Prioridade: company_name > rep_name > 'Cliente sem nome'
UPDATE clients 
SET name = COALESCE(
    NULLIF(company_name, ''), 
    NULLIF(rep_name, ''), 
    'Cliente ' || SUBSTRING(id::text, 1, 8)
)
WHERE name IS NULL OR name = '';

-- 4. Verificar se a atualização funcionou
SELECT 'DADOS APÓS ATUALIZAÇÃO' as status;
SELECT 
    id,
    name,
    rep_name,
    company_name,
    email,
    phone,
    created_at
FROM clients 
ORDER BY created_at DESC
LIMIT 10;

-- 5. Contar novamente para confirmar a correção
SELECT 'CONTAGEM APÓS CORREÇÃO' as status;
SELECT 
    COUNT(*) as total_clients,
    COUNT(name) as clients_with_name,
    COUNT(*) - COUNT(name) as clients_without_name
FROM clients;

-- 6. Testar a consulta que é usada na programação
SELECT 'TESTE DA CONSULTA DE CLIENTES PARA PROGRAMAÇÃO' as status;
SELECT 
    id,
    name
FROM clients 
ORDER BY name
LIMIT 5;
