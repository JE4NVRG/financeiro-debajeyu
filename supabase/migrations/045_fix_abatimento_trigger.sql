-- Recriar função para atualizar pré-saldo automaticamente com melhor formatação de erro
CREATE OR REPLACE FUNCTION atualizar_pre_saldo_abatimento()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar saldo anterior
    SELECT pre_saldo INTO NEW.saldo_anterior 
    FROM socios WHERE id = NEW.socio_id;
    
    -- Verificar se há saldo suficiente
    IF NEW.saldo_anterior < NEW.valor THEN
        RAISE EXCEPTION 'Saldo insuficiente. Saldo atual: R$ %, Valor solicitado: R$ %', 
            NEW.saldo_anterior, NEW.valor;
    END IF;
    
    -- Calcular novo saldo
    NEW.saldo_posterior := NEW.saldo_anterior - NEW.valor;
    
    -- Atualizar pré-saldo do sócio
    UPDATE socios 
    SET pre_saldo = NEW.saldo_posterior,
        updated_at = NOW()
    WHERE id = NEW.socio_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;