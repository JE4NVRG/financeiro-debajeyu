-- Sistema de Gestão de Usuários dos Sócios
-- Migration: 20241211_create_user_management_system

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    socio_id UUID REFERENCES socios(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'socio' CHECK (role IN ('admin', 'socio', 'socio_limitado')),
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(socio_id)
);

-- Create user_permissions table
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '{"read": true, "write": false, "delete": false}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_profile_id, module_name)
);

-- Create profile_images table
CREATE TABLE profile_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_socio_id ON user_profiles(socio_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_permissions_user_profile_id ON user_permissions(user_profile_id);
CREATE INDEX idx_user_permissions_module_name ON user_permissions(module_name);
CREATE INDEX idx_profile_images_user_profile_id ON profile_images(user_profile_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- RLS Policies for user_permissions
CREATE POLICY "Users can view own permissions" ON user_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = user_permissions.user_profile_id 
            AND up.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all permissions" ON user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- RLS Policies for profile_images
CREATE POLICY "Users can view own profile images" ON profile_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = profile_images.user_profile_id 
            AND up.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own profile images" ON profile_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = profile_images.user_profile_id 
            AND up.user_id = auth.uid()
        )
    );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_permissions TO authenticated;
GRANT SELECT, INSERT, DELETE ON profile_images TO authenticated;

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile images
CREATE POLICY "Users can upload own profile image" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view profile images" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can update own profile image" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own profile image" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Function to create socio user profile after auth user creation
CREATE OR REPLACE FUNCTION create_user_profile_for_socio(
    p_user_id UUID,
    p_socio_id UUID,
    p_full_name TEXT,
    p_role TEXT DEFAULT 'socio'
)
RETURNS JSON AS $$
DECLARE
    new_profile_id UUID;
    result JSON;
BEGIN
    -- Insert user profile
    INSERT INTO user_profiles (user_id, socio_id, full_name, role)
    VALUES (p_user_id, p_socio_id, p_full_name, p_role)
    RETURNING id INTO new_profile_id;
    
    -- Create default permissions for socio
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
    END IF;
    
    result := json_build_object(
        'success', true,
        'message', 'User profile created successfully',
        'profile_id', new_profile_id,
        'user_id', p_user_id,
        'socio_id', p_socio_id,
        'role', p_role
    );
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile with permissions
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
        'socio_nome', s.nome
    ) INTO profile_data
    FROM user_profiles up
    LEFT JOIN socios s ON s.id = up.socio_id
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_user_profile_for_socio TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_with_permissions TO authenticated;

-- Create view for easier user management
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
    au.email,
    au.created_at as auth_created_at,
    COUNT(uperm.id) as permissions_count
FROM user_profiles up
LEFT JOIN socios s ON s.id = up.socio_id
LEFT JOIN auth.users au ON au.id = up.user_id
LEFT JOIN user_permissions uperm ON uperm.user_profile_id = up.id AND uperm.is_active = true
GROUP BY up.id, s.nome, au.email, au.created_at;

-- Grant access to the view
GRANT SELECT ON user_management_view TO authenticated;