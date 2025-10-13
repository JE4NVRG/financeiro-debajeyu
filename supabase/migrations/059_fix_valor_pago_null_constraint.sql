-- Corrigir problema de valor_pago NULL na função process_pagamento_total
-- O problema é que v_compra.saldo_aberto pode estar NULL ou zero

CREATE OR REPLACE FUNCTION process_pagamento_total(
    p_compra_id UUID,
    p_foi_pago BOOLEAN DEFAULT TRUE
) RETURNS JSON AS $$
DECLARE
    v_compra RECORD;
    v_conta_cora RECORD;
    v_pagamento_id UUID;
    v_valor_a_pagar DECIMAL(10,2);
    v_result JSON;
BEGIN
    -- Buscar dados da compra
    SELECT * INTO v_compra FROM compras WHERE id = p_compra_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Compra não encontrada');
    END IF;
    
    -- Calcular valor a pagar (garantir que não seja NULL)
    v_valor_a_pagar := COALESCE(v_compra.saldo_aberto, v_compra.valor_total - COALESCE(v_compra.valor_pago, 0));
    
    -- Verificar se há valor para pagar
    IF v_valor_a_pagar <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Compra já está quitada ou valor inválido');
    END IF;
    
    -- Buscar conta Cora
    SELECT * INTO v_conta_cora FROM contas WHERE is_cora_account = true LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Conta Cora não encontrada');
    END IF;
    
    -- Validar saldo suficiente
    IF COALESCE(v_conta_cora.saldo_atual, 0) < v_valor_a_pagar THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Saldo insuficiente na conta Cora',
            'valor_necessario', v_valor_a_pagar,
            'saldo_disponivel', COALESCE(v_conta_cora.saldo_atual, 0)
        );
    END IF;
    
    -- Processar pagamento - GARANTINDO que valor_pago não seja NULL
    INSERT INTO pagamentos_fornecedores (
        compra_id, conta_id, valor_pago, tipo_pagamento, 
        foi_pago_automatico, saldo_anterior, saldo_posterior,
        data_pagamento, observacao, usuario_id
    ) VALUES (
        p_compra_id, 
        v_conta_cora.id, 
        v_valor_a_pagar, -- Usar variável calculada que garante não ser NULL
        'total',
        p_foi_pago, 
        COALESCE(v_compra.saldo_aberto, v_valor_a_pagar), 
        0,
        NOW(), 
        'Pagamento total automático via Cora', 
        auth.uid()
    ) RETURNING id INTO v_pagamento_id;
    
    -- Atualizar saldo da compra
    UPDATE compras 
    SET valor_pago = COALESCE(valor_pago, 0) + v_valor_a_pagar, 
        saldo_aberto = 0, 
        status = 'pago'
    WHERE id = p_compra_id;
    
    -- Atualizar saldo da conta
    UPDATE contas 
    SET saldo_atual = COALESCE(saldo_atual, 0) - v_valor_a_pagar
    WHERE id = v_conta_cora.id;
    
    RETURN json_build_object(
        'success', true,
        'pagamento_id', v_pagamento_id,
        'valor_pago', v_valor_a_pagar,
        'novo_saldo_conta', COALESCE(v_conta_cora.saldo_atual, 0) - v_valor_a_pagar,
        'compra_id', p_compra_id
    );
END;
$$ LANGUAGE plpgsql;

-- Atualizar também a função process_pagamento_parcial para garantir consistência
CREATE OR REPLACE FUNCTION process_pagamento_parcial(
    p_compra_id UUID,
    p_conta_id UUID,
    p_valor_pago DECIMAL(10,2),
    p_observacao TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_compra RECORD;
    v_conta RECORD;
    v_pagamento_id UUID;
    v_novo_saldo_compra DECIMAL(10,2);
    v_novo_status VARCHAR(20);
    v_valor_validado DECIMAL(10,2);
BEGIN
    -- Validar valor de entrada (garantir que não seja NULL ou negativo)
    v_valor_validado := COALESCE(p_valor_pago, 0);
    
    IF v_valor_validado <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Valor de pagamento deve ser maior que zero');
    END IF;
    
    -- Buscar dados da compra
    SELECT * INTO v_compra FROM compras WHERE id = p_compra_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Compra não encontrada');
    END IF;
    
    -- Verificar se valor é válido
    IF v_valor_validado > COALESCE(v_compra.saldo_aberto, v_compra.valor_total - COALESCE(v_compra.valor_pago, 0)) THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Valor de pagamento inválido',
            'valor_maximo', COALESCE(v_compra.saldo_aberto, v_compra.valor_total - COALESCE(v_compra.valor_pago, 0))
        );
    END IF;
    
    -- Buscar dados da conta
    SELECT * INTO v_conta FROM contas WHERE id = p_conta_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Conta não encontrada');
    END IF;
    
    -- Validar saldo suficiente
    IF COALESCE(v_conta.saldo_atual, 0) < v_valor_validado THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Saldo insuficiente na conta',
            'saldo_disponivel', COALESCE(v_conta.saldo_atual, 0)
        );
    END IF;
    
    -- Calcular novo saldo da compra
    v_novo_saldo_compra := COALESCE(v_compra.saldo_aberto, v_compra.valor_total - COALESCE(v_compra.valor_pago, 0)) - v_valor_validado;
    v_novo_status := CASE WHEN v_novo_saldo_compra <= 0 THEN 'pago' ELSE 'parcial' END;
    
    -- Processar pagamento - GARANTINDO que valor_pago não seja NULL
    INSERT INTO pagamentos_fornecedores (
        compra_id, conta_id, valor_pago, tipo_pagamento, 
        foi_pago_automatico, saldo_anterior, saldo_posterior,
        data_pagamento, observacao, usuario_id
    ) VALUES (
        p_compra_id, 
        p_conta_id, 
        v_valor_validado, -- Usar valor validado que garante não ser NULL
        'parcial',
        false, 
        COALESCE(v_compra.saldo_aberto, v_compra.valor_total - COALESCE(v_compra.valor_pago, 0)), 
        v_novo_saldo_compra,
        NOW(), 
        COALESCE(p_observacao, 'Pagamento parcial'), 
        auth.uid()
    ) RETURNING id INTO v_pagamento_id;
    
    -- Atualizar saldo da compra
    UPDATE compras 
    SET valor_pago = COALESCE(valor_pago, 0) + v_valor_validado, 
        saldo_aberto = v_novo_saldo_compra, 
        status = v_novo_status
    WHERE id = p_compra_id;
    
    -- Atualizar saldo da conta
    UPDATE contas 
    SET saldo_atual = COALESCE(saldo_atual, 0) - v_valor_validado
    WHERE id = p_conta_id;
    
    RETURN json_build_object(
        'success', true,
        'pagamento_id', v_pagamento_id,
        'valor_pago', v_valor_validado,
        'novo_saldo_compra', v_novo_saldo_compra,
        'novo_saldo_conta', COALESCE(v_conta.saldo_atual, 0) - v_valor_validado,
        'status_compra', v_novo_status
    );
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON FUNCTION process_pagamento_total IS 'Processa pagamento total automático com desconto da conta Cora - CORRIGIDO para evitar valor_pago NULL';
COMMENT ON FUNCTION process_pagamento_parcial IS 'Processa pagamento parcial customizado com validações - CORRIGIDO para evitar valor_pago NULL';