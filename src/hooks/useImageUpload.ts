import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload de imagem de perfil
  const uploadProfileImage = useCallback(async (file: File, profileId: string): Promise<string> => {
    try {
      setUploading(true);
      setError(null);

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error('Erro ao obter URL da imagem');
      }

      // Salvar registro na tabela profile_images
      const { error: dbError } = await supabase
        .from('profile_images')
        .insert({
          profile_id: profileId,
          image_url: data.publicUrl,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type
        });

      if (dbError) {
        // Se falhar ao salvar no banco, tentar remover o arquivo do storage
        await supabase.storage
          .from('profile-images')
          .remove([filePath]);
        
        throw dbError;
      }

      return data.publicUrl;
    } catch (err: any) {
      console.error('Erro no upload da imagem:', err);
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  // Deletar imagem de perfil
  const deleteProfileImage = useCallback(async (imageUrl: string) => {
    try {
      setUploading(true);
      setError(null);

      // Buscar o registro da imagem no banco
      const { data: imageRecord, error: fetchError } = await supabase
        .from('profile_images')
        .select('file_path')
        .eq('image_url', imageUrl)
        .single();

      if (fetchError) throw fetchError;

      if (imageRecord?.file_path) {
        // Remover arquivo do storage
        const { error: storageError } = await supabase.storage
          .from('profile-images')
          .remove([imageRecord.file_path]);

        if (storageError) {
          console.warn('Erro ao remover arquivo do storage:', storageError);
        }
      }

      // Remover registro do banco
      const { error: dbError } = await supabase
        .from('profile_images')
        .delete()
        .eq('image_url', imageUrl);

      if (dbError) throw dbError;
    } catch (err: any) {
      console.error('Erro ao deletar imagem:', err);
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  // Obter imagens do perfil
  const getProfileImages = useCallback(async (profileId: string) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('profile_images')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (err: any) {
      console.error('Erro ao buscar imagens do perfil:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Validar arquivo de imagem
  const validateImageFile = useCallback((file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não suportado. Use JPG, PNG, GIF ou WebP.');
    }

    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. O tamanho máximo é 5MB.');
    }

    return true;
  }, []);

  // Redimensionar imagem (opcional)
  const resizeImage = useCallback((file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Erro ao redimensionar imagem'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Upload com redimensionamento automático
  const uploadProfileImageWithResize = useCallback(async (file: File, profileId: string): Promise<string> => {
    try {
      // Validar arquivo
      validateImageFile(file);

      // Redimensionar se necessário
      let processedFile = file;
      if (file.size > 1024 * 1024) { // Se maior que 1MB, redimensionar
        processedFile = await resizeImage(file);
      }

      // Fazer upload
      return await uploadProfileImage(processedFile, profileId);
    } catch (err: any) {
      console.error('Erro no upload com redimensionamento:', err);
      throw err;
    }
  }, [uploadProfileImage, validateImageFile, resizeImage]);

  return {
    uploading,
    error,
    uploadProfileImage,
    uploadProfileImageWithResize,
    deleteProfileImage,
    getProfileImages,
    validateImageFile,
    resizeImage
  };
}