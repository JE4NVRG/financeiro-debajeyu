-- Corrigir políticas RLS da tabela user_profiles para evitar recursão infinita
-- Remover todas as políticas existentes e criar novas mais simples

-- Desabilitar RLS temporariamente
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;

-- Reabilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas simples sem recursão
-- Política para SELECT: permitir acesso a todos os perfis para usuários autenticados
CREATE POLICY "Allow authenticated users to read profiles" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para INSERT: permitir inserção para usuários autenticados
CREATE POLICY "Allow authenticated users to insert profiles" ON user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política para UPDATE: permitir atualização para usuários autenticados
CREATE POLICY "Allow authenticated users to update profiles" ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política para DELETE: permitir exclusão para usuários autenticados
CREATE POLICY "Allow authenticated users to delete profiles" ON user_profiles
    FOR DELETE
    TO authenticated
    USING (true);

-- Comentário explicativo
COMMENT ON TABLE user_profiles IS 'Tabela de perfis de usuários com políticas RLS simplificadas para evitar recursão infinita';