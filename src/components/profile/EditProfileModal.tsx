import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { User, Mail, Phone, Save, X } from 'lucide-react';
import { UserProfile, UpdateProfileForm } from '../../types/database';
import { useUserManagement } from '../../hooks/useUserManagement';
import { useToast } from '../../hooks/use-toast';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onProfileUpdated: () => void;
}

export function EditProfileModal({ isOpen, onClose, profile, onProfileUpdated }: EditProfileModalProps) {
  const [formData, setFormData] = useState<UpdateProfileForm>({
    full_name: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { updateUserProfile } = useUserManagement();
  const { toast } = useToast();

  // Preencher formulário quando o modal abrir
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        full_name: profile.full_name,
        phone: profile.phone || ''
      });
    }
  }, [isOpen, profile]);

  // Limpar formulário ao fechar
  const handleClose = () => {
    setFormData({
      full_name: '',
      phone: ''
    });
    onClose();
  };

  // Salvar alterações
  const handleSave = async () => {
    try {
      setIsSubmitting(true);

      // Validações
      if (!formData.full_name.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Nome completo é obrigatório'
        });
        return;
      }

      // Verificar se houve mudanças
      const hasChanges = 
        formData.full_name !== profile.full_name ||
        formData.phone !== (profile.phone || '');

      if (!hasChanges) {
        toast({
          title: 'Nenhuma alteração',
          description: 'Não foram detectadas alterações no perfil'
        });
        handleClose();
        return;
      }

      // Preparar dados para atualização
      const updates: Partial<{
        full_name: string;
        phone: string;
        avatar_url: string;
      }> = {
        full_name: formData.full_name.trim()
      };

      // Adicionar telefone apenas se foi fornecido
      if (formData.phone.trim()) {
        updates.phone = formData.phone.trim();
      } else {
        updates.phone = '';
      }

      await updateUserProfile(profile.id, updates);

      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso'
      });

      onProfileUpdated();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar perfil'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatar telefone enquanto digita
  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (11) 99999-9999
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Informações Pessoais
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome Completo */}
          <div>
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Seu nome completo"
              disabled={isSubmitting}
            />
          </div>

          {/* Email (somente leitura) */}
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              O email não pode ser alterado. Entre em contato com o administrador se necessário.
            </p>
          </div>

          {/* Telefone */}
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <div className="relative">
              <Input
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                disabled={isSubmitting}
                maxLength={15}
              />
              <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Informação sobre o sócio vinculado */}
          {profile.socios && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Sócio Vinculado</p>
                  <p className="text-blue-700">{profile.socios.nome}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}