-- Migração 055: Padronizar TODAS as funções de cálculo do saldo da conta Cora
-- Usar a mesma lógica da página Contas que está mostrando o valor correto (R$ 32.625,63)

-- 1. Corrigir função get_conta_cora_info() para usar a lógica correta
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
    
    -- USAR A MESMA LÓGICA DA PÁGINA CONTAS (que está correta)
    SELECT COALESCE(SUM(valor), 0) INTO v_total_entradas
    FROM entradas WHERE conta_id = v_conta.id;
    
    SELECT COALESCE(SUM(valor_pago), 0) INTO v_total_pagamentos
    FROM pagamentos_fornecedores WHERE conta_id = v_conta.id;
    
    SELECT COALESCE(SUM(valor), 0) INTO v_total_abatimentos
    FROM abatimentos_pre_saldo;
    
    -- Saldo atual = Entradas - Pagamentos - Abatimentos (LÓGICA DA PÁGINA CONTAS)
    v_saldo_atual := v_total_entradas - v_total_pagamentos - v_total_abatimentos;
    
    -- Para saldo disponível, subtrair valores em aberto de fornecedores
    SELECT COALESCE(SUM(saldo_aberto), 0) INTO v_total_aberto
    FROM compras WHERE status IN ('Aberta', 'Parcial') AND saldo_aberto > 0;
    
    v_saldo_disponivel := v_saldo_atual - v_total_aberto;
    
    -- Atualizar saldo na tabela para manter sincronizado
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

-- 2. Corrigir função calcular_saldo_conta() para usar a mesma lógica
CREATE OR REPLACE FUNCTION calcular_saldo_conta(p_conta_id UUID)
RETURNS DECIMAL(14,2) AS $$
DECLARE
    v_is_cora_account BOOLEAN;
    v_saldo_atual DECIMAL(14,2);
    v_total_entradas DECIMAL(14,2) := 0;
    v_total_pagamentos DECIMAL(14,2) := 0;
    v_total_abatimentos DECIMAL(14,2) := 0;
BEGIN
    -- Verificar se é conta Cora
    SELECT is_cora_account INTO v_is_cora_account 
    FROM contas WHERE id = p_conta_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- USAR A MESMA LÓGICA DA PÁGINA CONTAS (que está correta)
    SELECT COALESCE(SUM(valor), 0) INTO v_total_entradas
    FROM entradas WHERE conta_id = p_conta_id;
    
    SELECT COALESCE(SUM(valor_pago), 0) INTO v_total_pagamentos
    FROM pagamentos_fornecedores WHERE conta_id = p_conta_id;
    
    -- Se for conta Cora, incluir abatimentos pré-saldo
    IF v_is_cora_account = true THEN
        SELECT COALESCE(SUM(valor), 0) INTO v_total_abatimentos
        FROM abatimentos_pre_saldo;
    END IF;
    
    -- Saldo atual = Entradas - Pagamentos - Abatimentos (LÓGICA DA PÁGINA CONTAS)
    v_saldo_atual := v_total_entradas - v_total_pagamentos - v_total_abatimentos;
    
    -- Atualizar saldo na tabela para manter sincronizado
    UPDATE contas SET saldo_atual = v_saldo_atual WHERE id = p_conta_id;
    
    RETURN v_saldo_atual;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar função específica para buscar saldo atual da conta Cora (para o hook)
CREATE OR REPLACE FUNCTION get_saldo_atual_cora()
RETURNS DECIMAL(14,2) AS $$
DECLARE
    v_conta_id UUID;
    v_saldo_atual DECIMAL(14,2);
BEGIN
    -- Buscar ID da conta Cora
    SELECT id INTO v_conta_id FROM contas WHERE is_cora_account = true AND ativa = true LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Usar a função calcular_saldo_conta que agora está padronizada
    v_saldo_atual := calcular_saldo_conta(v_conta_id);
    
    RETURN v_saldo_atual;
END;
$$ LANGUAGE plpgsql;

-- 4. Conceder permissões
GRANT EXECUTE ON FUNCTION get_conta_cora_info TO authenticated;
GRANT EXECUTE ON FUNCTION calcular_saldo_conta TO authenticated;
GRANT EXECUTE ON FUNCTION get_saldo_atual_cora TO authenticated;

-- 5. Comentários para documentação
COMMENT ON FUNCTION get_conta_cora_info IS 'Retorna informações completas da conta Cora - PADRONIZADO com lógica da página Contas';
COMMENT ON FUNCTION calcular_saldo_conta IS 'Calcula o saldo atual de uma conta - PADRONIZADO com lógica da página Contas';
COMMENT ON FUNCTION get_saldo_atual_cora IS 'Retorna apenas o saldo atual da conta Cora - PADRONIZADO com lógica da página Contas';