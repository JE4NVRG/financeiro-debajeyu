-- Corrigir constraint fornecedores passo a passo
-- Migration: 073_fix_fornecedores_constraint_step_by_step

-- 1. Primeiro remover a constraint existente
ALTER TABLE fornecedores DROP CONSTRAINT IF EXISTS fornecedores_tipo_check;

-- 2. Atualizar todos os registros existentes para valores válidos
UPDATE fornecedores 
SET tipo = CASE 
    WHEN tipo = 'Fornecedor' THEN 'Outros'
    WHEN tipo = 'Prestador de Serviço' THEN 'Outros'
    WHEN tipo NOT IN ('Camisa', 'Gráfica', 'Outros') THEN 'Outros'
    ELSE tipo
END;

-- 3. Agora criar a nova constraint
ALTER TABLE fornecedores ADD CONSTRAINT fornecedores_tipo_check 
CHECK (tipo IN ('Camisa', 'Gráfica', 'Outros'));

-- 4. Verificar os dados após a correção
SELECT tipo, COUNT(*) as quantidade FROM fornecedores GROUP BY tipo;