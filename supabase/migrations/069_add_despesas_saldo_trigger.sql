-- Função para atualizar saldo da conta quando despesa é paga
CREATE OR REPLACE FUNCTION atualizar_saldo_conta_despesa()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a despesa foi marcada como paga (status mudou de pendente para pago)
    IF OLD.status = 'pendente' AND NEW.status = 'pago' AND NEW.tipo = 'despesa' THEN
        -- Debitar o valor da conta
        UPDATE contas 
        SET saldo_atual = saldo_atual - NEW.valor,
            updated_at = NOW()
        WHERE id = NEW.conta_id;
        
        RAISE NOTICE 'Saldo da conta % debitado em % devido ao pagamento da despesa %', 
                     NEW.conta_id, NEW.valor, NEW.id;
    END IF;
    
    -- Se a despesa foi desmarcada como paga (status mudou de pago para pendente)
    IF OLD.status = 'pago' AND NEW.status = 'pendente' AND NEW.tipo = 'despesa' THEN
        -- Creditar o valor de volta na conta
        UPDATE contas 
        SET saldo_atual = saldo_atual + OLD.valor,
            updated_at = NOW()
        WHERE id = OLD.conta_id;
        
        RAISE NOTICE 'Saldo da conta % creditado em % devido ao cancelamento do pagamento da despesa %', 
                     OLD.conta_id, OLD.valor, OLD.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar saldo quando despesa é paga
DROP TRIGGER IF EXISTS trigger_atualizar_saldo_conta_despesa ON saidas;
CREATE TRIGGER trigger_atualizar_saldo_conta_despesa
    AFTER UPDATE ON saidas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_saldo_conta_despesa();

-- Comentário para documentação
COMMENT ON FUNCTION atualizar_saldo_conta_despesa IS 'Atualiza o saldo da conta quando uma despesa é marcada como paga ou desmarcada';
COMMENT ON TRIGGER trigger_atualizar_saldo_conta_despesa ON saidas IS 'Trigger que executa a atualização do saldo da conta quando status da despesa muda';