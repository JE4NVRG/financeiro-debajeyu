import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Lock, Eye, EyeOff, Shield, CheckCircle, X } from 'lucide-react';
import { ChangePasswordForm } from '../../types/database';
import { useUserManagement } from '../../hooks/useUserManagement';
import { useToast } from '../../hooks/use-toast';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState<ChangePasswordForm>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { changePassword } = useUserManagement();
  const { toast } = useToast();

  // Limpar formulário ao fechar
  const handleClose = () => {
    setFormData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  // Validar força da senha
  const validatePasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    
    return {
      checks,
      score,
      strength: score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong'
    };
  };

  const passwordValidation = validatePasswordStrength(formData.new_password);

  // Alterar senha
  const handleChangePassword = async () => {
    try {
      setIsSubmitting(true);

      // Validações
      if (!formData.new_password.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Nova senha é obrigatória'
        });
        return;
      }

      if (formData.new_password.length < 6) {
        toast({
          title: 'Erro de validação',
          description: 'A senha deve ter pelo menos 6 caracteres'
        });
        return;
      }

      if (formData.new_password !== formData.confirm_password) {
        toast({
          title: 'Erro de validação',
          description: 'As senhas não coincidem'
        });
        return;
      }

      if (passwordValidation.strength === 'weak') {
        toast({
          title: 'Senha muito fraca',
          description: 'Por favor, escolha uma senha mais segura'
        });
        return;
      }

      await changePassword(formData.new_password);

      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso'
      });

      handleClose();
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar senha'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gerar senha segura
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Garantir pelo menos um de cada tipo
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Maiúscula
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minúscula
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Número
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Especial
    
    // Completar com caracteres aleatórios
    for (let i = 4; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Embaralhar a senha
    const shuffled = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData({
      ...formData,
      new_password: shuffled,
      confirm_password: shuffled
    });
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'strong': return 'text-green-600';
      default: return 'text-gray-400';
    }
  };

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'weak': return 'Fraca';
      case 'medium': return 'Média';
      case 'strong': return 'Forte';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nova Senha */}
          <div>
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                placeholder="Digite sua nova senha"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Indicador de força da senha */}
            {formData.new_password && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Força da senha:</span>
                  <span className={`text-sm font-medium ${getStrengthColor(passwordValidation.strength)}`}>
                    {getStrengthText(passwordValidation.strength)}
                  </span>
                </div>
                
                {/* Barra de progresso */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordValidation.strength === 'weak' ? 'bg-red-500 w-1/3' :
                      passwordValidation.strength === 'medium' ? 'bg-yellow-500 w-2/3' :
                      'bg-green-500 w-full'
                    }`}
                  />
                </div>
                
                {/* Critérios de validação */}
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center gap-1 ${passwordValidation.checks.length ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    Pelo menos 8 caracteres
                  </div>
                  <div className={`flex items-center gap-1 ${passwordValidation.checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    Uma letra maiúscula
                  </div>
                  <div className={`flex items-center gap-1 ${passwordValidation.checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    Uma letra minúscula
                  </div>
                  <div className={`flex items-center gap-1 ${passwordValidation.checks.number ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    Um número
                  </div>
                  <div className={`flex items-center gap-1 ${passwordValidation.checks.special ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    Um caractere especial
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                placeholder="Confirme sua nova senha"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Validação de confirmação */}
            {formData.confirm_password && (
                  <div className="mt-1 text-sm">
                    {formData.new_password === formData.confirm_password ? (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    As senhas coincidem
                  </p>
                ) : (
                  <p className="text-xs text-red-600">
                    As senhas não coincidem
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Botão para gerar senha */}
          <Button
            type="button"
            variant="outline"
            onClick={generateSecurePassword}
            className="w-full"
            disabled={isSubmitting}
          >
            <Shield className="h-4 w-4 mr-2" />
            Gerar Senha Segura
          </Button>

          {/* Dica de segurança */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Dica de Segurança</p>
                <p className="mt-1">
                  Use uma senha única que você não utiliza em outros sites. 
                  Considere usar um gerenciador de senhas para maior segurança.
                </p>
              </div>
            </div>
          </div>
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
            onClick={handleChangePassword}
            disabled={isSubmitting || passwordValidation.strength === 'weak' || formData.new_password !== formData.confirm_password}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Lock className="h-4 w-4 mr-2" />
            )}
            Alterar Senha
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}