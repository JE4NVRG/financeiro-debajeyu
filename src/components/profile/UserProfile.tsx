import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { User, Mail, Phone, Shield, Camera, Lock, Settings, Calendar } from 'lucide-react';
import { UserProfile as UserProfileType } from '../../types/database';
import { useUserManagement } from '../../hooks/useUserManagement';
import { useToast } from '../../hooks/use-toast';
import { EditProfileModal } from './EditProfileModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ProfileImageUpload } from './ProfileImageUpload';

interface UserProfileProps {
  className?: string;
}

export function UserProfile({ className }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  
  const { getCurrentUserProfile, loading } = useUserManagement();
  const { toast } = useToast();

  // Carregar perfil do usuário
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile);
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o perfil do usuário'
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800"><Shield className="h-3 w-3 mr-1" />Administrador</Badge>;
      case 'socio':
        return <Badge className="bg-blue-100 text-blue-800"><User className="h-3 w-3 mr-1" />Sócio</Badge>;
      case 'socio_limitado':
        return <Badge className="bg-gray-100 text-gray-800"><User className="h-3 w-3 mr-1" />Sócio Limitado</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Perfil não encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Meu Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seção do Avatar e Informações Básicas */}
          <div className="flex items-start space-x-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={() => setIsImageUploadOpen(true)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 space-y-2">
              <div>
                <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleBadge(profile.role)}
                  <Badge variant={profile.is_active ? "default" : "destructive"}>
                    {profile.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                {profile.usuarios?.login && (
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    <span>Login: {profile.usuarios.login}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Membro desde {formatDate(profile.created_at)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações do Sócio Vinculado */}
          {profile.socios && (
            <div>
              <h3 className="font-semibold mb-2">Sócio Vinculado</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{profile.socios.nome}</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Ações do Perfil */}
          <div className="space-y-3">
            <h3 className="font-semibold">Configurações da Conta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setIsEditModalOpen(true)}
              >
                <User className="h-4 w-4 mr-2" />
                Editar Informações Pessoais
              </Button>
              
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Alterar Senha
              </Button>
            </div>
          </div>

          {/* Informações de Segurança */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Segurança da Conta</p>
                <p className="text-blue-700 mt-1">
                  Suas informações estão protegidas. Mantenha sua senha segura e não a compartilhe com terceiros.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onProfileUpdated={loadProfile}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      <ProfileImageUpload
        isOpen={isImageUploadOpen}
        onClose={() => setIsImageUploadOpen(false)}
        profile={profile}
        onImageUpdated={loadProfile}
      />
    </>
  );
}