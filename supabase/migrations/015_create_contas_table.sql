-- Criar tabela contas
CREATE TABLE contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_contas_ativa ON contas(ativa);
CREATE INDEX idx_contas_nome ON contas(nome);

-- RLS Policies
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;

-- Política de leitura: usuários autenticados
CREATE POLICY "Usuários autenticados podem ler contas" ON contas
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política de inserção: usuários autenticados
CREATE POLICY "Usuários autenticados podem criar contas" ON contas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Dados iniciais
INSERT INTO contas (nome) VALUES ('Cora');