import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Camera, Upload, X, Trash2, User } from 'lucide-react';
import { UserProfile } from '../../types/database';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useUserManagement } from '../../hooks/useUserManagement';
import { useToast } from '../../hooks/use-toast';

interface ProfileImageUploadProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onImageUpdated: () => void;
}

export function ProfileImageUpload({ isOpen, onClose, profile, onImageUpdated }: ProfileImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadProfileImage, deleteProfileImage } = useImageUpload();
  const { updateUserProfile } = useUserManagement();
  const { toast } = useToast();

  // Limpar estado ao fechar
  const handleClose = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    onClose();
  };

  // Selecionar arquivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione apenas arquivos de imagem'
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB'
      });
      return;
    }

    setSelectedFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Fazer upload da imagem
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);

      // Upload da imagem
      const imageUrl = await uploadProfileImage(selectedFile, profile.id);

      // Atualizar perfil com nova URL da imagem
      await updateUserProfile(profile.id, {
        avatar_url: imageUrl
      });

      toast({
        title: 'Sucesso',
        description: 'Foto de perfil atualizada com sucesso'
      });

      onImageUpdated();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao fazer upload da imagem'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remover foto atual
  const handleRemovePhoto = async () => {
    try {
      setIsUploading(true);

      // Se há uma foto atual, deletar do storage
      if (profile.avatar_url) {
        await deleteProfileImage(profile.avatar_url);
      }

      // Atualizar perfil removendo a URL da imagem
      await updateUserProfile(profile.id, {
        avatar_url: ''
      });

      toast({
        title: 'Sucesso',
        description: 'Foto de perfil removida com sucesso'
      });

      onImageUpdated();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao remover foto:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover foto'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Abrir seletor de arquivo
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Alterar Foto de Perfil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview da imagem atual ou nova */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={previewUrl || profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>

            <div className="text-center">
              <p className="font-medium">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {previewUrl ? 'Nova foto selecionada' : 
                 profile.avatar_url ? 'Foto atual' : 'Nenhuma foto'}
              </p>
            </div>
          </div>

          {/* Input de arquivo (oculto) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Botões de ação */}
          <div className="space-y-3">
            {!previewUrl ? (
              <>
                <Button
                  onClick={openFileSelector}
                  className="w-full"
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Nova Foto
                </Button>

                {profile.avatar_url && (
                  <Button
                    variant="outline"
                    onClick={handleRemovePhoto}
                    disabled={isUploading}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Remover Foto Atual
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  Salvar Nova Foto
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  disabled={isUploading}
                  className="w-full"
                >
                  Cancelar Seleção
                </Button>
              </>
            )}
          </div>

          {/* Informações sobre o upload */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-700 space-y-1">
              <p className="font-medium">Requisitos da imagem:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Formatos aceitos: JPG, PNG, GIF, WebP</li>
                <li>Tamanho máximo: 5MB</li>
                <li>Recomendado: imagem quadrada (1:1)</li>
                <li>Resolução mínima: 200x200 pixels</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botão de fechar */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}