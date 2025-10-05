-- Criar tabela marketplaces
CREATE TABLE marketplaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_marketplaces_ativo ON marketplaces(ativo);
CREATE INDEX idx_marketplaces_nome ON marketplaces(nome);

-- RLS Policies
ALTER TABLE marketplaces ENABLE ROW LEVEL SECURITY;

-- Política de leitura: usuários autenticados
CREATE POLICY "Usuários autenticados podem ler marketplaces" ON marketplaces
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política de inserção: usuários autenticados
CREATE POLICY "Usuários autenticados podem criar marketplaces" ON marketplaces
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização: usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar marketplaces" ON marketplaces
    FOR UPDATE USING (auth.role() = 'authenticated');