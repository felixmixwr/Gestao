-- Verificar tokens ativos para o usuário específico
SELECT 
    id,
    user_id,
    endpoint,
    is_active,
    created_at,
    updated_at
FROM user_push_tokens 
WHERE user_id = '7f8e5032-a10a-4905-85fe-78cca2b29e05'
ORDER BY created_at DESC;

-- Verificar se há algum token inativo
SELECT 
    COUNT(*) as total_tokens,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_tokens,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_tokens
FROM user_push_tokens 
WHERE user_id = '7f8e5032-a10a-4905-85fe-78cca2b29e05';
