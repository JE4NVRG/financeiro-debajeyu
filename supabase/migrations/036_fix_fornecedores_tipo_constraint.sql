-- Corrigir constraint do tipo de fornecedor e RLS policies

-- 1. Atualizar constraint do tipo para os novos valores
ALTER TABLE fornecedores DROP CONSTRAINT IF EXISTS fornecedores_tipo_check;
ALTER TABLE fornecedores ADD CONSTRAINT fornecedores_tipo_check 
CHECK (tipo::text = ANY (ARRAY['Fornecedor'::character varying, 'Prestador de Serviço'::character varying]::text[]));

-- 2. Criar RLS policy para INSERT se não existir
DROP POLICY IF EXISTS "Users can insert their own fornecedores" ON fornecedores;
CREATE POLICY "Users can insert their own fornecedores" ON fornecedores
FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- 3. Criar RLS policy para SELECT se não existir
DROP POLICY IF EXISTS "Users can view their own fornecedores" ON fornecedores;
CREATE POLICY "Users can view their own fornecedores" ON fornecedores
FOR SELECT USING (auth.uid() = usuario_id);

-- 4. Criar RLS policy para UPDATE se não existir
DROP POLICY IF EXISTS "Users can update their own fornecedores" ON fornecedores;
CREATE POLICY "Users can update their own fornecedores" ON fornecedores
FOR UPDATE USING (auth.uid() = usuario_id);

-- 5. Criar RLS policy para DELETE se não existir
DROP POLICY IF EXISTS "Users can delete their own fornecedores" ON fornecedores;
CREATE POLICY "Users can delete their own fornecedores" ON fornecedores
FOR DELETE USING (auth.uid() = usuario_id);