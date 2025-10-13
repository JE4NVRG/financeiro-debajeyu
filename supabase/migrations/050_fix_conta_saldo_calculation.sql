-- Migração 050: Corrigir cálculo de saldo das contas
-- Adicionar coluna saldo_atual e função para calcular saldo baseado em entradas e pagamentos

-- 1. Adicionar coluna saldo_atual na tabela contas se não existir
ALTER TABLE contas 
ADD COLUMN IF NOT EXISTS saldo_atual DECIMAL(14,2) DEFAULT 0;

-- 2. Função para calcular saldo atual de uma conta
CREATE OR REPLACE FUNCTION calcular_saldo_conta(p_conta_id UUID)
RETURNS DECIMAL(14,2) AS $$
DECLARE
    v_total_entradas DECIMAL(14,2) := 0;
    v_total_pagamentos DECIMAL(14,2) := 0;
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
    
    -- Calcular saldo atual (entradas - pagamentos)
    v_saldo_atual := v_total_entradas - v_total_pagamentos;
    
    RETURN v_saldo_atual;
END;
$$ LANGUAGE plpgsql;

-- 3. Função para atualizar saldo de todas as contas
CREATE OR REPLACE FUNCTION atualizar_saldos_contas()
RETURNS VOID AS $$
DECLARE
    v_conta RECORD;
    v_saldo DECIMAL(14,2);
BEGIN
    FOR v_conta IN SELECT id FROM contas LOOP
        v_saldo := calcular_saldo_conta(v_conta.id);
        
        UPDATE contas 
        SET saldo_atual = v_saldo
        WHERE id = v_conta.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Atualizar saldos de todas as contas existentes
SELECT atualizar_saldos_contas();

-- 5. Função trigger para atualizar saldo automaticamente quando há nova entrada
CREATE OR REPLACE FUNCTION trigger_atualizar_saldo_conta_entrada()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Nova entrada: somar ao saldo
        UPDATE contas 
        SET saldo_atual = saldo_atual + NEW.valor
        WHERE id = NEW.conta_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Entrada atualizada: ajustar diferença
        UPDATE contas 
        SET saldo_atual = saldo_atual - OLD.valor + NEW.valor
        WHERE id = NEW.conta_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Entrada deletada: subtrair do saldo
        UPDATE contas 
        SET saldo_atual = saldo_atual - OLD.valor
        WHERE id = OLD.conta_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Função trigger para atualizar saldo automaticamente quando há novo pagamento
CREATE OR REPLACE FUNCTION trigger_atualizar_saldo_conta_pagamento()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Novo pagamento: subtrair do saldo
        UPDATE contas 
        SET saldo_atual = saldo_atual - NEW.valor_pago
        WHERE id = NEW.conta_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Pagamento atualizado: ajustar diferença
        UPDATE contas 
        SET saldo_atual = saldo_atual + OLD.valor_pago - NEW.valor_pago
        WHERE id = NEW.conta_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Pagamento deletado: devolver ao saldo
        UPDATE contas 
        SET saldo_atual = saldo_atual + OLD.valor_pago
        WHERE id = OLD.conta_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar triggers
DROP TRIGGER IF EXISTS trigger_saldo_conta_entrada ON entradas;
CREATE TRIGGER trigger_saldo_conta_entrada
    AFTER INSERT OR UPDATE OR DELETE ON entradas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_saldo_conta_entrada();

DROP TRIGGER IF EXISTS trigger_saldo_conta_pagamento ON pagamentos_fornecedores;
CREATE TRIGGER trigger_saldo_conta_pagamento
    AFTER INSERT OR UPDATE OR DELETE ON pagamentos_fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_saldo_conta_pagamento();

-- 8. Atualizar função validate_account_balance para usar saldo calculado corretamente
CREATE OR REPLACE FUNCTION validate_account_balance(
    p_conta_id UUID,
    p_valor_solicitado DECIMAL
) RETURNS JSON AS $$
DECLARE
    v_conta RECORD;
    v_saldo_calculado DECIMAL(14,2);
BEGIN
    -- Buscar conta
    SELECT * INTO v_conta FROM contas WHERE id = p_conta_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Conta não encontrada'
        );
    END IF;
    
    -- Calcular saldo atual da conta
    v_saldo_calculado := calcular_saldo_conta(p_conta_id);
    
    -- Atualizar saldo na tabela para manter sincronizado
    UPDATE contas 
    SET saldo_atual = v_saldo_calculado
    WHERE id = p_conta_id;
    
    RETURN json_build_object(
        'success', true,
        'conta_id', v_conta.id,
        'conta_nome', v_conta.nome,
        'saldo_disponivel', v_saldo_calculado,
        'valor_solicitado', p_valor_solicitado,
        'pode_processar', v_saldo_calculado >= p_valor_solicitado,
        'diferenca', v_saldo_calculado - p_valor_solicitado
    );
END;
$$ LANGUAGE plpgsql;

-- 9. Conceder permissões
GRANT EXECUTE ON FUNCTION calcular_saldo_conta TO authenticated;
GRANT EXECUTE ON FUNCTION atualizar_saldos_contas TO authenticated;

-- 10. Comentários para documentação
COMMENT ON FUNCTION calcular_saldo_conta IS 'Calcula o saldo atual de uma conta baseado em entradas e pagamentos';
COMMENT ON FUNCTION atualizar_saldos_contas IS 'Atualiza o saldo de todas as contas do sistema';
COMMENT ON COLUMN contas.saldo_atual IS 'Saldo atual da conta calculado automaticamente (entradas - pagamentos)';