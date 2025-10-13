-- Migration: Force drop all pagamento functions and recreate
-- Problema: Múltiplas versões das funções existem, precisamos dropar todas

-- Dropar todas as versões das funções
DROP FUNCTION IF EXISTS process_pagamento_total(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS process_pagamento_total(UUID, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS process_pagamento_parcial(UUID, NUMERIC, BOOLEAN);
DROP FUNCTION IF EXISTS process_pagamento_parcial(UUID, NUMERIC, UUID, BOOLEAN);

-- Recriar a função process_pagamento_total com user_id
CREATE FUNCTION process_pagamento_total(
    p_compra_id UUID,
    p_user_id UUID,
    p_foi_pago BOOLEAN DEFAULT true
) RETURNS JSON AS $$
DECLARE
    v_compra RECORD;
    v_conta_cora RECORD;
    v_valor_a_pagar NUMERIC;
    v_pagamento_id UUID;
BEGIN
    -- Validar se user_id foi fornecido
    IF p_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'user_id é obrigatório',
            'code', 'USER_ID_REQUIRED'
        );
    END IF;
    
    -- Buscar dados da compra
    SELECT * INTO v_compra 
    FROM compras 
    WHERE id = p_compra_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Compra não encontrada'
        );
    END IF;
    
    -- Calcular valor a pagar com validação robusta
    v_valor_a_pagar := COALESCE(v_compra.saldo_aberto, v_compra.valor_total - COALESCE(v_compra.valor_pago, 0));
    
    -- Validar se há valor a pagar
    IF v_valor_a_pagar <= 0 THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Não há valor a pagar para esta compra'
        );
    END IF;
    
    -- Buscar conta Cora
    SELECT * INTO v_conta_cora 
    FROM contas 
    WHERE nome = 'Cora' 
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Conta Cora não encontrada'
        );
    END IF;
    
    -- Verificar saldo suficiente
    IF COALESCE(v_conta_cora.saldo_atual, 0) < v_valor_a_pagar THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Saldo insuficiente na conta Cora',
            'valor_necessario', v_valor_a_pagar,
            'saldo_disponivel', COALESCE(v_conta_cora.saldo_atual, 0)
        );
    END IF;
    
    -- Processar pagamento - usando user_id fornecido como parâmetro
    INSERT INTO pagamentos_fornecedores (
        compra_id, conta_id, valor_pago, tipo_pagamento, 
        foi_pago_automatico, saldo_anterior, saldo_posterior,
        data_pagamento, observacao, usuario_id
    ) VALUES (
        p_compra_id, 
        v_conta_cora.id, 
        v_valor_a_pagar,
        'total',
        p_foi_pago, 
        COALESCE(v_compra.saldo_aberto, v_valor_a_pagar), 
        0,
        NOW(), 
        'Pagamento total automático via Cora', 
        p_user_id
    ) RETURNING id INTO v_pagamento_id;
    
    -- Atualizar saldo da compra
    UPDATE compras 
    SET valor_pago = COALESCE(valor_pago, 0) + v_valor_a_pagar, 
        saldo_aberto = 0, 
        status = 'pago'
    WHERE id = p_compra_id;
    
    -- Atualizar saldo da conta
    UPDATE contas 
    SET saldo_atual = saldo_atual - v_valor_a_pagar 
    WHERE id = v_conta_cora.id;
    
    RETURN json_build_object(
        'success', true, 
        'pagamento_id', v_pagamento_id,
        'valor_pago', v_valor_a_pagar,
        'usuario_id', p_user_id
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false, 
        'error', SQLERRM,
        'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar process_pagamento_parcial
CREATE FUNCTION process_pagamento_parcial(
    p_compra_id UUID,
    p_valor_pagamento NUMERIC,
    p_user_id UUID,
    p_foi_pago BOOLEAN DEFAULT true
) RETURNS JSON AS $$
DECLARE
    v_compra RECORD;
    v_conta_cora RECORD;
    v_pagamento_id UUID;
BEGIN
    -- Validar se user_id foi fornecido
    IF p_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'user_id é obrigatório',
            'code', 'USER_ID_REQUIRED'
        );
    END IF;
    
    -- Validar valor do pagamento
    IF p_valor_pagamento <= 0 THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Valor do pagamento deve ser maior que zero'
        );
    END IF;
    
    -- Buscar dados da compra
    SELECT * INTO v_compra 
    FROM compras 
    WHERE id = p_compra_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Compra não encontrada'
        );
    END IF;
    
    -- Verificar se o valor não excede o saldo aberto
    IF p_valor_pagamento > COALESCE(v_compra.saldo_aberto, 0) THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Valor do pagamento excede o saldo aberto da compra',
            'saldo_aberto', COALESCE(v_compra.saldo_aberto, 0),
            'valor_solicitado', p_valor_pagamento
        );
    END IF;
    
    -- Buscar conta Cora
    SELECT * INTO v_conta_cora 
    FROM contas 
    WHERE nome = 'Cora' 
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Conta Cora não encontrada'
        );
    END IF;
    
    -- Verificar saldo suficiente
    IF COALESCE(v_conta_cora.saldo_atual, 0) < p_valor_pagamento THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Saldo insuficiente na conta Cora',
            'valor_necessario', p_valor_pagamento,
            'saldo_disponivel', COALESCE(v_conta_cora.saldo_atual, 0)
        );
    END IF;
    
    -- Processar pagamento parcial
    INSERT INTO pagamentos_fornecedores (
        compra_id, conta_id, valor_pago, tipo_pagamento, 
        foi_pago_automatico, saldo_anterior, saldo_posterior,
        data_pagamento, observacao, usuario_id
    ) VALUES (
        p_compra_id, 
        v_conta_cora.id, 
        p_valor_pagamento,
        'parcial',
        p_foi_pago, 
        COALESCE(v_compra.saldo_aberto, 0), 
        COALESCE(v_compra.saldo_aberto, 0) - p_valor_pagamento,
        NOW(), 
        'Pagamento parcial automático via Cora', 
        p_user_id
    ) RETURNING id INTO v_pagamento_id;
    
    -- Atualizar saldo da compra
    UPDATE compras 
    SET valor_pago = COALESCE(valor_pago, 0) + p_valor_pagamento, 
        saldo_aberto = COALESCE(saldo_aberto, 0) - p_valor_pagamento,
        status = CASE 
            WHEN (COALESCE(saldo_aberto, 0) - p_valor_pagamento) <= 0 THEN 'pago'
            ELSE 'pendente'
        END
    WHERE id = p_compra_id;
    
    -- Atualizar saldo da conta
    UPDATE contas 
    SET saldo_atual = saldo_atual - p_valor_pagamento 
    WHERE id = v_conta_cora.id;
    
    RETURN json_build_object(
        'success', true, 
        'pagamento_id', v_pagamento_id,
        'valor_pago', p_valor_pagamento,
        'usuario_id', p_user_id
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false, 
        'error', SQLERRM,
        'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;