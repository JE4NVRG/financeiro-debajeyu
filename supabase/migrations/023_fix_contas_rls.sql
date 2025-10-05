-- Verificar políticas RLS existentes para a tabela contas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'contas';

-- Desabilitar RLS temporariamente para debug
ALTER TABLE contas DISABLE ROW LEVEL SECURITY;

-- Criar política para permitir SELECT para usuários autenticados
DROP POLICY IF EXISTS "Permitir leitura de contas para usuários autenticados" ON contas;
CREATE POLICY "Permitir leitura de contas para usuários autenticados" 
ON contas FOR SELECT 
TO authenticated 
USING (true);

-- Reabilitar RLS
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;