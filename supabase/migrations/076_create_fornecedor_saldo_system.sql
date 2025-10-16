-- Migration: Create Fornecedor Saldo System
-- Description: Add manual balance editing functionality for suppliers

-- 1. Add new columns to fornecedores table
ALTER TABLE fornecedores 
ADD COLUMN IF NOT EXISTS saldo_devedor_manual DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tem_ajuste_manual BOOLEAN DEFAULT FALSE;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_fornecedores_ajuste_manual ON fornecedores(tem_ajuste_manual);

-- 3. Create fornecedor_saldo_history table
CREATE TABLE IF NOT EXISTS fornecedor_saldo_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
    valor_anterior DECIMAL(10,2) NOT NULL,
    valor_novo DECIMAL(10,2) NOT NULL,
    observacao TEXT NOT NULL,
    usuario_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for fornecedor_saldo_history
CREATE INDEX IF NOT EXISTS idx_fornecedor_saldo_history_fornecedor_id ON fornecedor_saldo_history(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_fornecedor_saldo_history_created_at ON fornecedor_saldo_history(created_at DESC);

-- 5. Enable RLS for fornecedor_saldo_history
ALTER TABLE fornecedor_saldo_history ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for fornecedor_saldo_history
-- Policy for viewing history (authenticated users)
CREATE POLICY "Usuários autenticados podem visualizar histórico de saldo" ON fornecedor_saldo_history
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for inserting history (authenticated users)
CREATE POLICY "Usuários autenticados podem inserir histórico de saldo" ON fornecedor_saldo_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. Grant permissions to authenticated role
GRANT SELECT, INSERT ON fornecedor_saldo_history TO authenticated;

-- 8. Create function to update fornecedor saldo with history tracking
CREATE OR REPLACE FUNCTION update_fornecedor_saldo_manual(
    p_fornecedor_id UUID,
    p_novo_saldo DECIMAL(10,2),
    p_observacao TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_saldo_anterior DECIMAL(10,2);
    v_user_id UUID;
BEGIN
    -- Get current user ID, fallback to a default user if auth.uid() is null
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM usuarios LIMIT 1;
        IF v_user_id IS NULL THEN
            RAISE EXCEPTION 'No user available for history tracking';
        END IF;
    END IF;
    
    -- Get previous balance
    SELECT COALESCE(saldo_devedor_manual, 0) INTO v_saldo_anterior
    FROM fornecedores 
    WHERE id = p_fornecedor_id;
    
    -- Update fornecedor
    UPDATE fornecedores 
    SET 
        saldo_devedor_manual = p_novo_saldo,
        tem_ajuste_manual = TRUE,
        updated_at = NOW()
    WHERE id = p_fornecedor_id;
    
    -- Insert history record
    INSERT INTO fornecedor_saldo_history (
        fornecedor_id, valor_anterior, valor_novo, observacao, usuario_id
    ) VALUES (
        p_fornecedor_id, v_saldo_anterior, p_novo_saldo, p_observacao, v_user_id
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating fornecedor saldo: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Initialize existing fornecedores with default values
UPDATE fornecedores 
SET 
    saldo_devedor_manual = 0, 
    tem_ajuste_manual = FALSE 
WHERE saldo_devedor_manual IS NULL OR tem_ajuste_manual IS NULL;

-- 10. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_fornecedor_saldo_manual(UUID, DECIMAL, TEXT) TO authenticated;