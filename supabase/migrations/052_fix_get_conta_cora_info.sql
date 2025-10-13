-- Migração 052: Corrigir erro de sintaxe na função get_conta_cora_info()
-- Linha 128 estava com erro de sintaxe: faltava SELECT antes do FROM

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
    
    -- CORREÇÃO: Adicionar SELECT que estava faltando
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

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_conta_cora_info TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION get_conta_cora_info IS 'Retorna informações completas da conta Cora incluindo saldo atual e disponível - CORRIGIDO';