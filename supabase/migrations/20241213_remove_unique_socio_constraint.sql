-- Remover constraint unique de socio_id para permitir múltiplos usuários por sócio
-- Migration: 20241213_remove_unique_socio_constraint

-- Remover a constraint unique do socio_id
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_socio_id_key;

-- Comentário explicativo
COMMENT ON TABLE user_profiles IS 'Tabela de perfis de usuários - permite múltiplos usuários por sócio após remoção da constraint unique';