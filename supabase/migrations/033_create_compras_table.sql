-- Criar tabela compras
CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL CHECK (valor_total > 0),
    forma VARCHAR(20) NOT NULL CHECK (forma IN ('À Vista', 'Fiado')),
    vencimento DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Aberta' CHECK (status IN ('Aberta', 'Parcial', 'Quitada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_compras_fornecedor_id ON compras(fornecedor_id);
CREATE INDEX idx_compras_usuario_id ON compras(usuario_id);
CREATE INDEX idx_compras_data ON compras(data DESC);
CREATE INDEX idx_compras_status ON compras(status);

-- RLS Policies
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver todas as compras" ON compras
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem inserir próprias compras" ON compras
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar próprias compras" ON compras
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar próprias compras" ON compras
    FOR DELETE USING (auth.uid() = usuario_id);

-- Trigger para updated_at
CREATE TRIGGER update_compras_updated_at
    BEFORE UPDATE ON compras
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();