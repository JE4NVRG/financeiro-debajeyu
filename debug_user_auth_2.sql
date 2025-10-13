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

-- 2. Verificar se há registros na tabela pagamentos_fornecedores
SELECT 
    id,
    usuario_id,
    compra_id,
    valor_pago,
    created_at
FROM pagamentos_fornecedores 
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar se há usuários órfãos (usuario_id que não existe em auth.users)
SELECT 
    pf.id,
    pf.usuario_id,
    pf.valor_pago,
    au.email
FROM pagamentos_fornecedores pf
LEFT JOIN auth.users au ON pf.usuario_id = au.id
WHERE au.id IS NULL
LIMIT 10;

-- 4. Verificar constraint da foreign key
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'pagamentos_fornecedores'
    AND kcu.column_name = 'usuario_id';