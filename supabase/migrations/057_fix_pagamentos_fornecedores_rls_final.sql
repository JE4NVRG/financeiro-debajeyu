-- Corrigir RLS policy violation na tabela pagamentos_fornecedores
-- O problema é que a função process_pagamento_total não está incluindo usuario_id

-- Atualizar função process_pagamento_total para incluir usuario_id
CREATE OR REPLACE FUNCTION process_pagamento_total(
    p_compra_id UUID,
    p_foi_pago BOOLEAN DEFAULT TRUE
) RETURNS JSON AS $$
DECLARE
    v_compra RECORD;
    v_conta_cora RECORD;
    v_pagamento_id UUID;
    v_result JSON;
BEGIN
    -- Buscar dados da compra
    SELECT * INTO v_compra FROM compras WHERE id = p_compra_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Compra não encontrada');
    END IF;
    
    -- Verificar se já está paga
    IF v_compra.saldo_aberto <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Compra já está quitada');
    END IF;
    
    -- Buscar conta Cora
    SELECT * INTO v_conta_cora FROM contas WHERE is_cora_account = true LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Conta Cora não encontrada');
    END IF;
    
    -- Validar saldo suficiente
    IF v_conta_cora.saldo_atual < v_compra.saldo_aberto THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Saldo insuficiente na conta Cora',
            'valor_necessario', v_compra.saldo_aberto
        );
    END IF;
    
    -- Processar pagamento - INCLUINDO usuario_id para satisfazer RLS policy
    INSERT INTO pagamentos_fornecedores (
        compra_id, conta_id, valor_pago, tipo_pagamento, 
        foi_pago_automatico, saldo_anterior, saldo_posterior,
        data_pagamento, observacao, usuario_id
    ) VALUES (
        p_compra_id, v_conta_cora.id, v_compra.saldo_aberto, 'total',
        p_foi_pago, v_compra.saldo_aberto, 0,
        NOW(), 'Pagamento total automático via Cora', auth.uid()
    ) RETURNING id INTO v_pagamento_id;
    
    -- Atualizar saldo da compra
    UPDATE compras 
    SET valor_pago = valor_total, saldo_aberto = 0, status = 'pago'
    WHERE id = p_compra_id;
    
    -- Atualizar saldo da conta
    UPDATE contas 
    SET saldo_atual = saldo_atual - v_compra.saldo_aberto
    WHERE id = v_conta_cora.id;
    
    RETURN json_build_object(
        'success', true,
        'pagamento_id', v_pagamento_id,
        'valor_pago', v_compra.saldo_aberto,
        'novo_saldo_conta', v_conta_cora.saldo_atual - v_compra.saldo_aberto,
        'fornecedor_id', v_compra.fornecedor_id
    );
END;
$$ LANGUAGE plpgsql;

-- Atualizar função process_pagamento_parcial para incluir usuario_id também
CREATE OR REPLACE FUNCTION process_pagamento_parcial(
    p_compra_id UUID,
    p_conta_id UUID,
    p_valor_pago DECIMAL,
    p_observacao TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_compra RECORD;
    v_conta RECORD;
    v_pagamento_id UUID;
    v_novo_saldo_compra DECIMAL(10,2);
    v_novo_status VARCHAR(20);
BEGIN
    -- Buscar dados da compra
    SELECT * INTO v_compra FROM compras WHERE id = p_compra_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Compra não encontrada');
    END IF;
    
    -- Verificar se valor é válido
    IF p_valor_pago <= 0 OR p_valor_pago > v_compra.saldo_aberto THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Valor de pagamento inválido',
            'valor_maximo', v_compra.saldo_aberto
        );
    END IF;
    
    -- Buscar dados da conta
    SELECT * INTO v_conta FROM contas WHERE id = p_conta_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Conta não encontrada');
    END IF;
    
    -- Validar saldo suficiente
    IF v_conta.saldo_atual < p_valor_pago THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Saldo insuficiente na conta',
            'saldo_disponivel', v_conta.saldo_atual
        );
    END IF;
    
    -- Calcular novo saldo da compra
    v_novo_saldo_compra := v_compra.saldo_aberto - p_valor_pago;
    v_novo_status := CASE WHEN v_novo_saldo_compra <= 0 THEN 'pago' ELSE 'parcial' END;
    
    -- Processar pagamento - INCLUINDO usuario_id para satisfazer RLS policy
    INSERT INTO pagamentos_fornecedores (
        compra_id, conta_id, valor_pago, tipo_pagamento, 
        foi_pago_automatico, saldo_anterior, saldo_posterior,
        data_pagamento, observacao, usuario_id
    ) VALUES (
        p_compra_id, p_conta_id, p_valor_pago, 'parcial',
        false, v_compra.saldo_aberto, v_novo_saldo_compra,
        NOW(), COALESCE(p_observacao, 'Pagamento parcial'), auth.uid()
    ) RETURNING id INTO v_pagamento_id;
    
    -- Atualizar saldo da compra
    UPDATE compras 
    SET valor_pago = valor_pago + p_valor_pago, 
        saldo_aberto = v_novo_saldo_compra, 
        status = v_novo_status
    WHERE id = p_compra_id;
    
    -- Atualizar saldo da conta
    UPDATE contas 
    SET saldo_atual = saldo_atual - p_valor_pago
    WHERE id = p_conta_id;
    
    RETURN json_build_object(
        'success', true,
        'pagamento_id', v_pagamento_id,
        'valor_pago', p_valor_pago,
        'novo_saldo_compra', v_novo_saldo_compra,
        'novo_saldo_conta', v_conta.saldo_atual - p_valor_pago,
        'status_compra', v_novo_status
    );
END;
$$ LANGUAGE plpgsql;

-- Comentário para documentação
COMMENT ON FUNCTION process_pagamento_total IS 'Processa pagamento total automático com desconto da conta Cora - CORRIGIDO para incluir usuario_id';
COMMENT ON FUNCTION process_pagamento_parcial IS 'Processa pagamento parcial customizado com validações - CORRIGIDO para incluir usuario_id';