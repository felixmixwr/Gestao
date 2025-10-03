-- Verificar se o token foi salvo corretamente
SELECT 
    id,
    user_id,
    endpoint,
    is_active,
    created_at,
    updated_at
FROM user_push_tokens 
WHERE user_id = '7f8e5032-a10a-4905-85fe-78cca2b29e05'
AND is_active = true
ORDER BY created_at DESC;

-- Verificar total de tokens ativos
SELECT 
    COUNT(*) as total_tokens_ativos,
    COUNT(DISTINCT user_id) as usuarios_com_tokens
FROM user_push_tokens 
WHERE is_active = true;
