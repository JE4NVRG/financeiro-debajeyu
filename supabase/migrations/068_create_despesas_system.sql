-- Migration: Sistema de Gestão de Despesas
-- Adiciona campos necessários para despesas recorrentes e avulsas

-- Adicionar colunas específicas para despesas na tabela saidas
ALTER TABLE saidas 
ADD COLUMN IF NOT EXISTS subtipo VARCHAR(20) CHECK (subtipo IN ('recorrente', 'avulsa')),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
ADD COLUMN IF NOT EXISTS data_vencimento DATE,
ADD COLUMN IF NOT EXISTS data_pagamento DATE,
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS recorrencia_config JSONB,
ADD COLUMN IF NOT EXISTS despesa_origem_id UUID REFERENCES saidas(id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_saidas_tipo_subtipo ON saidas(tipo, subtipo);
CREATE INDEX IF NOT EXISTS idx_saidas_status ON saidas(status);
CREATE INDEX IF NOT EXISTS idx_saidas_data_vencimento ON saidas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_saidas_despesa_origem ON saidas(despesa_origem_id);

-- Função para calcular próxima data de recorrência
CREATE OR REPLACE FUNCTION calcular_proxima_data_recorrencia(
    data_base DATE,
    frequencia TEXT
) RETURNS DATE AS $$
BEGIN
    CASE frequencia
        WHEN 'mensal' THEN
            RETURN data_base + INTERVAL '1 month';
        WHEN 'bimestral' THEN
            RETURN data_base + INTERVAL '2 months';
        WHEN 'trimestral' THEN
            RETURN data_base + INTERVAL '3 months';
        WHEN 'semestral' THEN
            RETURN data_base + INTERVAL '6 months';
        WHEN 'anual' THEN
            RETURN data_base + INTERVAL '1 year';
        ELSE
            RETURN data_base + INTERVAL '1 month';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar próxima despesa recorrente
CREATE OR REPLACE FUNCTION gerar_proxima_despesa_recorrente()
RETURNS TRIGGER AS $$
BEGIN
    -- Só gera se for despesa recorrente que foi paga
    IF NEW.tipo = 'despesa' 
       AND NEW.subtipo = 'recorrente' 
       AND NEW.status = 'pago' 
       AND OLD.status != 'pago' THEN
        
        INSERT INTO saidas (
            descricao,
            valor,
            categoria_id,
            usuario_id,
            tipo,
            subtipo,
            status,
            data_vencimento,
            observacoes,
            recorrencia_config,
            despesa_origem_id
        ) VALUES (
            NEW.descricao,
            NEW.valor,
            NEW.categoria_id,
            NEW.usuario_id,
            'despesa',
            'recorrente',
            'pendente',
            calcular_proxima_data_recorrencia(
                NEW.data_vencimento,
                (NEW.recorrencia_config->>'frequencia')::TEXT
            ),
            NEW.observacoes,
            NEW.recorrencia_config,
            COALESCE(NEW.despesa_origem_id, NEW.id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar despesas recorrentes
DROP TRIGGER IF EXISTS trigger_gerar_despesa_recorrente ON saidas;
CREATE TRIGGER trigger_gerar_despesa_recorrente
    AFTER UPDATE ON saidas
    FOR EACH ROW
    EXECUTE FUNCTION gerar_proxima_despesa_recorrente();

-- Função para atualizar status de despesas vencidas
CREATE OR REPLACE FUNCTION atualizar_status_despesas_vencidas()
RETURNS void AS $$
BEGIN
    UPDATE saidas 
    SET status = 'vencido'
    WHERE tipo = 'despesa' 
      AND status = 'pendente' 
      AND data_vencimento < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Adicionar campo categoria_id na tabela saidas para referenciar categorias_despesas
ALTER TABLE saidas 
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias_despesas(id);

-- View para despesas com informações calculadas
CREATE OR REPLACE VIEW view_despesas AS
SELECT 
    s.*,
    c.nome as categoria_nome,
    c.cor as categoria_cor,
    CASE 
        WHEN s.status = 'pendente' AND s.data_vencimento < CURRENT_DATE THEN 'vencido'
        ELSE s.status
    END as status_calculado,
    CASE 
        WHEN s.subtipo = 'recorrente' THEN
            calcular_proxima_data_recorrencia(s.data_vencimento, (s.recorrencia_config->>'frequencia')::TEXT)
        ELSE NULL
    END as proxima_data_calculada
FROM saidas s
LEFT JOIN categorias_despesas c ON s.categoria_id = c.id
WHERE s.tipo = 'despesa';

-- Inserir categorias padrão para despesas se não existirem
INSERT INTO categorias_despesas (nome, cor, tipo_padrao) 
SELECT nome, cor, tipo_padrao FROM (VALUES
    ('Moradia', '#EF4444', 'fixa'),
    ('Alimentação', '#F59E0B', 'avulsa'),
    ('Transporte', '#3B82F6', 'fixa'),
    ('Saúde', '#10B981', 'avulsa'),
    ('Educação', '#8B5CF6', 'fixa'),
    ('Lazer', '#F97316', 'avulsa'),
    ('Serviços', '#6B7280', 'fixa'),
    ('Outros', '#374151', 'avulsa')
) AS v(nome, cor, tipo_padrao)
WHERE NOT EXISTS (
    SELECT 1 FROM categorias_despesas cd WHERE cd.nome = v.nome
);

-- Comentários para documentação
COMMENT ON COLUMN saidas.subtipo IS 'Tipo de despesa: recorrente ou avulsa';
COMMENT ON COLUMN saidas.status IS 'Status da despesa: pendente, pago ou vencido';
COMMENT ON COLUMN saidas.data_vencimento IS 'Data de vencimento da despesa';
COMMENT ON COLUMN saidas.data_pagamento IS 'Data em que a despesa foi paga';
COMMENT ON COLUMN saidas.recorrencia_config IS 'Configuração JSON para despesas recorrentes';
COMMENT ON COLUMN saidas.despesa_origem_id IS 'ID da despesa original (para rastrear recorrências)';