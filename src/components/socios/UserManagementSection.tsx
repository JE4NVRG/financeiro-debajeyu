import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { UserPlus, User, Shield, ShieldCheck, Eye, EyeOff, Mail, Lock, Settings, Trash2 } from 'lucide-react';
import { Socio, CreateUserForm, UserManagementView } from '../../types/database';
import { useUserManagement } from '../../hooks/useUserManagement';
import { useToast } from '../../hooks/use-toast';

interface UserManagementSectionProps {
  isOpen: boolean;
  onClose: () => void;
  socio: Socio | null;
}

export function UserManagementSection({ isOpen, onClose, socio }: UserManagementSectionProps) {
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserManagementView | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<CreateUserForm>({
    socio_id: '',
    username: '',
    password: '',
    confirm_password: '',
    full_name: '',
    role: 'socio'
  });

  const { toast } = useToast();
  const { 
    users, 
    loading, 
    error, 
    createUser, 
    deactivateUser, 
    getUsersBySocio,
    refetch 
  } = useUserManagement();

  // Carregar usuários quando o modal abrir
  useEffect(() => {
    if (isOpen && socio?.id) {
      setFormData(prev => ({ ...prev, socio_id: socio.id, full_name: socio.nome }));
      getUsersBySocio(socio.id);
    }
  }, [isOpen, socio, getUsersBySocio]);

  // Limpar formulário
  const clearForm = () => {
    setFormData({
      socio_id: socio?.id || '',
      username: '',
      password: '',
      confirm_password: '',
      full_name: socio?.nome || '',
      role: 'socio'
    });
    setShowPassword(false);
  };

  // Abrir modal para criar usuário
  const handleCreateUser = () => {
    clearForm();
    setIsCreateUserModalOpen(true);
  };

  // Salvar novo usuário
  const handleSaveUser = async () => {
    try {
      if (!formData.username.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Nome de usuário é obrigatório'
        });
        return;
      }

      if (!formData.password.trim() || formData.password.length < 6) {
        toast({
          title: 'Erro de validação',
          description: 'Senha deve ter pelo menos 6 caracteres'
        });
        return;
      }

      if (formData.password !== formData.confirm_password) {
        toast({
          title: 'Erro de validação',
          description: 'As senhas não coincidem'
        });
        return;
      }

      if (!formData.full_name.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Nome completo é obrigatório'
        });
        return;
      }

      await createUser(formData);
      
      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso'
      });
      
      setIsCreateUserModalOpen(false);
      clearForm();
      
      // Recarregar lista de usuários
      if (socio?.id) {
        getUsersBySocio(socio.id);
      }
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar usuário'
      });
    }
  };

  // Abrir diálogo de confirmação para desativar usuário
  const handleDeactivateUser = (user: UserManagementView) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Confirmar desativação do usuário
  const confirmDeactivateUser = async () => {
    if (!selectedUser) return;

    try {
      await deactivateUser(selectedUser.profile_id);
      
      toast({
        title: 'Sucesso',
        description: 'Usuário desativado com sucesso'
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      
      // Recarregar lista de usuários
      if (socio?.id) {
        getUsersBySocio(socio.id);
      }
    } catch (error: any) {
      console.error('Erro ao desativar usuário:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao desativar usuário'
      });
    }
  };

  // Gerar senha aleatória
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'socio':
        return <Badge className="bg-blue-100 text-blue-800"><User className="h-3 w-3 mr-1" />Sócio</Badge>;
      case 'socio_limitado':
        return <Badge className="bg-gray-100 text-gray-800"><Eye className="h-3 w-3 mr-1" />Limitado</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Inativo</Badge>
    );
  };

  if (!socio) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Gestão de Usuários - {socio.nome}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header com botão de criar usuário */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Usuários de Acesso</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie os usuários que podem acessar o sistema para este sócio
                </p>
              </div>
              <Button onClick={handleCreateUser} className="bg-purple-600 hover:bg-purple-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Usuário
              </Button>
            </div>

            {/* Lista de usuários */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Usuários Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum usuário cadastrado para este sócio</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Clique em "Criar Usuário" para dar acesso ao sistema
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.profile_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {user.email}
                              {user.phone && (
                                <>
                                  <span>•</span>
                                  <span>{user.phone}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {getRoleBadge(user.role)}
                              {getStatusBadge(user.is_active)}
                              <Badge variant="outline" className="text-xs">
                                {user.permissions_count} permissões
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivateUser(user)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para criar usuário */}
      <Dialog open={isCreateUserModalOpen} onOpenChange={setIsCreateUserModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Usuário para {socio.nome}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nome completo do usuário"
              />
            </div>

            <div>
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="nome_usuario"
              />
            </div>

            <div>
              <Label htmlFor="role">Tipo de Acesso</Label>
              <Select value={formData.role} onValueChange={(value: 'socio' | 'socio_limitado') => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="socio">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Sócio - Acesso completo aos seus dados
                    </div>
                  </SelectItem>
                  <SelectItem value="socio_limitado">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Sócio Limitado - Apenas visualização
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Senha de acesso"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  title="Gerar senha aleatória"
                >
                  <Lock className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 6 caracteres. O usuário poderá alterar a senha após o primeiro login.
              </p>
            </div>

            <div>
              <Label htmlFor="confirm_password">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showPassword ? "text" : "password"}
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  placeholder="Confirme a senha"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} className="bg-purple-600 hover:bg-purple-700">
              Criar Usuário
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para desativar usuário */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar o usuário "{selectedUser?.full_name}"? 
              O usuário não conseguirá mais acessar o sistema, mas seus dados serão mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeactivateUser} 
              className="bg-red-600 hover:bg-red-700"
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}