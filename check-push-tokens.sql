-- Verificar tokens de push no banco de dados
-- Execute este script no Supabase Dashboard → SQL Editor

-- 1. Verificar se a tabela user_push_tokens existe e tem dados
SELECT '=== VERIFICAÇÃO DA TABELA user_push_tokens ===' as info;

SELECT COUNT(*) as total_tokens FROM user_push_tokens;
SELECT COUNT(*) as tokens_ativos FROM user_push_tokens WHERE is_active = true;

-- 2. Verificar estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_push_tokens'
ORDER BY ordinal_position;

-- 3. Ver dados existentes (se houver)
SELECT 
  id,
  user_id,
  endpoint,
  is_active,
  created_at
FROM user_push_tokens 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Verificar se há usuários na tabela users
SELECT '=== VERIFICAÇÃO DA TABELA users ===' as info;
SELECT COUNT(*) as total_usuarios FROM users;

-- 5. Verificar se há usuários com company_id
SELECT 
  id,
  email,
  company_id,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
