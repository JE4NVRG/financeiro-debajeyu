-- Debug script para verificar problemas de autenticação
-- Verificar se existem usuários na tabela auth.users

-- 1. Verificar usuários existentes na tabela auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;