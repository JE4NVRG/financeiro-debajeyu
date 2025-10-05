-- Remover políticas existentes da tabela marketplaces
DROP POLICY IF EXISTS "Usuários autenticados podem ler marketplaces" ON marketplaces;
DROP POLICY IF EXISTS "Usuários autenticados podem criar marketplaces" ON marketplaces;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar marketplaces" ON marketplaces;

-- Criar novas políticas RLS mais permissivas para marketplaces
CREATE POLICY "Enable read access for all users" ON marketplaces
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON marketplaces
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON marketplaces
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON marketplaces
    FOR DELETE USING (true);