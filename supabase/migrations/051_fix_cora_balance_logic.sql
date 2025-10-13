-- Migração 051: Corrigir lógica de cálculo do saldo da conta Cora
-- O saldo deve considerar: Total recebido - Valores em aberto de fornecedores

-- 1. Função para calcular saldo disponível da conta Cora (considerando valores em aberto)
CREATE OR REPLACE FUNCTION calcular_saldo_disponivel_cora(p_conta_id UUID)
RETURNS DECIMAL(14,2) AS $$
DECLARE
    v_total_entradas DECIMAL(14,2) := 0;
    v_total_pagamentos DECIMAL(14,2) := 0;
    v_total_aberto_fornecedores DECIMAL(14,2) := 0;
    v_saldo_disponivel DECIMAL(14,2);
BEGIN
    -- Somar todas as entradas da conta
    SELECT COALESCE(SUM(valor), 0) INTO v_total_entradas
    FROM entradas 
    WHERE conta_id = p_conta_id;
    
    -- Somar todos os pagamentos já feitos pela conta
    SELECT COALESCE(SUM(valor_pago), 0) INTO v_total_pagamentos
    FROM pagamentos_fornecedores 
    WHERE conta_id = p_conta_id;
    
    -- Somar todos os valores em aberto de fornecedores (que ainda precisam ser pagos)
    SELECT COALESCE(SUM(saldo_aberto), 0) INTO v_total_aberto_fornecedores
    FROM compras 
    WHERE status IN ('Aberta', 'Parcial') 
    AND saldo_aberto > 0;
    
    -- Calcular saldo disponível: Total recebido - Valores em aberto
    -- (Não subtraímos os pagamentos já feitos pois eles já foram descontados do saldo_atual)
    v_saldo_disponivel := v_total_entradas - v_total_pagamentos - v_total_aberto_fornecedores;
    
    RETURN v_saldo_disponivel;
END;
$$ LANGUAGE plpgsql;

-- 2. Atualizar função validate_account_balance para usar a nova lógica
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
    
    -- Calcular saldo atual (entradas - pagamentos)
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

-- 3. Função para buscar informações completas da conta Cora
CREATE OR REPLACE FUNCTION get_conta_cora_info()
RETURNS JSON AS $$
DECLARE
    v_conta RECORD;
    v_saldo_atual DECIMAL(14,2);
    v_total_entradas DECIMAL(14,2);
    v_total_pagamentos DECIMAL(14,2);
    v_total_abatimentos DECIMAL(14,2);
    v_total_aberto DECIMAL(14,2);
    v_saldo_disponivel DECIMAL(14,2);
BEGIN
    -- Buscar conta Cora
    SELECT * INTO v_conta FROM contas WHERE is_cora_account = true AND ativa = true LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Conta Cora não encontrada'
        );
    END IF;
    
    -- Calcular totais
    SELECT COALESCE(SUM(valor), 0) INTO v_total_entradas
    FROM entradas WHERE conta_id = v_conta.id;
    
    SELECT COALESCE(SUM(valor_pago), 0) INTO v_total_pagamentos
    FROM pagamentos_fornecedores WHERE conta_id = v_conta.id;
    
    -- Incluir abatimentos pré-saldo no cálculo
    SELECT COALESCE(SUM(valor), 0) INTO v_total_abatimentos
    FROM abatimentos_pre_saldo;
    
    SELECT COALESCE(SUM(saldo_aberto), 0) INTO v_total_aberto
    FROM compras WHERE status IN ('Aberta', 'Parcial') AND saldo_aberto > 0;
    
    -- Saldo atual = Entradas - Pagamentos - Abatimentos
    v_saldo_atual := v_total_entradas - v_total_pagamentos - v_total_abatimentos;
    -- Saldo disponível = Saldo atual - Valores em aberto
    v_saldo_disponivel := v_saldo_atual - v_total_aberto;
    
    -- Atualizar saldo na tabela
    UPDATE contas SET saldo_atual = v_saldo_atual WHERE id = v_conta.id;
    
    RETURN json_build_object(
        'success', true,
        'conta_id', v_conta.id,
        'conta_nome', v_conta.nome,
        'saldo_atual', v_saldo_atual,
        'saldo_disponivel', v_saldo_disponivel,
        'total_entradas', v_total_entradas,
        'total_pagamentos', v_total_pagamentos,
        'total_abatimentos', v_total_abatimentos,
        'total_aberto_fornecedores', v_total_aberto
    );
END;
$$ LANGUAGE plpgsql;

-- 4. Conceder permissões
GRANT EXECUTE ON FUNCTION calcular_saldo_disponivel_cora TO authenticated;
GRANT EXECUTE ON FUNCTION get_conta_cora_info TO authenticated;

-- 5. Comentários para documentação
COMMENT ON FUNCTION calcular_saldo_disponivel_cora IS 'Calcula o saldo disponível da conta Cora considerando valores em aberto de fornecedores';
COMMENT ON FUNCTION get_conta_cora_info IS 'Retorna informações completas da conta Cora incluindo saldo atual e disponível';