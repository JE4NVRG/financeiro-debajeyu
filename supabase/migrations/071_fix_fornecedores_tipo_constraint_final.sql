-- Corrigir constraint do tipo de fornecedor para aceitar os valores corretos
-- Migration: 071_fix_fornecedores_tipo_constraint_final

-- 1. Remover constraint existente
ALTER TABLE fornecedores DROP CONSTRAINT IF EXISTS fornecedores_tipo_check;

-- 2. Criar nova constraint com os valores corretos do frontend
ALTER TABLE fornecedores ADD CONSTRAINT fornecedores_tipo_check 
CHECK (tipo::text = ANY (ARRAY['Camisa'::character varying, 'Gráfica'::character varying, 'Outros'::character varying]::text[]));

-- 3. Verificar se a constraint foi criada corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'fornecedores_tipo_check';