import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, CreditCard, TrendingUp, Hash, ArrowUpRight, ArrowDownLeft, Building2 } from 'lucide-react';
import { EntradaTable } from '../components/EntradaTable';
import { EntradaFilters } from '../components/EntradaFilters';
import { EntradaModal } from '../components/EntradaModal';
import { SaidaForm } from '../components/fornecedores/SaidaForm';
import { SaidaTable } from '../components/fornecedores/SaidaTable';
import { SaidaTypeSelector, TipoSaida } from '../components/saidas/SaidaTypeSelector';
import { AbatimentoForm } from '../components/saidas/AbatimentoForm';
import { AbatimentoEditModal } from '../components/saidas/AbatimentoEditModal';
import { useEntradas } from '../hooks/useEntradas';
import { useContas } from '../hooks/useContas';
import { useTotais } from '../hooks/useTotais';
import { usePagamentosFornecedores } from '../hooks/usePagamentosFornecedores';
import { useCompras } from '../hooks/useCompras';
import { useFornecedores } from '../hooks/useFornecedores';
import { useAbatimentos } from '../hooks/useAbatimentos';
import { FiltrosEntrada, NovaEntradaForm, Entrada, NovoAbatimentoForm, AbatimentoComDetalhes } from '../types/database';
import { formatBRL } from '../lib/utils';
import { toast } from 'sonner';

export default function Contas() {
  const [filters, setFilters] = useState<FiltrosEntrada>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entrada | null>(null);
  const [isNewSaidaOpen, setIsNewSaidaOpen] = useState(false);
  const [tipoSaidaSelecionado, setTipoSaidaSelecionado] = useState<TipoSaida | null>(null);
  const [activeTab, setActiveTab] = useState('entradas');
  const [editingAbatimento, setEditingAbatimento] = useState<AbatimentoComDetalhes | null>(null);
  const [isAbatimentoEditOpen, setIsAbatimentoEditOpen] = useState(false);

  const { contas } = useContas();
  const { totaisConta } = useTotais();
  const { 
    entradas, 
    loading, 
    createEntrada, 
    updateEntrada, 
    deleteEntrada, 
    refetch 
  } = useEntradas({ filtros: filters });

  // Hooks para fornecedores
  const { pagamentos, createPagamento, refetch: refreshPagamentos } = usePagamentosFornecedores();
  const { compras } = useCompras();
  const { fornecedores } = useFornecedores();

  // Hook para abatimentos
  const { abatimentos, createAbatimento, updateAbatimento, deleteAbatimento, refetch: refetchAbatimentos } = useAbatimentos();

  // Encontrar a conta Cora
  const contaCora = contas.find(conta => conta.nome.toLowerCase().includes('cora'));
  const totalCora = totaisConta.find(total => total.conta_id === contaCora?.id);
  
  // Calcular totais de saídas (pagamentos + abatimentos)
  const totalPagamentos = pagamentos?.reduce((sum, pagamento) => sum + pagamento.paid_value, 0) || 0;
  const totalAbatimentos = abatimentos?.reduce((sum, abatimento) => sum + abatimento.valor, 0) || 0;
  const totalSaidas = totalPagamentos + totalAbatimentos;
  const saldoAtual = (totalCora?.total_recebido || 0) - totalSaidas;

  console.log('🏦 Conta Cora encontrada:', contaCora);
  console.log('📊 Total Cora:', totalCora);
  console.log('💸 Total Saídas:', totalSaidas);
  console.log('💰 Saldo Atual:', saldoAtual);

  const handleCreateEntry = async (data: NovaEntradaForm) => {
    try {
      await createEntrada(data);
      setIsModalOpen(false);
      toast.success('Entrada criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar entrada');
    }
  };

  const handleEditEntry = async (data: NovaEntradaForm) => {
    if (!editingEntry) return;
    
    try {
      await updateEntrada(editingEntry.id, data);
      setEditingEntry(null);
      setIsModalOpen(false);
      toast.success('Entrada atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar entrada');
    }
  };

  const handleDeleteEntry = async (entrada: Entrada) => {
    try {
      await deleteEntrada(entrada.id);
      toast.success('Entrada excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir entrada');
    }
  };

  const openEditModal = (entrada: Entrada) => {
    setEditingEntry(entrada);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  const handleCreateSaida = async (data: any) => {
    try {
      await createPagamento(data);
      setIsNewSaidaOpen(false);
      setTipoSaidaSelecionado(null);
      toast.success('Saída registrada com sucesso!');
      refreshPagamentos();
    } catch (error: any) {
      console.error('Erro ao criar saída:', error);
      toast.error('Não foi possível registrar a saída');
    }
  };

  const handleCreateAbatimento = async (data: NovoAbatimentoForm) => {
    try {
      await createAbatimento(data);
      setIsNewSaidaOpen(false);
      setTipoSaidaSelecionado(null);
      toast.success('Abatimento registrado com sucesso!');
      // Refresh das saídas para incluir o novo abatimento
      refreshPagamentos();
      refetchAbatimentos();
    } catch (error: any) {
      console.error('Erro ao criar abatimento:', error);
      toast.error('Não foi possível registrar o abatimento');
    }
  };

  const handleEditAbatimento = (abatimento: AbatimentoComDetalhes) => {
    setEditingAbatimento(abatimento);
    setIsAbatimentoEditOpen(true);
  };

  const handleSaveAbatimento = async (id: string, data: { valor?: string; data_abatimento?: string; observacao?: string }) => {
    try {
      await updateAbatimento(id, data);
      toast.success('Abatimento atualizado com sucesso!');
      refetchAbatimentos();
      setIsAbatimentoEditOpen(false);
      setEditingAbatimento(null);
    } catch (error) {
      console.error('Erro ao atualizar abatimento:', error);
      toast.error('Erro ao atualizar abatimento');
      throw error;
    }
  };

  const handleDeleteAbatimento = async (id: string) => {
    console.log('🟡 HANDLE DELETE ABATIMENTO CHAMADO - ID:', id);
    try {
      console.log('🟡 EXECUTANDO deleteAbatimento...');
      await deleteAbatimento(id);
      console.log('🟡 deleteAbatimento EXECUTADO COM SUCESSO');
      toast.success('Abatimento excluído com sucesso!');
      refetchAbatimentos();
    } catch (error) {
      console.error('🟡 ERRO ao excluir abatimento:', error);
      toast.error('Erro ao excluir abatimento');
    }
  };

  const handleSelectTipoSaida = (tipo: TipoSaida) => {
    setTipoSaidaSelecionado(tipo);
  };

  const handleCancelSaida = () => {
    setIsNewSaidaOpen(false);
    setTipoSaidaSelecionado(null);
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas</h1>
          <p className="text-muted-foreground">
            Gerencie as entradas e saídas da conta Cora
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Entrada
          </Button>
          <Dialog open={isNewSaidaOpen} onOpenChange={setIsNewSaidaOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowDownLeft className="mr-2 h-4 w-4" />
                Nova Saída
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {!tipoSaidaSelecionado ? 'Nova Saída da Conta' : 
                   tipoSaidaSelecionado === 'fornecedor' ? 'Pagamento a Fornecedor' :
                   tipoSaidaSelecionado === 'abatimento_pre_saldo' ? 'Abatimento Pré-Saldo' :
                   tipoSaidaSelecionado === 'operacional' ? 'Despesa Operacional' :
                   'Movimentação Financeira'}
                </DialogTitle>
              </DialogHeader>
              
              {!tipoSaidaSelecionado ? (
                <SaidaTypeSelector
                  onSelectType={handleSelectTipoSaida}
                  onCancel={handleCancelSaida}
                />
              ) : tipoSaidaSelecionado === 'fornecedor' ? (
                <SaidaForm
                  onSubmit={handleCreateSaida}
                  onCancel={handleCancelSaida}
                  compras={compras || []}
                  fornecedores={fornecedores || []}
                />
              ) : tipoSaidaSelecionado === 'abatimento_pre_saldo' ? (
                <AbatimentoForm
                  onSubmit={handleCreateAbatimento}
                  onCancel={handleCancelSaida}
                />
              ) : (
                <div className="p-4 text-center">
                  <p className="text-muted-foreground mb-4">
                    Este tipo de saída ainda não foi implementado.
                  </p>
                  <Button variant="outline" onClick={handleCancelSaida}>
                    Voltar
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Card da Conta Cora */}
      {contaCora ? (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <CreditCard className="h-5 w-5" />
              Conta {contaCora.nome}
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Principal
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Recebido</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatBRL(totalCora?.total_recebido || 0)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ArrowDownLeft className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Saídas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatBRL(totalSaidas)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Hash className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Entradas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalCora?.total_entradas || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Saldo Atual</p>
                  <p className={`text-2xl font-bold ${saldoAtual >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                    {formatBRL(saldoAtual)}
                  </p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      ) : (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600">⚠️ Conta Cora não encontrada. Verifique se ela foi criada no banco de dados.</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs de Entradas e Saídas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entradas" className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Entradas ({entradas?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="saidas" className="flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            Saídas ({(pagamentos?.length || 0) + (abatimentos?.length || 0)})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entradas" className="space-y-4">
          {/* Filtros */}
          <EntradaFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
          />

          {/* Tabela de Entradas */}
          <Card>
            <CardHeader>
              <CardTitle>Entradas da Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <EntradaTable
                entradas={entradas}
                onEdit={openEditModal}
                onDelete={handleDeleteEntry}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saidas" className="space-y-4">
          {/* Tabela de Saídas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Saídas da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SaidaTable 
                pagamentos={pagamentos || []}
                abatimentos={abatimentos || []}
                compras={compras || []}
                fornecedores={fornecedores || []}
                onRefresh={refreshPagamentos}
                onEditAbatimento={handleEditAbatimento}
                onDeleteAbatimento={handleDeleteAbatimento}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Entrada */}
      <EntradaModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingEntry ? handleEditEntry : handleCreateEntry}
        editingEntry={editingEntry}
        loading={loading}
      />

      {/* Modal de Entrada */}
      <EntradaModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingEntry ? handleEditEntry : handleCreateEntry}
        editingEntry={editingEntry}
        loading={loading}
      />

      {/* Modal de Abatimento Edit */}
      <AbatimentoEditModal
        abatimento={editingAbatimento}
        isOpen={isAbatimentoEditOpen}
        onClose={() => {
          setIsAbatimentoEditOpen(false);
          setEditingAbatimento(null);
        }}
        onSave={handleSaveAbatimento}
        loading={loading}
      />
    </div>
  );
}