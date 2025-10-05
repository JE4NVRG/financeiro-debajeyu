-- Criar tabela usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login VARCHAR(50) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela socios
CREATE TABLE socios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela investimentos
CREATE TABLE investimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    setor VARCHAR(100),
    socio_id UUID NOT NULL REFERENCES socios(id),
    valor DECIMAL(15,2) NOT NULL,
    observacao TEXT,
    criado_por UUID NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela pre_saldos
CREATE TABLE pre_saldos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL,
    socio_id UUID NOT NULL REFERENCES socios(id),
    valor DECIMAL(15,2) NOT NULL,
    observacao TEXT,
    criado_por UUID NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_investimentos_socio_id ON investimentos(socio_id);
CREATE INDEX idx_investimentos_data ON investimentos(data DESC);
CREATE INDEX idx_investimentos_criado_por ON investimentos(criado_por);

CREATE INDEX idx_pre_saldos_socio_id ON pre_saldos(socio_id);
CREATE INDEX idx_pre_saldos_data ON pre_saldos(data DESC);
CREATE INDEX idx_pre_saldos_criado_por ON pre_saldos(criado_por);