-- Teste da padronização: Verificar se todas as funções retornam o mesmo valor
-- Após aplicar a migração 055, todas devem retornar R$ 32.625,63

-- 1. Função get_conta_cora_info() - Dashboard
SELECT 'DASHBOARD (get_conta_cora_info):' as teste;
SELECT 
    (get_conta_cora_info()->>'saldo_atual')::decimal as saldo_dashboard,
    (get_conta_cora_info()->>'saldo_disponivel')::decimal as saldo_disponivel_dashboard;

-- 2. Função calcular_saldo_conta() - Modal
SELECT 'MODAL (calcular_saldo_conta):' as teste;
SELECT calcular_saldo_conta((SELECT id FROM contas WHERE is_cora_account = true LIMIT 1)) as saldo_modal;

-- 3. Função get_saldo_atual_cora() - Hook
SELECT 'HOOK (get_saldo_atual_cora):' as teste;
SELECT get_saldo_atual_cora() as saldo_hook;

-- 4. Verificar saldo_atual na tabela (deve estar atualizado)
SELECT 'TABELA CONTAS (saldo_atual):' as teste;
SELECT saldo_atual as saldo_tabela FROM contas WHERE is_cora_account = true;

-- 5. Cálculo manual da página Contas (referência)
SELECT 'PÁGINA CONTAS (cálculo manual):' as teste;
WITH cora_data AS (
  SELECT id FROM contas WHERE is_cora_account = true LIMIT 1
)
SELECT 
  (
    COALESCE((SELECT SUM(valor) FROM entradas WHERE conta_id = (SELECT id FROM cora_data)), 0) -
    COALESCE((SELECT SUM(valor_pago) FROM pagamentos_fornecedores WHERE conta_id = (SELECT id FROM cora_data)), 0) -
    COALESCE((SELECT SUM(valor) FROM abatimentos_pre_saldo), 0)
  ) as saldo_pagina_contas;

-- 6. Teste final: Todos devem ser iguais
SELECT 'TESTE FINAL - CONSISTÊNCIA:' as teste;
WITH todos_saldos AS (
  SELECT 
    'Dashboard' as origem,
    (get_conta_cora_info()->>'saldo_atual')::decimal as valor
  UNION ALL
  SELECT 
    'Modal' as origem,
    calcular_saldo_conta((SELECT id FROM contas WHERE is_cora_account = true LIMIT 1)) as valor
  UNION ALL
  SELECT 
    'Hook' as origem,
    get_saldo_atual_cora() as valor
  UNION ALL
  SELECT 
    'Tabela' as origem,
    saldo_atual as valor
  FROM contas WHERE is_cora_account = true
)
SELECT 
  origem, 
  valor,
  CASE 
    WHEN valor = (SELECT get_saldo_atual_cora()) THEN '✅ CONSISTENTE'
    ELSE '❌ INCONSISTENTE'
  END as status
FROM todos_saldos
ORDER BY origem;