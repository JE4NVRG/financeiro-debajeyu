-- Corrigir trigger marketplace_balance_history para não falhar com auth.uid() null
-- Migration: 075_fix_marketplace_balance_trigger

-- 1. Primeiro, remover o trigger existente
DROP TRIGGER IF EXISTS log_marketplace_balance_change_trigger ON marketplaces;

-- 2. Recriar a função do trigger com tratamento para auth.uid() null
CREATE OR REPLACE FUNCTION log_marketplace_balance_change()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Só registra se o valor mudou
    IF OLD.dinheiro_a_liberar != NEW.dinheiro_a_liberar THEN
        -- Tentar obter o user_id, mas não falhar se for null
        v_user_id := auth.uid();
        
        -- Se auth.uid() retornar null, buscar um usuário padrão ou usar um valor específico
        IF v_user_id IS NULL THEN
            -- Buscar o primeiro usuário disponível como fallback
            SELECT id INTO v_user_id FROM usuarios LIMIT 1;
        END IF;
        
        -- Se ainda for null, pular o registro do histórico
        IF v_user_id IS NOT NULL THEN
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
                v_user_id,
                'Alteração manual via interface'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar o trigger
CREATE TRIGGER log_marketplace_balance_change_trigger
    AFTER UPDATE ON marketplaces
    FOR EACH ROW
    EXECUTE FUNCTION log_marketplace_balance_change();

-- 4. Comentário para documentação
COMMENT ON FUNCTION log_marketplace_balance_change() IS 'Registra alterações nos valores bloqueados dos marketplaces com fallback para usuário padrão';