-- Migração: Sistema de Pagamentos de Fornecedores Otimizado
-- Adiciona colunas para otimização e funções especializadas

-- Adicionar colunas necessárias na tabela compras
ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS saldo_aberto DECIMAL(10,2);

-- Atualizar saldo_aberto baseado no valor_total para compras existentes
UPDATE compras 
SET saldo_aberto = valor_total - COALESCE(valor_pago, 0)
WHERE saldo_aberto IS NULL;

-- Adicionar constraint para garantir consistência
ALTER TABLE compras 
ADD CONSTRAINT check_saldo_aberto CHECK (saldo_aberto >= 0);

-- Adicionar colunas para otimização na tabela pagamentos_fornecedores
ALTER TABLE pagamentos_fornecedores 
ADD COLUMN IF NOT EXISTS tipo_pagamento VARCHAR(20) DEFAULT 'parcial' CHECK (tipo_pagamento IN ('total', 'parcial')),
ADD COLUMN IF NOT EXISTS foi_pago_automatico BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS saldo_anterior DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS saldo_posterior DECIMAL(10,2);

-- Adicionar coluna is_cora_account na tabela contas se não existir
ALTER TABLE contas 
ADD COLUMN IF NOT EXISTS is_cora_account BOOLEAN DEFAULT FALSE;

-- Marcar a conta Cora existente
UPDATE contas 
SET is_cora_account = TRUE 
WHERE LOWER(nome) LIKE '%cora%' 
AND is_cora_account IS NOT TRUE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_fornecedores_tipo ON pagamentos_fornecedores(tipo_pagamento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_fornecedores_data ON pagamentos_fornecedores(data_pagamento DESC);
CREATE INDEX IF NOT EXISTS idx_compras_saldo_aberto ON compras(saldo_aberto) WHERE saldo_aberto > 0;
CREATE INDEX IF NOT EXISTS idx_contas_cora ON contas(is_cora_account) WHERE is_cora_account = TRUE;

-- Função para pagamento total automático
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
            'saldo_disponivel', v_conta_cora.saldo_atual,
            'valor_necessario', v_compra.saldo_aberto
        );
    END IF;
    
    -- Processar pagamento
    INSERT INTO pagamentos_fornecedores (
        compra_id, conta_id, valor_pago, tipo_pagamento, 
        foi_pago_automatico, saldo_anterior, saldo_posterior,
        data_pagamento, observacao
    ) VALUES (
        p_compra_id, v_conta_cora.id, v_compra.saldo_aberto, 'total',
        p_foi_pago, v_compra.saldo_aberto, 0,
        NOW(), 'Pagamento total automático via Cora'
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

-- Função para pagamento parcial
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
    v_novo_saldo_aberto DECIMAL;
BEGIN
    -- Buscar dados da compra
    SELECT * INTO v_compra FROM compras WHERE id = p_compra_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Compra não encontrada');
    END IF;
    
    -- Buscar conta
    SELECT * INTO v_conta FROM contas WHERE id = p_conta_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Conta não encontrada');
    END IF;
    
    -- Validações
    IF p_valor_pago <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Valor deve ser maior que zero');
    END IF;
    
    IF p_valor_pago > v_compra.saldo_aberto THEN
        RETURN json_build_object('success', false, 'error', 'Valor maior que saldo aberto');
    END IF;
    
    IF v_conta.saldo_atual < p_valor_pago THEN
        RETURN json_build_object('success', false, 'error', 'Saldo insuficiente na conta');
    END IF;
    
    -- Calcular novo saldo
    v_novo_saldo_aberto := v_compra.saldo_aberto - p_valor_pago;
    
    -- Processar pagamento
    INSERT INTO pagamentos_fornecedores (
        compra_id, conta_id, valor_pago, tipo_pagamento,
        saldo_anterior, saldo_posterior, data_pagamento, observacao
    ) VALUES (
        p_compra_id, p_conta_id, p_valor_pago, 'parcial',
        v_compra.saldo_aberto, v_novo_saldo_aberto, NOW(), p_observacao
    ) RETURNING id INTO v_pagamento_id;
    
    -- Atualizar compra
    UPDATE compras 
    SET 
        valor_pago = valor_pago + p_valor_pago,
        saldo_aberto = v_novo_saldo_aberto,
        status = CASE WHEN v_novo_saldo_aberto = 0 THEN 'pago' ELSE 'parcial' END
    WHERE id = p_compra_id;
    
    -- Atualizar conta
    UPDATE contas 
    SET saldo_atual = saldo_atual - p_valor_pago
    WHERE id = p_conta_id;
    
    RETURN json_build_object(
        'success', true,
        'pagamento_id', v_pagamento_id,
        'valor_pago', p_valor_pago,
        'saldo_restante', v_novo_saldo_aberto,
        'status_compra', CASE WHEN v_novo_saldo_aberto = 0 THEN 'pago' ELSE 'parcial' END,
        'fornecedor_id', v_compra.fornecedor_id
    );
END;
$$ LANGUAGE plpgsql;

-- Função para validar saldo da conta
CREATE OR REPLACE FUNCTION validate_account_balance(
    p_conta_id UUID,
    p_valor_solicitado DECIMAL
) RETURNS JSON AS $$
DECLARE
    v_conta RECORD;
BEGIN
    -- Buscar conta
    SELECT * INTO v_conta FROM contas WHERE id = p_conta_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Conta não encontrada'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'conta_id', v_conta.id,
        'conta_nome', v_conta.nome,
        'saldo_disponivel', v_conta.saldo_atual,
        'valor_solicitado', p_valor_solicitado,
        'pode_processar', v_conta.saldo_atual >= p_valor_solicitado,
        'diferenca', v_conta.saldo_atual - p_valor_solicitado
    );
END;
$$ LANGUAGE plpgsql;

-- View para histórico de pagamentos com informações completas
CREATE OR REPLACE VIEW vw_historico_pagamentos AS
SELECT 
    pf.id,
    pf.compra_id,
    f.nome as fornecedor_nome,
    c.valor_total as compra_valor_total,
    pf.valor_pago,
    pf.tipo_pagamento,
    pf.foi_pago_automatico,
    pf.saldo_anterior,
    pf.saldo_posterior,
    pf.data_pagamento,
    pf.observacao,
    ct.nome as conta_nome,
    ct.is_cora_account
FROM pagamentos_fornecedores pf
JOIN compras c ON pf.compra_id = c.id
JOIN fornecedores f ON c.fornecedor_id = f.id
JOIN contas ct ON pf.conta_id = ct.id
ORDER BY pf.data_pagamento DESC;

-- Permissões Supabase
GRANT SELECT ON pagamentos_fornecedores TO anon;
GRANT ALL PRIVILEGES ON pagamentos_fornecedores TO authenticated;
GRANT EXECUTE ON FUNCTION process_pagamento_total TO authenticated;
GRANT EXECUTE ON FUNCTION process_pagamento_parcial TO authenticated;
GRANT EXECUTE ON FUNCTION validate_account_balance TO authenticated;
GRANT SELECT ON vw_historico_pagamentos TO anon;
GRANT SELECT ON vw_historico_pagamentos TO authenticated;

-- Comentários para documentação
COMMENT ON FUNCTION process_pagamento_total IS 'Processa pagamento total automático com desconto da conta Cora';
COMMENT ON FUNCTION process_pagamento_parcial IS 'Processa pagamento parcial customizado com validações';
COMMENT ON FUNCTION validate_account_balance IS 'Valida se conta tem saldo suficiente para o pagamento';
COMMENT ON VIEW vw_historico_pagamentos IS 'View completa do histórico de pagamentos com informações de fornecedor e conta';