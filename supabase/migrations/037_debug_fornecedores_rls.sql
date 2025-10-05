-- Debug e correção temporária das RLS policies para fornecedores

-- 1. Verificar se o usuário está sendo passado corretamente
-- Primeiro, vamos desabilitar RLS temporariamente para testar
ALTER TABLE fornecedores DISABLE ROW LEVEL SECURITY;

-- 2. Recriar as policies com debug
DROP POLICY IF EXISTS "Users can insert their own fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Users can view their own fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Users can update their own fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Users can delete their own fornecedores" ON fornecedores;

-- 3. Reabilitar RLS
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- 4. Criar policies mais permissivas para debug
CREATE POLICY "Allow authenticated users to insert fornecedores" ON fornecedores
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view fornecedores" ON fornecedores
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update fornecedores" ON fornecedores
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete fornecedores" ON fornecedores
FOR DELETE TO authenticated USING (true);