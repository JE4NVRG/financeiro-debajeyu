-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas as tabelas
CREATE TRIGGER update_contas_updated_at 
    BEFORE UPDATE ON contas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplaces_updated_at 
    BEFORE UPDATE ON marketplaces 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entradas_updated_at 
    BEFORE UPDATE ON entradas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();