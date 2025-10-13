-- Debug completo: Comparar TODAS as funções que calculam saldo da conta Cora
-- Objetivo: Identificar qual função está retornando o valor correto (R$ 32.625,63)

-- 1. Verificar dados básicos da conta Cora
SELECT 'DADOS BÁSICOS DA CONTA CORA:' as debug_step;
SELECT id, nome, saldo_atual, is_cora_account FROM contas WHERE is_cora_account = true;

-- 2. Função get_conta_cora_info() - usada no Dashboard via useTotais
SELECT 'FUNÇÃO GET_CONTA_CORA_INFO (Dashboard):' as debug_step;
SELECT get_conta_cora_info();

-- 3. Função calcular_saldo_conta() - usada no Modal de pagamento
SELECT 'FUNÇÃO CALCULAR_SALDO_CONTA (Modal):' as debug_step;
SELECT calcular_saldo_conta((SELECT id FROM contas WHERE is_cora_account = true LIMIT 1)) as saldo_modal;

-- 4. Cálculo da página Contas (JavaScript) - simulação em SQL
SELECT 'CÁLCULO DA PÁGINA CONTAS (JavaScript simulado):' as debug_step;
WITH cora_data AS (
  SELECT id FROM contas WHERE is_cora_account = true LIMIT 1
),
totals AS (
  SELECT 
    COALESCE(SUM(e.valor), 0) as total_recebido,
    COALESCE(SUM(pf.valor_pago), 0) as total_pagamentos,
    COALESCE(SUM(aps.valor), 0) as total_abatimentos
  FROM cora_data cd
  LEFT JOIN entradas e ON e.conta_id = cd.id
  LEFT JOIN pagamentos_fornecedores pf ON pf.conta_id = cd.id
  LEFT JOIN abatimentos_pre_saldo aps ON true
)
SELECT 
  total_recebido,
  total_pagamentos,
  total_abatimentos,
  (total_recebido - total_pagamentos - total_abatimentos) as saldo_pagina_contas
FROM totals;

-- 5. Verificar saldo_atual direto da tabela (usado no hook usePagamentoRapido)
SELECT 'SALDO DIRETO DA TABELA (Hook):' as debug_step;
SELECT saldo_atual as saldo_hook FROM contas WHERE is_cora_account = true;

-- 6. Comparação final
SELECT 'COMPARAÇÃO FINAL:' as debug_step;
WITH comparacao AS (
  SELECT 
    'Dashboard (get_conta_cora_info)' as origem,
    (get_conta_cora_info()->>'saldo_disponivel')::decimal as valor
  UNION ALL
  SELECT 
    'Modal (calcular_saldo_conta)' as origem,
    calcular_saldo_conta((SELECT id FROM contas WHERE is_cora_account = true LIMIT 1)) as valor
  UNION ALL
  SELECT 
    'Hook (saldo_atual direto)' as origem,
    saldo_atual as valor
  FROM contas WHERE is_cora_account = true
  UNION ALL
  SELECT 
    'Página Contas (cálculo manual)' as origem,
    (
      COALESCE((SELECT SUM(valor) FROM entradas WHERE conta_id = (SELECT id FROM contas WHERE is_cora_account = true)), 0) -
      COALESCE((SELECT SUM(valor_pago) FROM pagamentos_fornecedores WHERE conta_id = (SELECT id FROM contas WHERE is_cora_account = true)), 0) -
      COALESCE((SELECT SUM(valor) FROM abatimentos_pre_saldo), 0)
    ) as valor
)
SELECT origem, valor, 
       CASE 
         WHEN valor = 32625.63 THEN '✅ CORRETO'
         ELSE '❌ INCORRETO'
       END as status
FROM comparacao
ORDER BY valor DESC;