-- Script para corrigir o problema do usuário sem empresa
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, vamos ver se existe alguma empresa no sistema
SELECT id, name FROM companies LIMIT 5;

-- 2. Se não houver empresas, crie uma empresa padrão
INSERT INTO companies (id, name) 
VALUES (gen_random_uuid(), 'Empresa Padrão')
ON CONFLICT DO NOTHING;

-- 3. Obtenha o ID da empresa padrão
-- (Substitua 'Empresa Padrão' pelo nome da empresa que você criou)
SELECT id FROM companies WHERE name = 'Empresa Padrão';

-- 4. Crie o usuário na tabela users com a empresa padrão
-- Substitua o ID do usuário e o ID da empresa pelos valores corretos
INSERT INTO users (id, email, full_name, company_id)
VALUES (
  '015d1e47-ea7b-4449-b9e8-566b713ea7b0', -- ID do usuário do Supabase Auth
  'seu-email@exemplo.com', -- Email do usuário
  'Nome do Usuário', -- Nome do usuário
  (SELECT id FROM companies WHERE name = 'Empresa Padrão' LIMIT 1) -- ID da empresa
)
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id;

-- 5. Verifique se o usuário foi criado/atualizado corretamente
SELECT u.id, u.email, u.full_name, c.name as company_name 
FROM users u 
LEFT JOIN companies c ON u.company_id = c.id 
WHERE u.id = '015d1e47-ea7b-4449-b9e8-566b713ea7b0';

-- 6. Se você quiser criar uma empresa específica, use este comando:
-- INSERT INTO companies (id, name) VALUES (gen_random_uuid(), 'Nome da Sua Empresa');
