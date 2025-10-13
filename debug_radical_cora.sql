-- DIAGNÓSTICO RADICAL - VALORES EXATOS DA CONTA CORA
-- Executar linha por linha para identificar EXATAMENTE onde está a diferença

-- 1. VALORES BRUTOS DA CONTA CORA
SELECT 
    'VALORES BRUTOS' as tipo,
    id,
    nome,
    saldo_inicial,
    created_at
FROM contas 
WHERE nome = 'Conta Cora';

-- 2. ENTRADAS TOTAIS
SELECT 
    'ENTRADAS TOTAIS' as tipo,
    SUM(valor) as total_entradas,
    COUNT(*) as quantidade_entradas
FROM entradas 
WHERE conta_id = (SELECT id FROM contas WHERE nome = 'Conta Cora');

-- 3. PAGAMENTOS TOTAIS
SELECT 
    'PAGAMENTOS TOTAIS' as tipo,
    SUM(valor_pago) as total_pagamentos,
    COUNT(*) as quantidade_pagamentos
FROM pagamentos 
WHERE conta_id = (SELECT id FROM contas WHERE nome = 'Conta Cora');

-- 4. ABATIMENTOS TOTAIS
SELECT 
    'ABATIMENTOS TOTAIS' as tipo,
    SUM(valor_abatimento) as total_abatimentos,
    COUNT(*) as quantidade_abatimentos
FROM abatimentos 
WHERE conta_id = (SELECT id FROM contas WHERE nome = 'Conta Cora');

-- 5. COMPRAS ABERTAS (que afetam saldo disponível)
SELECT 
    'COMPRAS ABERTAS' as tipo,
    SUM(saldo_aberto) as total_saldo_aberto,
    COUNT(*) as quantidade_compras_abertas
FROM compras 
WHERE status IN ('Aberta', 'Parcial');

-- 6. CÁLCULO MANUAL DO SALDO ATUAL
SELECT 
    'CALCULO MANUAL SALDO ATUAL' as tipo,
    (
        COALESCE((SELECT saldo_inicial FROM contas WHERE nome = 'Conta Cora'), 0) +
        COALESCE((SELECT SUM(valor) FROM entradas WHERE conta_id = (SELECT id FROM contas WHERE nome = 'Conta Cora')), 0) -
        COALESCE((SELECT SUM(valor_pago) FROM pagamentos WHERE conta_id = (SELECT id FROM contas WHERE nome = 'Conta Cora')), 0) -
        COALESCE((SELECT SUM(valor_abatimento) FROM abatimentos WHERE conta_id = (SELECT id FROM contas WHERE nome = 'Conta Cora')), 0)
    ) as saldo_atual_manual;

-- 7. CÁLCULO MANUAL DO SALDO DISPONÍVEL
SELECT 
    'CALCULO MANUAL SALDO DISPONIVEL' as tipo,
    (
        COALESCE((SELECT saldo_inicial FROM contas WHERE nome = 'Conta Cora'), 0) +
        COALESCE((SELECT SUM(valor) FROM entradas WHERE conta_id = (SELECT id FROM contas WHERE nome = 'Conta Cora')), 0) -
        COALESCE((SELECT SUM(valor_pago) FROM pagamentos WHERE conta_id = (SELECT id FROM contas WHERE nome = 'Conta Cora')), 0) -
        COALESCE((SELECT SUM(valor_abatimento) FROM abatimentos WHERE conta_id = (SELECT id FROM contas WHERE nome = 'Conta Cora')), 0) -
        COALESCE((SELECT SUM(saldo_aberto) FROM compras WHERE status IN ('Aberta', 'Parcial')), 0)
    ) as saldo_disponivel_manual;

-- 8. RESULTADO DA FUNÇÃO get_conta_cora_info()
SELECT 
    'FUNCAO get_conta_cora_info' as tipo,
    * 
FROM get_conta_cora_info();

-- 9. RESULTADO DA FUNÇÃO validate_account_balance para Conta Cora
SELECT 
    'FUNCAO validate_account_balance' as tipo,
    *
FROM validate_account_balance((SELECT id FROM contas WHERE nome = 'Conta Cora'), 100);

-- 10. RESULTADO DA FUNÇÃO calcular_saldo_conta para Conta Cora
SELECT 
    'FUNCAO calcular_saldo_conta' as tipo,
    calcular_saldo_conta((SELECT id FROM contas WHERE nome = 'Conta Cora')) as saldo_calculado;