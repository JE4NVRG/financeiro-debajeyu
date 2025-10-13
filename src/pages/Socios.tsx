import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Plus, Edit, Trash2, Users, DollarSign, History, TrendingUp, UserPlus } from 'lucide-react';
import { useSocios } from '../hooks/useSocios';
import { useAbatimentos } from '../hooks/useAbatimentos';
import { HistoricoAbatimentos } from '../components/socios/HistoricoAbatimentos';
import { UserManagementSection } from '../components/socios/UserManagementSection';
import { Socio } from '../types/database';
import { formatBRL } from '../lib/utils';
import { useCurrencyMask } from '../hooks/useCurrencyMask';
import { useToast } from '../hooks/use-toast';

export function Socios() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [formData, setFormData] = useState<{nome: string; pre_saldo: number}>({
    nome: '',
    pre_saldo: 0
  });

  const { formatValue, parseValue } = useCurrencyMask();
  const { toast } = useToast();
  const { socios, loading, error, createSocio, updateSocio, deleteSocio, refetch } = useSocios();
  const { refetch: refetchAbatimentos } = useAbatimentos({});

  // Limpar formulário
  const clearForm = () => {
    setFormData({
      nome: '',
      pre_saldo: 0
    });
    setSelectedSocio(null);
  };

  // Abrir modal para novo sócio
  const handleNewSocio = () => {
    clearForm();
    setIsCreateModalOpen(true);
  };

  // Abrir modal para editar sócio
  const handleEditSocio = (socio: Socio) => {
    setSelectedSocio(socio);
    setFormData({
      nome: socio.nome,
      pre_saldo: socio.pre_saldo
    });
    setIsEditModalOpen(true);
  };

  // Abrir modal de histórico
  const handleViewHistory = (socio: Socio) => {
    setSelectedSocio(socio);
    setIsHistoricoModalOpen(true);
  };

  // Abrir gestão de usuários
  const handleUserManagement = (socio: Socio) => {
    setSelectedSocio(socio);
    setIsUserManagementOpen(true);
  };

  // Salvar sócio (criar ou atualizar)
  const handleSaveSocio = async () => {
    try {
      if (!formData.nome.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'Nome é obrigatório'
        });
        return;
      }

      if (selectedSocio) {
        // Atualizar sócio existente
        await updateSocio(selectedSocio.id, formData);
        toast({
          title: 'Sucesso',
          description: 'Sócio atualizado com sucesso'
        });
        setIsEditModalOpen(false);
      } else {
        // Criar novo sócio
        await createSocio(formData);
        toast({
          title: 'Sucesso',
          description: 'Sócio criado com sucesso'
        });
        setIsCreateModalOpen(false);
      }

      clearForm();
      refetch();
      refetchAbatimentos();
    } catch (error: any) {
      console.error('Erro ao salvar sócio:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar sócio'
      });
    }
  };

  // Abrir diálogo de confirmação para excluir sócio
  const handleDeleteSocio = (socio: Socio) => {
    setSelectedSocio(socio);
    setIsDeleteDialogOpen(true);
  };

  // Confirmar exclusão do sócio
  const confirmDeleteSocio = async () => {
    if (!selectedSocio) return;

    try {
      await deleteSocio(selectedSocio.id);
      toast({
        title: 'Sucesso',
        description: 'Sócio excluído com sucesso'
      });
      setIsDeleteDialogOpen(false);
      clearForm();
      refetch();
      refetchAbatimentos();
    } catch (error: any) {
      console.error('Erro ao excluir sócio:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir sócio'
      });
    }
  };

  // Calcular total de pré-saldo
  const totalPreSaldo = socios.reduce((sum, socio) => sum + socio.pre_saldo, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Erro ao carregar sócios: {error?.message || 'Erro desconhecido'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sócios</h1>
          <p className="text-muted-foreground">
            Gerencie os sócios, seus pré-saldos e usuários de acesso
          </p>
        </div>
        <Button onClick={handleNewSocio}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Sócio
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-900 text-base">
              <DollarSign className="h-4 w-4" />
              Total Pré-Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatBRL(totalPreSaldo)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900 text-base">
              <Users className="h-4 w-4" />
              Total de Sócios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {socios.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de sócios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Sócios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {socios.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum sócio cadastrado</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Pré-Saldo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {socios.map((socio) => (
                    <TableRow key={socio.id}>
                      <TableCell className="font-medium">{socio.nome}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={socio.pre_saldo > 0 ? "default" : "secondary"}
                          className={socio.pre_saldo > 0 ? "bg-green-100 text-green-800" : ""}
                        >
                          {formatBRL(socio.pre_saldo)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={socio.pre_saldo > 0 ? "default" : "secondary"}>
                          {socio.pre_saldo > 0 ? "Com Saldo" : "Sem Saldo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          Sem usuário
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserManagement(socio)}
                            title="Gerenciar usuário"
                            className="bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewHistory(socio)}
                            title="Ver histórico de abatimentos"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSocio(socio)}
                            title="Editar sócio"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSocio(socio)}
                            title="Excluir sócio"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para criar sócio */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Sócio</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do sócio"
              />
            </div>
            
            <div>
              <Label htmlFor="pre_saldo">Pré-Saldo (R$)</Label>
              <Input
                id="pre_saldo"
                type="number"
                step="0.01"
                min="0"
                value={formData.pre_saldo}
                onChange={(e) => setFormData({ ...formData, pre_saldo: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSocio}>
              Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para editar sócio */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sócio</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome_edit">Nome</Label>
              <Input
                id="nome_edit"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do sócio"
              />
            </div>
            
            <div>
              <Label htmlFor="pre_saldo_edit">Pré-Saldo (R$)</Label>
              <Input
                id="pre_saldo_edit"
                type="number"
                step="0.01"
                min="0"
                value={formData.pre_saldo}
                onChange={(e) => setFormData({ ...formData, pre_saldo: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSocio}>
              Atualizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Sócio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o sócio "{selectedSocio?.nome}"? 
              Esta ação não pode ser desfeita e todos os abatimentos relacionados serão mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSocio} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de histórico de abatimentos */}
      <HistoricoAbatimentos
        isOpen={isHistoricoModalOpen}
        onClose={() => setIsHistoricoModalOpen(false)}
        socioId={selectedSocio?.id}
        socioNome={selectedSocio?.nome}
      />

      {/* Seção de Usuários do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Usuários do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Usuário atual logado */}
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-900">je4ndev</h3>
                    <p className="text-sm text-green-700">Administrador do Sistema</p>
                    <p className="text-xs text-green-600">je4ndev@debajeyu.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    Ativo
                  </Badge>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    Admin
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Online
                  </Badge>
                </div>
              </div>
            </div>

            {/* Placeholder para outros usuários */}
            <div className="text-center py-6 text-muted-foreground">
              <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Outros usuários aparecerão aqui quando forem criados</p>
              <p className="text-xs mt-1">Use o botão "Gerenciar usuário" em cada sócio para criar novos usuários</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de gestão de usuários */}
      <UserManagementSection
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        socio={selectedSocio}
      />
    </div>
  )
}