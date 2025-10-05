-- Desabilitar RLS temporariamente para a tabela compras
-- Similar ao que foi feito para fornecedores

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver todas as compras" ON compras;
DROP POLICY IF EXISTS "Usuários podem inserir próprias compras" ON compras;
DROP POLICY IF EXISTS "Usuários podem atualizar próprias compras" ON compras;
DROP POLICY IF EXISTS "Usuários podem deletar próprias compras" ON compras;

-- Desabilitar RLS
ALTER TABLE compras DISABLE ROW LEVEL SECURITY;

-- Conceder permissões para usuários autenticados
GRANT ALL ON compras TO authenticated;