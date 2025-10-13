-- Migração 054: Corrigir erro de tipo de dados na função calcular_saldo_conta
-- PROBLEMA: Variável v_saldo_atual sendo usada para armazenar boolean is_cora_account

-- Corrigir função calcular_saldo_conta com variável separada para boolean
CREATE OR REPLACE FUNCTION calcular_saldo_conta(p_conta_id UUID)
RETURNS DECIMAL(14,2) AS $$
DECLARE
    v_total_entradas DECIMAL(14,2) := 0;
    v_total_pagamentos DECIMAL(14,2) := 0;
    v_total_abatimentos DECIMAL(14,2) := 0;
    v_saldo_atual DECIMAL(14,2);
    v_is_cora_account BOOLEAN := false; -- Variável separada para o boolean
BEGIN
    -- Somar todas as entradas da conta
    SELECT COALESCE(SUM(valor), 0) INTO v_total_entradas
    FROM entradas 
    WHERE conta_id = p_conta_id;
    
    -- Somar todos os pagamentos feitos pela conta
    SELECT COALESCE(SUM(valor_pago), 0) INTO v_total_pagamentos
    FROM pagamentos_fornecedores 
    WHERE conta_id = p_conta_id;
    
    -- CORREÇÃO: Usar variável separada para verificar se é conta Cora
    SELECT is_cora_account INTO v_is_cora_account FROM contas WHERE id = p_conta_id;
    
    IF v_is_cora_account = true THEN
        SELECT COALESCE(SUM(valor), 0) INTO v_total_abatimentos
        FROM abatimentos_pre_saldo;
    END IF;
    
    -- Calcular saldo atual: entradas - pagamentos - abatimentos
    v_saldo_atual := v_total_entradas - v_total_pagamentos - v_total_abatimentos;
    
    RETURN v_saldo_atual;
END;
$$ LANGUAGE plpgsql;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION calcular_saldo_conta TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION calcular_saldo_conta IS 'Calcula o saldo atual de uma conta baseado em entradas, pagamentos E abatimentos pré-saldo (para conta Cora) - ERRO DE TIPO CORRIGIDO';