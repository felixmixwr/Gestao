-- 1. Verificar se o token foi salvo
SELECT 
    id,
    user_id,
    endpoint,
    is_active,
    created_at
FROM user_push_tokens 
WHERE user_id = '7f8e5032-a10a-4905-85fe-78cca2b29e05'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Testar notificação diretamente via SQL (simulação)
SELECT 
    'Token encontrado para usuário: ' || user_id as status,
    CASE 
        WHEN is_active = true THEN '✅ ATIVO - Pronto para notificações'
        ELSE '❌ INATIVO - Precisa ser reativado'
    END as estado
FROM user_push_tokens 
WHERE user_id = '7f8e5032-a10a-4905-85fe-78cca2b29e05'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Contar tokens ativos total
SELECT 
    COUNT(*) as total_tokens_ativos,
    COUNT(DISTINCT user_id) as usuarios_com_notificacoes
FROM user_push_tokens 
WHERE is_active = true;
