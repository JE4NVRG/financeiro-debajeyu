-- Teste da função validate_account_balance após correção do erro de tipo

-- 1. Verificar se a conta Cora existe
SELECT 'VERIFICANDO CONTA CORA:' as test_step;
SELECT id, nome, is_cora_account, saldo_atual FROM contas WHERE is_cora_account = true;

-- 2. Testar função calcular_saldo_conta diretamente
SELECT 'TESTANDO CALCULAR_SALDO_CONTA:' as test_step;
SELECT calcular_saldo_conta((SELECT id FROM contas WHERE is_cora_account = true LIMIT 1)) as saldo_calculado;

-- 3. Testar função validate_account_balance
SELECT 'TESTANDO VALIDATE_ACCOUNT_BALANCE:' as test_step;
SELECT validate_account_balance(
    (SELECT id FROM contas WHERE is_cora_account = true LIMIT 1),
    1000.00
) as resultado_validacao;

-- 4. Verificar se não há mais erros de tipo
SELECT 'TESTE COMPLETO - RESULTADO:' as test_step;
SELECT 
    'Função corrigida com sucesso' as status,
    calcular_saldo_conta((SELECT id FROM contas WHERE is_cora_account = true LIMIT 1)) as saldo_atual
;