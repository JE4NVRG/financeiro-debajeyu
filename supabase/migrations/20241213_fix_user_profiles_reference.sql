-- Corrigir referência da tabela user_profiles para usar a tabela usuarios customizada
-- Migration: 20241213_fix_user_profiles_reference

-- Primeiro, remover a constraint existente
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

-- Alterar a coluna para referenciar a tabela usuarios ao invés de auth.users
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- Atualizar a view user_management_view para usar a tabela usuarios
DROP VIEW IF EXISTS user_management_view;

CREATE VIEW user_management_view AS
SELECT 
    up.id as profile_id,
    up.user_id,
    up.socio_id,
    up.full_name,
    up.phone,
    up.avatar_url,
    up.role,
    up.is_active,
    up.created_at,
    up.updated_at,
    s.nome as socio_nome,
    u.login as username,
    u.criado_em as auth_created_at,
    COALESCE(perm_count.permissions_count, 0) as permissions_count
FROM user_profiles up
LEFT JOIN socios s ON s.id = up.socio_id
LEFT JOIN usuarios u ON u.id = up.user_id
LEFT JOIN (
    SELECT 
        user_profile_id,
        COUNT(*) as permissions_count
    FROM user_permissions 
    WHERE is_active = true
    GROUP BY user_profile_id
) perm_count ON perm_count.user_profile_id = up.id
ORDER BY up.created_at DESC;

-- Atualizar a função get_user_profile_with_permissions para usar a tabela usuarios
CREATE OR REPLACE FUNCTION get_user_profile_with_permissions(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    profile_data JSON;
    permissions_data JSON;
    result JSON;
BEGIN
    -- Get user profile
    SELECT json_build_object(
        'id', up.id,
        'user_id', up.user_id,
        'socio_id', up.socio_id,
        'full_name', up.full_name,
        'phone', up.phone,
        'avatar_url', up.avatar_url,
        'role', up.role,
        'is_active', up.is_active,
        'preferences', up.preferences,
        'created_at', up.created_at,
        'updated_at', up.updated_at,
        'socio_nome', s.nome,
        'username', u.login
    ) INTO profile_data
    FROM user_profiles up
    LEFT JOIN socios s ON s.id = up.socio_id
    LEFT JOIN usuarios u ON u.id = up.user_id
    WHERE up.user_id = p_user_id;
    
    -- Get user permissions
    SELECT json_agg(
        json_build_object(
            'module_name', uperm.module_name,
            'permissions', uperm.permissions,
            'is_active', uperm.is_active
        )
    ) INTO permissions_data
    FROM user_permissions uperm
    JOIN user_profiles up ON up.id = uperm.user_profile_id
    WHERE up.user_id = p_user_id AND uperm.is_active = true;
    
    result := json_build_object(
        'profile', profile_data,
        'permissions', COALESCE(permissions_data, '[]'::json)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para criar usuário usando a tabela usuarios
CREATE OR REPLACE FUNCTION create_user_with_profile(
    p_socio_id UUID,
    p_username TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_role TEXT DEFAULT 'socio'
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    new_profile_id UUID;
    result JSON;
BEGIN
    -- Criar usuário na tabela usuarios
    INSERT INTO usuarios (login, senha_hash)
    VALUES (p_username, crypt(p_password, gen_salt('bf')))
    RETURNING id INTO new_user_id;
    
    -- Criar perfil do usuário
    INSERT INTO user_profiles (
        user_id,
        socio_id,
        full_name,
        role,
        is_active
    ) VALUES (
        new_user_id,
        p_socio_id,
        p_full_name,
        p_role,
        true
    )
    RETURNING id INTO new_profile_id;
    
    -- Criar permissões padrão baseadas no role
    IF p_role = 'socio' THEN
        INSERT INTO user_permissions (user_profile_id, module_name, permissions) VALUES
        (new_profile_id, 'dashboard', '{"read": true, "write": false, "delete": false}'),
        (new_profile_id, 'compras', '{"read": true, "write": false, "delete": false}'),
        (new_profile_id, 'entradas', '{"read": true, "write": false, "delete": false}'),
        (new_profile_id, 'perfil', '{"read": true, "write": true, "delete": false}');
    ELSIF p_role = 'socio_limitado' THEN
        INSERT INTO user_permissions (user_profile_id, module_name, permissions) VALUES
        (new_profile_id, 'dashboard', '{"read": true, "write": false, "delete": false}'),
        (new_profile_id, 'perfil', '{"read": true, "write": true, "delete": false}');
    ELSIF p_role = 'admin' THEN
        INSERT INTO user_permissions (user_profile_id, module_name, permissions) VALUES
        (new_profile_id, 'dashboard', '{"read": true, "write": true, "delete": true}'),
        (new_profile_id, 'socios', '{"read": true, "write": true, "delete": true}'),
        (new_profile_id, 'compras', '{"read": true, "write": true, "delete": true}'),
        (new_profile_id, 'entradas', '{"read": true, "write": true, "delete": true}'),
        (new_profile_id, 'marketplaces', '{"read": true, "write": true, "delete": true}'),
        (new_profile_id, 'contas', '{"read": true, "write": true, "delete": true}'),
        (new_profile_id, 'usuarios', '{"read": true, "write": true, "delete": true}'),
        (new_profile_id, 'perfil', '{"read": true, "write": true, "delete": false}');
    END IF;
    
    result := json_build_object(
        'success', true,
        'message', 'Usuário criado com sucesso',
        'user_id', new_user_id,
        'profile_id', new_profile_id,
        'socio_id', p_socio_id,
        'role', p_role
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'message', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_user_profile_with_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_with_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_with_profile TO anon;