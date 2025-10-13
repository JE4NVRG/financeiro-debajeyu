-- Debug completo do saldo da conta Cora
-- Investigação para descobrir por que está aparecendo R$ 76.307,79

-- 1. Verificar dados da conta Cora
SELECT 'DADOS DA CONTA CORA:' as debug_step;
SELECT * FROM contas WHERE is_cora_account = true;

-- 2. Verificar todas as entradas da conta Cora
SELECT 'TOTAL DE ENTRADAS:' as debug_step;
SELECT SUM(valor) as total_entradas FROM entradas WHERE conta_id = (SELECT id FROM contas WHERE is_cora_account = true);

-- 3. Verificar todos os pagamentos da conta Cora
SELECT 'TOTAL DE PAGAMENTOS:' as debug_step;
SELECT SUM(valor_pago) as total_pagamentos FROM pagamentos_fornecedores WHERE conta_id = (SELECT id FROM contas WHERE is_cora_account = true);

-- 4. Verificar abatimentos pré-saldo
SELECT 'TOTAL DE ABATIMENTOS:' as debug_step;
SELECT SUM(valor) as total_abatimentos FROM abatimentos_pre_saldo;

-- 5. Verificar valores em aberto de fornecedores
SELECT 'TOTAL EM ABERTO:' as debug_step;
SELECT SUM(saldo_aberto) as total_aberto FROM compras WHERE status IN ('Aberta', 'Parcial') AND saldo_aberto > 0;

-- 6. Testar a função get_conta_cora_info()
SELECT 'FUNÇÃO GET_CONTA_CORA_INFO:' as debug_step;
SELECT get_conta_cora_info();

-- 7. Calcular manualmente o saldo correto
SELECT 'CÁLCULO MANUAL DETALHADO:' as debug_step;
WITH cora_data AS (
  SELECT id FROM contas WHERE is_cora_account = true
),
totals AS (
  SELECT 
    COALESCE((SELECT SUM(valor) FROM entradas WHERE conta_id = (SELECT id FROM cora_data)), 0) as entradas,
    COALESCE((SELECT SUM(valor_pago) FROM pagamentos_fornecedores WHERE conta_id = (SELECT id FROM cora_data)), 0) as pagamentos,
    COALESCE((SELECT SUM(valor) FROM abatimentos_pre_saldo), 0) as abatimentos,
    COALESCE((SELECT SUM(saldo_aberto) FROM compras WHERE status IN ('Aberta', 'Parcial') AND saldo_aberto > 0), 0) as aberto
)
SELECT 
  entradas,
  pagamentos,
  abatimentos,
  aberto,
  (entradas - pagamentos - abatimentos) as saldo_atual,
  (entradas - pagamentos - abatimentos - aberto) as saldo_disponivel
FROM totals;

-- 8. Verificar detalhes das compras em aberto
SELECT 'COMPRAS EM ABERTO DETALHADAS:' as debug_step;
SELECT id, fornecedor_id, valor_total, valor_pago, saldo_aberto, status, created_at 
FROM compras 
WHERE status IN ('Aberta', 'Parcial') AND saldo_aberto > 0
ORDER BY created_at DESC;

-- 9. Verificar últimas entradas
SELECT 'ÚLTIMAS ENTRADAS:' as debug_step;
SELECT id, valor, descricao, created_at 
FROM entradas 
WHERE conta_id = (SELECT id FROM contas WHERE is_cora_account = true)
ORDER BY created_at DESC 
LIMIT 10;

-- 10. Verificar últimos pagamentos
SELECT 'ÚLTIMOS PAGAMENTOS:' as debug_step;
SELECT id, valor_pago, created_at 
FROM pagamentos_fornecedores 
WHERE conta_id = (SELECT id FROM contas WHERE is_cora_account = true)
ORDER BY created_at DESC 
LIMIT 10;