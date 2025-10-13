-- Desabilitar RLS temporariamente na tabela user_profiles para resolver recursão infinita
-- Esta é uma medida de emergência para corrigir os erros no console

-- Desabilitar RLS na tabela user_profiles
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes que podem estar causando recursão
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON user_profiles;

-- Comentário explicativo
COMMENT ON TABLE user_profiles IS 'Tabela de perfis de usuários - RLS desabilitado temporariamente para resolver recursão infinita';