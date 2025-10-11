-- Criar tabela de abatimentos de pré-saldo
CREATE TABLE abatimentos_pre_saldo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    socio_id UUID NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
    conta_id UUID NOT NULL REFERENCES contas(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL DEFAULT auth.uid(),
    valor DECIMAL(14,2) NOT NULL CHECK (valor > 0),
    saldo_anterior DECIMAL(14,2) NOT NULL,
    saldo_posterior DECIMAL(14,2) NOT NULL,
    data_abatimento DATE NOT NULL DEFAULT CURRENT_DATE,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_abatimentos_socio_id ON abatimentos_pre_saldo(socio_id);
CREATE INDEX idx_abatimentos_data ON abatimentos_pre_saldo(data_abatimento DESC);
CREATE INDEX idx_abatimentos_conta_id ON abatimentos_pre_saldo(conta_id);
CREATE INDEX idx_abatimentos_usuario_id ON abatimentos_pre_saldo(usuario_id);

-- Adicionar campo updated_at na tabela socios se não existir
ALTER TABLE socios 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at na tabela socios
DROP TRIGGER IF EXISTS trigger_socios_updated_at ON socios;
CREATE TRIGGER trigger_socios_updated_at
    BEFORE UPDATE ON socios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar pré-saldo automaticamente
CREATE OR REPLACE FUNCTION atualizar_pre_saldo_abatimento()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar saldo anterior
    SELECT pre_saldo INTO NEW.saldo_anterior 
    FROM socios WHERE id = NEW.socio_id;
    
    -- Verificar se há saldo suficiente
    IF NEW.saldo_anterior < NEW.valor THEN
        RAISE EXCEPTION 'Saldo insuficiente. Saldo atual: R$ %, Valor solicitado: R$ %', 
            NEW.saldo_anterior, NEW.valor;
    END IF;
    
    -- Calcular novo saldo
    NEW.saldo_posterior := NEW.saldo_anterior - NEW.valor;
    
    -- Atualizar pré-saldo do sócio
    UPDATE socios 
    SET pre_saldo = NEW.saldo_posterior,
        updated_at = NOW()
    WHERE id = NEW.socio_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para execução automática
CREATE TRIGGER trigger_atualizar_pre_saldo_abatimento
    BEFORE INSERT ON abatimentos_pre_saldo
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_pre_saldo_abatimento();

-- Políticas RLS (Row Level Security)
ALTER TABLE abatimentos_pre_saldo ENABLE ROW LEVEL SECURITY;

-- Política para visualização
CREATE POLICY "Usuários autenticados podem ver abatimentos" ON abatimentos_pre_saldo
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para inserção
CREATE POLICY "Usuários autenticados podem inserir abatimentos" ON abatimentos_pre_saldo
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Conceder permissões para roles anon e authenticated
GRANT SELECT, INSERT ON abatimentos_pre_saldo TO anon;
GRANT SELECT, INSERT ON abatimentos_pre_saldo TO authenticated;