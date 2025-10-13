-- Migração 053: Corrigir função calcular_saldo_conta para incluir abatimentos pré-saldo
-- PROBLEMA: A função não estava considerando abatimentos, causando inconsistência entre página Contas e modal

-- Corrigir função calcular_saldo_conta para incluir abatimentos pré-saldo
CREATE OR REPLACE FUNCTION calcular_saldo_conta(p_conta_id UUID)
RETURNS DECIMAL(14,2) AS $$
DECLARE
    v_total_entradas DECIMAL(14,2) := 0;
    v_total_pagamentos DECIMAL(14,2) := 0;
    v_total_abatimentos DECIMAL(14,2) := 0;
    v_saldo_atual DECIMAL(14,2);
BEGIN
    -- Somar todas as entradas da conta
    SELECT COALESCE(SUM(valor), 0) INTO v_total_entradas
    FROM entradas 
    WHERE conta_id = p_conta_id;
    
    -- Somar todos os pagamentos feitos pela conta
    SELECT COALESCE(SUM(valor_pago), 0) INTO v_total_pagamentos
    FROM pagamentos_fornecedores 
    WHERE conta_id = p_conta_id;
    
    -- CORREÇÃO: Incluir abatimentos pré-saldo no cálculo
    -- (Apenas para conta Cora, pois abatimentos são sempre da conta Cora)
    SELECT is_cora_account INTO v_saldo_atual FROM contas WHERE id = p_conta_id;
    
    IF v_saldo_atual = true THEN
        SELECT COALESCE(SUM(valor), 0) INTO v_total_abatimentos
        FROM abatimentos_pre_saldo;
    END IF;
    
    -- Calcular saldo atual: entradas - pagamentos - abatimentos
    v_saldo_atual := v_total_entradas - v_total_pagamentos - v_total_abatimentos;
    
    RETURN v_saldo_atual;
END;
$$ LANGUAGE plpgsql;

-- Atualizar função validate_account_balance para usar o cálculo corrigido
CREATE OR REPLACE FUNCTION validate_account_balance(
    p_conta_id UUID,
    p_valor_solicitado DECIMAL
) RETURNS JSON AS $$
DECLARE
    v_conta RECORD;
    v_saldo_atual DECIMAL(14,2);
    v_saldo_disponivel DECIMAL(14,2);
    v_total_aberto DECIMAL(14,2) := 0;
BEGIN
    -- Buscar conta
    SELECT * INTO v_conta FROM contas WHERE id = p_conta_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Conta não encontrada'
        );
    END IF;
    
    -- Calcular saldo atual (agora incluindo abatimentos)
    v_saldo_atual := calcular_saldo_conta(p_conta_id);
    
    -- Se for conta Cora, calcular saldo disponível considerando valores em aberto
    IF v_conta.is_cora_account = true THEN
        -- Somar valores em aberto de fornecedores
        SELECT COALESCE(SUM(saldo_aberto), 0) INTO v_total_aberto
        FROM compras 
        WHERE status IN ('Aberta', 'Parcial') 
        AND saldo_aberto > 0;
        
        -- Saldo disponível = Saldo atual - Valores em aberto
        v_saldo_disponivel := v_saldo_atual - v_total_aberto;
    ELSE
        -- Para outras contas, usar saldo atual
        v_saldo_disponivel := v_saldo_atual;
    END IF;
    
    -- Atualizar saldo na tabela para manter sincronizado
    UPDATE contas 
    SET saldo_atual = v_saldo_atual
    WHERE id = p_conta_id;
    
    RETURN json_build_object(
        'success', true,
        'conta_id', v_conta.id,
        'conta_nome', v_conta.nome,
        'saldo_atual', v_saldo_atual,
        'saldo_disponivel', v_saldo_disponivel,
        'total_aberto_fornecedores', v_total_aberto,
        'valor_solicitado', p_valor_solicitado,
        'pode_processar', v_saldo_disponivel >= p_valor_solicitado,
        'diferenca', v_saldo_disponivel - p_valor_solicitado
    );
END;
$$ LANGUAGE plpgsql;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION calcular_saldo_conta TO authenticated;
GRANT EXECUTE ON FUNCTION validate_account_balance TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION calcular_saldo_conta IS 'Calcula o saldo atual de uma conta baseado em entradas, pagamentos E abatimentos pré-saldo (para conta Cora) - CORRIGIDO';