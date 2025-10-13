-- Investigação completa do problema do saldo da conta Cora
-- Executar cada query separadamente para identificar a causa raiz

-- 1. Verificar dados básicos da conta Cora
SELECT 'DADOS BÁSICOS DA CONTA CORA:' as debug_step;
SELECT id, nome, saldo_atual, is_cora_account FROM contas WHERE is_cora_account = true;

-- 2. Verificar totais de entradas
SELECT 'TOTAL DE ENTRADAS:' as debug_step;
SELECT COALESCE(SUM(valor), 0) as total_entradas 
FROM entradas 
WHERE conta_id = (SELECT id FROM contas WHERE is_cora_account = true LIMIT 1);

-- 3. Verificar totais de pagamentos
SELECT 'TOTAL DE PAGAMENTOS:' as debug_step;
SELECT COALESCE(SUM(valor_pago), 0) as total_pagamentos 
FROM pagamentos_fornecedores 
WHERE conta_id = (SELECT id FROM contas WHERE is_cora_account = true LIMIT 1);

-- 4. Verificar abatimentos pré-saldo
SELECT 'TOTAL DE ABATIMENTOS:' as debug_step;
SELECT COALESCE(SUM(valor), 0) as total_abatimentos 
FROM abatimentos_pre_saldo;

-- 5. Verificar valores em aberto
SELECT 'TOTAL EM ABERTO:' as debug_step;
SELECT COALESCE(SUM(saldo_aberto), 0) as total_aberto 
FROM compras 
WHERE status IN ('Aberta', 'Parcial') AND saldo_aberto > 0;

-- 6. Testar função get_conta_cora_info()
SELECT 'FUNÇÃO GET_CONTA_CORA_INFO:' as debug_step;
SELECT get_conta_cora_info();

-- 7. Testar função get_saldo_atual_cora()
SELECT 'FUNÇÃO GET_SALDO_ATUAL_CORA:' as debug_step;
SELECT get_saldo_atual_cora();

-- 8. Cálculo manual do saldo correto
SELECT 'CÁLCULO MANUAL:' as debug_step;
WITH cora_id AS (
  SELECT id FROM contas WHERE is_cora_account = true LIMIT 1
)
SELECT 
  (SELECT COALESCE(SUM(valor), 0) FROM entradas WHERE conta_id = (SELECT id FROM cora_id)) as entradas,
  (SELECT COALESCE(SUM(valor_pago), 0) FROM pagamentos_fornecedores WHERE conta_id = (SELECT id FROM cora_id)) as pagamentos,
  (SELECT COALESCE(SUM(valor), 0) FROM abatimentos_pre_saldo) as abatimentos,
  (
    (SELECT COALESCE(SUM(valor), 0) FROM entradas WHERE conta_id = (SELECT id FROM cora_id)) -
    (SELECT COALESCE(SUM(valor_pago), 0) FROM pagamentos_fornecedores WHERE conta_id = (SELECT id FROM cora_id)) -
    (SELECT COALESCE(SUM(valor), 0) FROM abatimentos_pre_saldo)
  ) as saldo_calculado_manual;