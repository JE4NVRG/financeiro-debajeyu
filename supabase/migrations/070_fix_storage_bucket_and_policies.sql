-- Corrigir bucket de storage e políticas RLS para upload de imagens
-- Migration: 070_fix_storage_bucket_and_policies

-- 1. Garantir que o bucket profile-images existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'profile-images', 
    'profile-images', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Remover todas as políticas existentes do storage
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;

-- 3. Criar políticas mais simples e permissivas para o bucket profile-images
-- Política para upload (INSERT) - permitir para usuários autenticados
CREATE POLICY "Allow authenticated users to upload profile images" ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (bucket_id = 'profile-images');

-- Política para visualização (SELECT) - permitir acesso público
CREATE POLICY "Allow public to view profile images" ON storage.objects
    FOR SELECT 
    TO public
    USING (bucket_id = 'profile-images');

-- Política para atualização (UPDATE) - permitir para usuários autenticados
CREATE POLICY "Allow authenticated users to update profile images" ON storage.objects
    FOR UPDATE 
    TO authenticated
    USING (bucket_id = 'profile-images')
    WITH CHECK (bucket_id = 'profile-images');

-- Política para exclusão (DELETE) - permitir para usuários autenticados
CREATE POLICY "Allow authenticated users to delete profile images" ON storage.objects
    FOR DELETE 
    TO authenticated
    USING (bucket_id = 'profile-images');

-- 4. Garantir permissões no storage
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- 5. Verificar se a tabela profile_images tem as políticas corretas
-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Allow authenticated users to view profile images" ON profile_images;
DROP POLICY IF EXISTS "Allow authenticated users to insert profile images" ON profile_images;
DROP POLICY IF EXISTS "Allow authenticated users to update profile images" ON profile_images;
DROP POLICY IF EXISTS "Allow authenticated users to delete profile images" ON profile_images;

-- Criar políticas simples para a tabela profile_images
CREATE POLICY "Enable all operations for authenticated users on profile_images" ON profile_images
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Garantir que RLS está habilitado
ALTER TABLE profile_images ENABLE ROW LEVEL SECURITY;