-- Forçar drop das funções existentes e recriar com status corretos
-- A constraint permite apenas: 'Aberta', 'Parcial', 'Quitada'
-- Mas as funções estavam usando: 'pago', 'pendente'

-- Dropar todas as versões das funções
DROP FUNCTION IF EXISTS process_pagamento_total CASCADE;
DROP FUNCTION IF EXISTS process_pagamento_parcial CASCADE;

-- Recriar process_pagamento_total com status correto
CREATE FUNCTION process_pagamento_total(
    p_compra_id UUID,
    p_user_id UUID,
    p_foi_pago BOOLEAN DEFAULT true
) RETURNS JSON AS $$
DECLARE
    v_compra RECORD;
    v_conta_cora RECORD;
    v_pagamento_id UUID;
    v_valor_a_pagar NUMERIC;
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
    SELECT * INTO v_compra FROM compras WHERE id = p_compra_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Compra não encontrada'
        );
    END IF;
    
    -- Calcular valor a pagar (saldo restante)
    v_valor_a_pagar := COALESCE(v_compra.saldo_aberto, v_compra.valor_total - COALESCE(v_compra.valor_pago, 0));
    
    -- Verificar se já está quitada
    IF v_valor_a_pagar <= 0 THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Compra já está quitada'
        );
    END IF;
    
    -- Buscar conta Cora
    SELECT * INTO v_conta_cora FROM contas WHERE is_cora_account = true LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Conta Cora não encontrada'
        );
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
    
    -- Processar pagamento
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
        COALESCE(v_compra.saldo_aberto, 0), 
        0,
        NOW(), 
        'Pagamento total automático via Cora', 
        p_user_id
    ) RETURNING id INTO v_pagamento_id;
    
    -- Atualizar saldo da compra com status CORRETO
    UPDATE compras 
    SET valor_pago = COALESCE(valor_pago, 0) + v_valor_a_pagar, 
        saldo_aberto = 0, 
        status = 'Quitada'  -- CORRIGIDO: usar 'Quitada' em vez de 'pago'
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

-- Recriar process_pagamento_parcial com status correto
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
    SELECT * INTO v_compra FROM compras WHERE id = p_compra_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Compra não encontrada'
        );
    END IF;
    
    -- Verificar se valor é válido
    IF p_valor_pagamento > COALESCE(v_compra.saldo_aberto, v_compra.valor_total - COALESCE(v_compra.valor_pago, 0)) THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Valor de pagamento maior que saldo devedor',
            'saldo_devedor', COALESCE(v_compra.saldo_aberto, v_compra.valor_total - COALESCE(v_compra.valor_pago, 0))
        );
    END IF;
    
    -- Buscar conta Cora
    SELECT * INTO v_conta_cora FROM contas WHERE is_cora_account = true LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Conta Cora não encontrada'
        );
    END IF;
    
    -- Validar saldo suficiente
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
    
    -- Atualizar saldo da compra com status CORRETO
    UPDATE compras 
    SET valor_pago = COALESCE(valor_pago, 0) + p_valor_pagamento, 
        saldo_aberto = COALESCE(saldo_aberto, 0) - p_valor_pagamento,
        status = CASE 
            WHEN (COALESCE(saldo_aberto, 0) - p_valor_pagamento) <= 0 THEN 'Quitada'  -- CORRIGIDO: usar 'Quitada' em vez de 'pago'
            ELSE 'Parcial'  -- CORRIGIDO: usar 'Parcial' em vez de 'pendente'
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

-- Comentários para documentação
COMMENT ON FUNCTION process_pagamento_total IS 'Função corrigida para usar status válidos da constraint: Quitada em vez de pago';
COMMENT ON FUNCTION process_pagamento_parcial IS 'Função corrigida para usar status válidos da constraint: Quitada/Parcial em vez de pago/pendente';