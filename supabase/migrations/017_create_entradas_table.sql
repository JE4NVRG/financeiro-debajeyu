-- Criar tabela entradas
CREATE TABLE entradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL,
    conta_id UUID NOT NULL REFERENCES contas(id) ON DELETE RESTRICT,
    marketplace_id UUID NOT NULL REFERENCES marketplaces(id) ON DELETE RESTRICT,
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    comissao_paga BOOLEAN DEFAULT false,
    observacao TEXT,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_entradas_data ON entradas(data DESC);
CREATE INDEX idx_entradas_conta_id ON entradas(conta_id);
CREATE INDEX idx_entradas_marketplace_id ON entradas(marketplace_id);
CREATE INDEX idx_entradas_usuario_id ON entradas(usuario_id);
CREATE INDEX idx_entradas_created_at ON entradas(created_at DESC);

-- Índice composto para filtros comuns
CREATE INDEX idx_entradas_conta_marketplace ON entradas(conta_id, marketplace_id);
CREATE INDEX idx_entradas_data_marketplace ON entradas(data, marketplace_id);

-- RLS Policies
ALTER TABLE entradas ENABLE ROW LEVEL SECURITY;

-- Política de leitura: usuários autenticados
CREATE POLICY "Usuários autenticados podem ler entradas" ON entradas
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política de inserção: usuários autenticados
CREATE POLICY "Usuários autenticados podem criar entradas" ON entradas
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        usuario_id = auth.uid()
    );

-- Política de atualização: apenas o autor
CREATE POLICY "Usuários podem atualizar suas próprias entradas" ON entradas
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        usuario_id = auth.uid()
    );

-- Política de exclusão: apenas o autor
CREATE POLICY "Usuários podem excluir suas próprias entradas" ON entradas
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        usuario_id = auth.uid()
    );