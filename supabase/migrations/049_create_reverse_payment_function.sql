-- Função para reverter pagamentos de fornecedores
-- Esta função remove todos os pagamentos de uma compra específica e restaura os saldos

CREATE OR REPLACE FUNCTION reverse_payment_fornecedor(
    p_compra_id UUID
) RETURNS JSON AS $$
DECLARE
    v_compra RECORD;
    v_pagamento RECORD;
    v_total_revertido DECIMAL(10,2) := 0;
    v_count_pagamentos INTEGER := 0;
BEGIN
    -- Buscar dados da compra
    SELECT * INTO v_compra FROM compras WHERE id = p_compra_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Compra não encontrada');
    END IF;
    
    -- Verificar se há pagamentos para reverter
    SELECT COUNT(*) INTO v_count_pagamentos 
    FROM pagamentos_fornecedores 
    WHERE compra_id = p_compra_id;
    
    IF v_count_pagamentos = 0 THEN
        RETURN json_build_object('success', false, 'error', 'Não há pagamentos para reverter');
    END IF;
    
    -- Reverter cada pagamento (restaurar saldo das contas)
    FOR v_pagamento IN 
        SELECT * FROM pagamentos_fornecedores WHERE compra_id = p_compra_id
    LOOP
        -- Restaurar saldo da conta
        UPDATE contas 
        SET saldo_atual = saldo_atual + v_pagamento.valor_pago
        WHERE id = v_pagamento.conta_id;
        
        v_total_revertido := v_total_revertido + v_pagamento.valor_pago;
    END LOOP;
    
    -- Deletar todos os pagamentos da compra
    DELETE FROM pagamentos_fornecedores WHERE compra_id = p_compra_id;
    
    -- Restaurar status da compra
    UPDATE compras 
    SET 
        valor_pago = 0,
        saldo_aberto = valor_total,
        status = 'Aberta'
    WHERE id = p_compra_id;
    
    RETURN json_build_object(
        'success', true,
        'compra_id', p_compra_id,
        'total_revertido', v_total_revertido,
        'pagamentos_removidos', v_count_pagamentos,
        'novo_status', 'Aberta'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Erro ao reverter pagamento: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION reverse_payment_fornecedor TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION reverse_payment_fornecedor IS 'Reverte todos os pagamentos de uma compra específica, restaurando saldos das contas e status da compra';