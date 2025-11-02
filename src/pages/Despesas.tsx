import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plus, Receipt, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { DespesaTable } from '../components/despesas/DespesaTable';
import { DespesaFilters } from '../components/despesas/DespesaFilters';
import { DespesaModal } from '../components/despesas/DespesaModal';
import { useDespesas } from '../hooks/useDespesas';
import { FiltrosDespesa, NovaDespesaForm, DespesaComDetalhes } from '../types/database';
import { formatBRL } from '../lib/utils';
import { toast } from 'sonner';

export default function Despesas() {
  const [filters, setFilters] = useState<FiltrosDespesa>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<DespesaComDetalhes | null>(null);

  const { 
    despesas, 
    loading, 
    createDespesa, 
    updateDespesa, 
    deleteDespesa,
    marcarComoPago,
    gerarProximaRecorrencia,
    refetch 
  } = useDespesas(filters);

  // Calcular estatísticas
  const totalDespesas = despesas.reduce((sum, despesa) => sum + despesa.valor, 0);
  const despesasPendentes = despesas.filter(d => d.status === 'pendente');
  const despesasVencidas = despesas.filter(d => d.status === 'vencido');
  const despesasPagas = despesas.filter(d => d.status === 'pago');
  const totalPendente = despesasPendentes.reduce((sum, despesa) => sum + despesa.valor, 0);
  const totalVencido = despesasVencidas.reduce((sum, despesa) => sum + despesa.valor, 0);
  const totalPago = despesasPagas.reduce((sum, despesa) => sum + despesa.valor, 0);

  const handleCreateDespesa = async (data: NovaDespesaForm) => {
    try {
      await createDespesa(data);
      setIsModalOpen(false);
      toast.success('Despesa criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar despesa');
    }
  };

  const handleEditDespesa = async (data: NovaDespesaForm) => {
    if (!editingDespesa) return;
    
    try {
      await updateDespesa(editingDespesa.id, data);
      setEditingDespesa(null);
      setIsModalOpen(false);
      toast.success('Despesa atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar despesa');
    }
  };

  const handleDeleteDespesa = async (despesa: DespesaComDetalhes) => {
    try {
      await deleteDespesa(despesa.id);
      toast.success('Despesa excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir despesa');
    }
  };

  const handleMarcarComoPago = async (despesa: DespesaComDetalhes) => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      await marcarComoPago(despesa.id, hoje, despesa.conta_id);
      toast.success('Despesa marcada como paga!');
      refetch();
    } catch (error) {
      console.error('Erro ao marcar despesa como paga:', error);
      toast.error('Erro ao marcar despesa como paga');
    }
  };

  const handleGerarProximaRecorrencia = async (despesa: DespesaComDetalhes) => {
    try {
      await gerarProximaRecorrencia(despesa.id);
      toast.success('Próxima recorrência gerada com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar próxima recorrência');
    }
  };

  const openEditModal = (despesa: DespesaComDetalhes) => {
    setEditingDespesa(despesa);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingDespesa(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDespesa(null);
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Despesas</h1>
          <p className="text-muted-foreground">
            Gerencie suas despesas fixas e avulsas
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(totalDespesas)}</div>
            <p className="text-xs text-muted-foreground">
              {despesas.length} despesa{despesas.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatBRL(totalPendente)}</div>
            <p className="text-xs text-muted-foreground">
              {despesasPendentes.length} despesa{despesasPendentes.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatBRL(totalVencido)}</div>
            <p className="text-xs text-muted-foreground">
              {despesasVencidas.length} despesa{despesasVencidas.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatBRL(totalPago)}</div>
            <p className="text-xs text-muted-foreground">
              {despesasPagas.length} despesa{despesasPagas.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <DespesaFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
      />

      {/* Tabela de Despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <DespesaTable
            despesas={despesas}
            onEdit={openEditModal}
            onDelete={handleDeleteDespesa}
            onMarcarComoPago={handleMarcarComoPago}
            onGerarProximaRecorrencia={handleGerarProximaRecorrencia}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Modal de Despesa */}
      <DespesaModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingDespesa ? handleEditDespesa : handleCreateDespesa}
        loading={loading}
        editingDespesa={editingDespesa}
      />
    </div>
  );
}