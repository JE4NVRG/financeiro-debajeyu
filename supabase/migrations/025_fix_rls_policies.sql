-- Desabilitar RLS temporariamente para debug
ALTER TABLE contas DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Permitir leitura de contas para usuários autenticados" ON contas;
DROP POLICY IF EXISTS "Enable read access for all users" ON contas;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON contas;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON contas;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON contas;

-- Criar políticas mais permissivas para contas
CREATE POLICY "contas_select_policy" ON contas
    FOR SELECT USING (true);

CREATE POLICY "contas_insert_policy" ON contas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "contas_update_policy" ON contas
    FOR UPDATE USING (true);

CREATE POLICY "contas_delete_policy" ON contas
    FOR DELETE USING (true);

-- Reabilitar RLS
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;

-- Inserir conta Cora se não existir
INSERT INTO contas (nome, ativa) 
VALUES ('Cora', true) 
ON CONFLICT (nome) DO NOTHING;

-- Verificar se a conta foi inserida
SELECT id, nome, ativa, created_at FROM contas WHERE nome = 'Cora';