-- Criar tabela fornecedores
CREATE TABLE fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Camisa', 'Gráfica', 'Outros')),
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    UNIQUE(nome, usuario_id)
);

-- Índices
CREATE INDEX idx_fornecedores_usuario_id ON fornecedores(usuario_id);
CREATE INDEX idx_fornecedores_tipo ON fornecedores(tipo);
CREATE INDEX idx_fornecedores_status ON fornecedores(status);

-- RLS Policies
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver todos os fornecedores" ON fornecedores
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem inserir próprios fornecedores" ON fornecedores
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar próprios fornecedores" ON fornecedores
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar próprios fornecedores" ON fornecedores
    FOR DELETE USING (auth.uid() = usuario_id);

-- Trigger para updated_at
CREATE TRIGGER update_fornecedores_updated_at
    BEFORE UPDATE ON fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();