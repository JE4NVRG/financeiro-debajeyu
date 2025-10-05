-- Migração 010: Adicionar coluna pre_saldo de forma simples e segura

-- 1. Primeiro, dropar as políticas que dependem da coluna criado_por
DROP POLICY IF EXISTS "Usuários podem editar investimentos que criaram" ON investimentos;
DROP POLICY IF EXISTS "Usuários podem deletar investimentos que criaram" ON investimentos;

-- 2. Remover a coluna criado_por da tabela investimentos
ALTER TABLE investimentos 
DROP COLUMN IF EXISTS criado_por CASCADE;

-- 3. Adicionar coluna pre_saldo na tabela socios se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'socios' AND column_name = 'pre_saldo') THEN
        ALTER TABLE socios ADD COLUMN pre_saldo NUMERIC(14,2) NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 4. Adicionar constraint para garantir que pre_saldo >= 0
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_pre_saldo_positive' AND table_name = 'socios') THEN
        ALTER TABLE socios ADD CONSTRAINT check_pre_saldo_positive CHECK (pre_saldo >= 0);
    END IF;
END $$;