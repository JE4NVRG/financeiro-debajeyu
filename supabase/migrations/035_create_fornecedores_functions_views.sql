-- Função para calcular e atualizar status da compra
CREATE OR REPLACE FUNCTION update_compra_status()
RETURNS TRIGGER AS $$
DECLARE
    total_pago DECIMAL(10,2);
    valor_total DECIMAL(10,2);
    novo_status VARCHAR(20);
BEGIN
    -- Buscar valor total da compra
    SELECT c.valor_total INTO valor_total
    FROM compras c
    WHERE c.id = COALESCE(NEW.compra_id, OLD.compra_id);
    
    -- Calcular total pago
    SELECT COALESCE(SUM(valor_pago), 0) INTO total_pago
    FROM pagamentos_fornecedores
    WHERE compra_id = COALESCE(NEW.compra_id, OLD.compra_id);
    
    -- Determinar novo status
    IF total_pago = 0 THEN
        novo_status := 'Aberta';
    ELSIF total_pago >= valor_total THEN
        novo_status := 'Quitada';
    ELSE
        novo_status := 'Parcial';
    END IF;
    
    -- Atualizar status da compra
    UPDATE compras
    SET status = novo_status, updated_at = NOW()
    WHERE id = COALESCE(NEW.compra_id, OLD.compra_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar status automaticamente
CREATE TRIGGER trigger_update_compra_status_insert
    AFTER INSERT ON pagamentos_fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION update_compra_status();

CREATE TRIGGER trigger_update_compra_status_update
    AFTER UPDATE ON pagamentos_fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION update_compra_status();

CREATE TRIGGER trigger_update_compra_status_delete
    AFTER DELETE ON pagamentos_fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION update_compra_status();

-- View para fornecedores com totais
CREATE VIEW view_fornecedores_totais AS
SELECT 
    f.*,
    COALESCE(SUM(c.valor_total), 0) as total_gasto,
    COALESCE(SUM(p.valor_pago), 0) as total_pago,
    COALESCE(SUM(c.valor_total) - SUM(p.valor_pago), 0) as total_aberto
FROM fornecedores f
LEFT JOIN compras c ON f.id = c.fornecedor_id
LEFT JOIN pagamentos_fornecedores p ON c.id = p.compra_id
GROUP BY f.id, f.nome, f.tipo, f.status, f.observacao, f.created_at, f.updated_at, f.usuario_id;

-- View para compras com saldo
CREATE VIEW view_compras_saldo AS
SELECT 
    c.*,
    f.nome as fornecedor_nome,
    f.tipo as fornecedor_tipo,
    COALESCE(SUM(p.valor_pago), 0) as total_pago,
    c.valor_total - COALESCE(SUM(p.valor_pago), 0) as saldo_aberto
FROM compras c
JOIN fornecedores f ON c.fornecedor_id = f.id
LEFT JOIN pagamentos_fornecedores p ON c.id = p.compra_id
GROUP BY c.id, c.fornecedor_id, c.data, c.descricao, c.categoria, c.valor_total, 
         c.forma, c.vencimento, c.status, c.created_at, c.updated_at, c.usuario_id,
         f.nome, f.tipo;

-- Grants para as views
GRANT SELECT ON view_fornecedores_totais TO authenticated;
GRANT SELECT ON view_compras_saldo TO authenticated;