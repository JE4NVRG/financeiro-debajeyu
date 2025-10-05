-- Migração 005: Adicionar coluna pre_saldo na tabela socios
-- Atualizar modelo de dados conforme especificação

-- 1. Adicionar coluna pre_saldo na tabela socios
ALTER TABLE socios 
ADD COLUMN pre_saldo NUMERIC(14,2) NOT NULL DEFAULT 0;

-- 2. Adicionar constraint para garantir que pre_saldo >= 0
ALTER TABLE socios 
ADD CONSTRAINT check_pre_saldo_positive CHECK (pre_saldo >= 0);

-- 3. Tornar nome único na tabela socios
ALTER TABLE socios 
ADD CONSTRAINT unique_socios_nome UNIQUE (nome);

-- 4. Atualizar tabela investimentos para remover campos desnecessários
ALTER TABLE investimentos 
DROP COLUMN IF EXISTS setor,
DROP COLUMN IF EXISTS observacao,
DROP COLUMN IF EXISTS criado_por;

-- 5. Adicionar constraint para valor > 0 em investimentos
ALTER TABLE investimentos 
ADD CONSTRAINT check_investimentos_valor_positive CHECK (valor > 0);

-- 6. Atualizar tipo de valor para NUMERIC(14,2)
ALTER TABLE investimentos 
ALTER COLUMN valor TYPE NUMERIC(14,2);