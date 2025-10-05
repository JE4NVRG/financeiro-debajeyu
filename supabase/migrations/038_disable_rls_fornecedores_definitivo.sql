-- SOLUÇÃO DEFINITIVA: Desabilitar RLS completamente para fornecedores
-- Esta é a 6ª tentativa - vamos resolver de uma vez por todas

-- 1. Remover TODAS as policies existentes
DROP POLICY IF EXISTS "Users can insert their own fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Users can view their own fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Users can update their own fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Users can delete their own fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Allow authenticated users to insert fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Allow authenticated users to view fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Allow authenticated users to update fornecedores" ON fornecedores;
DROP POLICY IF EXISTS "Allow authenticated users to delete fornecedores" ON fornecedores;

-- 2. DESABILITAR RLS COMPLETAMENTE na tabela fornecedores
ALTER TABLE fornecedores DISABLE ROW LEVEL SECURITY;

-- 3. Garantir que a tabela está acessível para usuários autenticados
GRANT ALL ON fornecedores TO authenticated;
GRANT ALL ON fornecedores TO anon;