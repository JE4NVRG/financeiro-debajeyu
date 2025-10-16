-- Migração para adicionar funcionalidade de "Dinheiro a Liberar" em Marketplaces
-- Adicionar coluna dinheiro_a_liberar na tabela marketplaces

-- 1. Adicionar coluna dinheiro_a_liberar
ALTER TABLE marketplaces 
ADD COLUMN dinheiro_a_liberar DECIMAL(15,2) DEFAULT 0.00 NOT NULL;

-- 2. Adicionar índice para performance
CREATE INDEX idx_marketplaces_dinheiro_a_liberar ON marketplaces(dinheiro_a_liberar);

-- 3. Adicionar constraint para valores não negativos
ALTER TABLE marketplaces 
ADD CONSTRAINT chk_dinheiro_a_liberar_positive 
CHECK (dinheiro_a_liberar >= 0);

-- 4. Criar tabela marketplace_balance_history para histórico
CREATE TABLE marketplace_balance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id UUID NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    previous_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    new_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    changed_by UUID NOT NULL REFERENCES usuarios(id),
    reason TEXT DEFAULT 'Alteração manual via interface',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Índices para performance na tabela de histórico
CREATE INDEX idx_marketplace_balance_history_marketplace_id ON marketplace_balance_history(marketplace_id);
CREATE INDEX idx_marketplace_balance_history_created_at ON marketplace_balance_history(created_at DESC);
CREATE INDEX idx_marketplace_balance_history_changed_by ON marketplace_balance_history(changed_by);

-- 6. Função para obter totais de valores bloqueados
CREATE OR REPLACE FUNCTION get_total_blocked_amounts()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_blocked', COALESCE(SUM(dinheiro_a_liberar), 0),
        'marketplaces_count', COUNT(*) FILTER (WHERE dinheiro_a_liberar > 0),
        'breakdown', json_agg(
            json_build_object(
                'marketplace_id', id,
                'nome', nome,
                'dinheiro_a_liberar', dinheiro_a_liberar
            )
        ) FILTER (WHERE dinheiro_a_liberar > 0)
    ) INTO result
    FROM marketplaces
    WHERE ativo = true;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função trigger para registrar alterações automaticamente
CREATE OR REPLACE FUNCTION log_marketplace_balance_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Só registra se o valor mudou
    IF OLD.dinheiro_a_liberar != NEW.dinheiro_a_liberar THEN
        INSERT INTO marketplace_balance_history (
            marketplace_id,
            previous_amount,
            new_amount,
            changed_by,
            reason
        ) VALUES (
            NEW.id,
            OLD.dinheiro_a_liberar,
            NEW.dinheiro_a_liberar,
            auth.uid(),
            'Alteração manual via interface'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar trigger para registrar alterações
CREATE TRIGGER marketplace_balance_change_trigger
    AFTER UPDATE ON marketplaces
    FOR EACH ROW
    EXECUTE FUNCTION log_marketplace_balance_change();

-- 9. Configurar RLS para marketplace_balance_history
ALTER TABLE marketplace_balance_history ENABLE ROW LEVEL SECURITY;

-- 10. Política de leitura para histórico
CREATE POLICY "Usuários autenticados podem ler histórico" ON marketplace_balance_history
    FOR SELECT USING (auth.role() = 'authenticated');

-- 11. Política de inserção para histórico (apenas via trigger)
CREATE POLICY "Sistema pode inserir histórico" ON marketplace_balance_history
    FOR INSERT WITH CHECK (true);

-- 12. Conceder permissões para a nova tabela
GRANT SELECT ON marketplace_balance_history TO authenticated;
GRANT SELECT ON marketplace_balance_history TO anon;

-- 13. Comentários para documentação
COMMENT ON COLUMN marketplaces.dinheiro_a_liberar IS 'Valor bloqueado no marketplace aguardando liberação';
COMMENT ON TABLE marketplace_balance_history IS 'Histórico de alterações nos valores bloqueados dos marketplaces';
COMMENT ON FUNCTION get_total_blocked_amounts() IS 'Retorna totais consolidados de valores bloqueados em todos os marketplaces';