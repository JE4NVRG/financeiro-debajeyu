import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plus, CreditCard, TrendingUp, Hash, ArrowUpRight } from 'lucide-react';
import { EntradaTable } from '../components/EntradaTable';
import { EntradaFilters } from '../components/EntradaFilters';
import { EntradaModal } from '../components/EntradaModal';
import { useEntradas } from '../hooks/useEntradas';
import { useContas } from '../hooks/useContas';
import { useTotais } from '../hooks/useTotais';
import { FiltrosEntrada, NovaEntradaForm, Entrada } from '../types/database';
import { formatBRL } from '../lib/utils';
import { toast } from 'sonner';

export default function Contas() {
  const [filters, setFilters] = useState<FiltrosEntrada>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entrada | null>(null);

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

  // Encontrar a conta Cora
  const contaCora = contas.find(conta => conta.nome.toLowerCase().includes('cora'));
  const totalCora = totaisConta.find(total => total.conta_id === contaCora?.id);
  
  console.log('🏦 Conta Cora encontrada:', contaCora);
  console.log('📊 Total Cora:', totalCora);
  console.log('🏦 Todas as contas:', contas);
  console.log('📊 Todos os totais:', totaisConta);

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

  const clearFilters = () => {
    setFilters({});
  };

  const handleSaida = () => {
    toast.info('Funcionalidade de saída será implementada em breve!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas</h1>
          <p className="text-muted-foreground">
            Gerencie as entradas de dinheiro na conta Cora
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Entrada
        </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <p className="text-2xl font-bold text-purple-600">
                    {formatBRL(totalCora?.total_recebido || 0)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Botão de Saída */}
            <div className="mt-6 pt-6 border-t border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Ações da Conta</h3>
                  <p className="text-sm text-gray-600">Gerencie as operações da conta Cora</p>
                </div>
                <Button 
                  onClick={handleSaida}
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Saída
                </Button>
              </div>
            </div>
            
            {/* Seção de Débitos Mensais */}
            <div className="mt-6 pt-6 border-t border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Débitos Mensais Detalhados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Janeiro 2024</span>
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      Débito
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-red-600">-{formatBRL(2500)}</p>
                  <p className="text-xs text-gray-500 mt-1">Taxas e manutenção</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Fevereiro 2024</span>
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      Débito
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-red-600">-{formatBRL(1800)}</p>
                  <p className="text-xs text-gray-500 mt-1">Transferências e taxas</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Março 2024</span>
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      Débito
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-red-600">-{formatBRL(3200)}</p>
                  <p className="text-xs text-gray-500 mt-1">Operações e manutenção</p>
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

      {/* Modal de Entrada */}
      <EntradaModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingEntry ? handleEditEntry : handleCreateEntry}
        editingEntry={editingEntry}
        loading={loading}
      />
    </div>
  );
}