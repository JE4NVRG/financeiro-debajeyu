-- Função para criar usuário completo (auth + profile)
-- Migration: 20241213_create_user_profile_function

CREATE OR REPLACE FUNCTION create_user_profile(
    p_socio_id UUID,
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'socio'
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    new_profile_id UUID;
    result JSON;
BEGIN
    -- Criar usuário no auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO new_user_id;
    
    -- Criar perfil do usuário
    INSERT INTO user_profiles (
        user_id,
        socio_id,
        full_name,
        phone,
        role,
        is_active
    ) VALUES (
        new_user_id,
        p_socio_id,
        p_full_name,
        p_phone,
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
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile TO anon;