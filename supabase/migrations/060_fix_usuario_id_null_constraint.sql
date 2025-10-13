-- Migration: Fix usuario_id NULL constraint violation
-- Problema: auth.uid() pode estar retornando NULL durante a execução da função
-- Solução: Adicionar validação e fallback para garantir que usuario_id nunca seja NULL

-- Recriar a função process_pagamento_total com validação de auth.uid()
CREATE OR REPLACE FUNCTION process_pagamento_total(
    p_compra_id UUID,
    p_foi_pago BOOLEAN DEFAULT true
) RETURNS JSON AS $$
DECLARE
    v_compra RECORD;
    v_conta_cora RECORD;
    v_valor_a_pagar NUMERIC;
    v_pagamento_id UUID;
    v_current_user_id UUID;
BEGIN
    -- CRÍTICO: Verificar se o usuário está autenticado
    v_current_user_id := auth.uid();
    
    IF v_current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado - auth.uid() retornou NULL',
            'code', 'AUTH_REQUIRED'
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
    
    -- Processar pagamento - GARANTINDO que usuario_id não seja NULL
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
        v_current_user_id  -- Usar variável validada em vez de auth.uid() direto
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
        'usuario_id', v_current_user_id
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false, 
        'error', SQLERRM,
        'code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário explicativo
COMMENT ON FUNCTION process_pagamento_total IS 'Função corrigida para garantir que usuario_id nunca seja NULL - validação de auth.uid() adicionada';