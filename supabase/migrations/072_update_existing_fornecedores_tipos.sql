-- Atualizar tipos existentes na tabela fornecedores e corrigir constraint
-- Migration: 072_update_existing_fornecedores_tipos

-- 1. Primeiro, vamos ver quais tipos existem atualmente
SELECT tipo, COUNT(*) as quantidade FROM fornecedores GROUP BY tipo;

-- 2. Atualizar registros existentes que não seguem o novo padrão
-- Mapear 'Fornecedor' para 'Outros' e 'Prestador de Serviço' para 'Outros'
UPDATE fornecedores 
SET tipo = 'Outros' 
WHERE tipo IN ('Fornecedor', 'Prestador de Serviço');

-- 3. Remover constraint existente
ALTER TABLE fornecedores DROP CONSTRAINT IF EXISTS fornecedores_tipo_check;

-- 4. Criar nova constraint com os valores corretos do frontend
ALTER TABLE fornecedores ADD CONSTRAINT fornecedores_tipo_check 
CHECK (tipo::text = ANY (ARRAY['Camisa'::character varying, 'Gráfica'::character varying, 'Outros'::character varying]::text[]));

-- 5. Verificar se a constraint foi criada corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'fornecedores_tipo_check';

-- 6. Verificar os tipos após a atualização
SELECT tipo, COUNT(*) as quantidade FROM fornecedores GROUP BY tipo;