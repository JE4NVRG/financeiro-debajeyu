-- Debug: Verificar se existe conta Cora no banco de dados
SELECT 
    id,
    nome,
    ativa,
    is_cora_account,
    saldo_atual,
    created_at,
    updated_at
FROM contas 
WHERE is_cora_account = true;

-- Verificar todas as contas para debug
SELECT 
    id,
    nome,
    ativa,
    is_cora_account,
    saldo_atual
FROM contas 
ORDER BY created_at DESC;