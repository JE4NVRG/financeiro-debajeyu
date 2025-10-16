-- Corrigir políticas RLS para upload de imagens de perfil
-- Migration: 068_fix_profile_images_storage_rls

-- 1. Primeiro, verificar se o bucket profile-images existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Remover políticas existentes do storage
DROP POLICY IF EXISTS "Users can upload own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;

-- 3. Criar políticas para o storage bucket profile-images
-- Política para upload (INSERT)
CREATE POLICY "Users can upload profile images" ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        bucket_id = 'profile-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para visualização (SELECT) - permitir acesso público
CREATE POLICY "Public can view profile images" ON storage.objects
    FOR SELECT 
    TO public
    USING (bucket_id = 'profile-images');

-- Política para atualização (UPDATE)
CREATE POLICY "Users can update own profile images" ON storage.objects
    FOR UPDATE 
    TO authenticated
    USING (
        bucket_id = 'profile-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para exclusão (DELETE)
CREATE POLICY "Users can delete own profile images" ON storage.objects
    FOR DELETE 
    TO authenticated
    USING (
        bucket_id = 'profile-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 4. Corrigir políticas RLS da tabela profile_images
-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own profile images" ON profile_images;
DROP POLICY IF EXISTS "Users can manage own profile images" ON profile_images;

-- Criar políticas mais simples para a tabela profile_images
-- Política para SELECT
CREATE POLICY "Allow authenticated users to view profile images" ON profile_images
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para INSERT
CREATE POLICY "Allow authenticated users to insert profile images" ON profile_images
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política para UPDATE
CREATE POLICY "Allow authenticated users to update profile images" ON profile_images
    FOR UPDATE
    TO authenticated
    USING (true);

-- Política para DELETE
CREATE POLICY "Allow authenticated users to delete profile images" ON profile_images
    FOR DELETE
    TO authenticated
    USING (true);

-- 5. Garantir que as permissões estão corretas
GRANT ALL ON profile_images TO authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;