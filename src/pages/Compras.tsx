import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, ShoppingCart, DollarSign, AlertCircle, CreditCard, Banknote, Eye, Edit, Trash2, Undo2 } from 'lucide-react';
import { useCompras } from '../hooks/useCompras';
import { useFornecedores } from '../hooks/useFornecedores';
import { usePagamentoRapido } from '../hooks/usePagamentoRapido';
import { usePagamentoParcial } from '../hooks/usePagamentoParcial';
import { CompraForm } from '../components/fornecedores/CompraForm';
import { PagamentoRapidoModal } from '../components/fornecedores/PagamentoRapidoModal';
import { PagamentoParcialModal } from '../components/fornecedores/PagamentoParcialModal';
import { formatBRL, formatDate } from '../lib/utils';
import { toast } from 'sonner';
import { CompraComSaldo, NovaCompraForm, FiltrosCompra } from '../types/database';

export default function Compras() {
  const [isNewCompraOpen, setIsNewCompraOpen] = useState(false);
  const [isEditCompraOpen, setIsEditCompraOpen] = useState(false);
  const [editingCompra, setEditingCompra] = useState<CompraComSaldo | null>(null);
  const [filtros, setFiltros] = useState<FiltrosCompra>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para modais de pagamento
  const [isPagamentoRapidoOpen, setIsPagamentoRapidoOpen] = useState(false);
  const [isPagamentoParcialOpen, setIsPagamentoParcialOpen] = useState(false);
  const [compraParaPagamento, setCompraParaPagamento] = useState<CompraComSaldo | null>(null);

  const { compras, loading: comprasLoading, createCompra, updateCompra, deleteCompra, refetch: refreshCompras } = useCompras(undefined, filtros);
  const { fornecedores } = useFornecedores();
  const { pagarTotal, reverterPagamento } = usePagamentoRapido();
  const { pagarParcial } = usePagamentoParcial();

  // Calcular totais
  const totaisGerais = {
    totalCompras: compras?.reduce((sum, compra) => sum + compra.valor_total, 0) || 0,
    totalPago: compras?.reduce((sum, compra) => sum + (compra.total_pago || 0), 0) || 0,
    emAberto: compras?.reduce((sum, compra) => sum + (compra.saldo_aberto || 0), 0) || 0,
    quantidadeCompras: compras?.length || 0
  };

  // Filtrar compras
  const comprasFiltradas = compras?.filter(compra => {
    const matchesSearch = searchTerm === '' || 
      compra.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      compra.fornecedor_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) || [];

  const handleCreateCompra = async (data: NovaCompraForm) => {
    try {
      await createCompra(data);
      setIsNewCompraOpen(false);
      toast.success('Compra registrada com sucesso!');
    } catch (error) {
      toast.error('Erro ao registrar compra');
    }
  };

  const handleUpdateCompra = async (data: Partial<NovaCompraForm>) => {
    if (!editingCompra) return;
    
    try {
      await updateCompra(editingCompra.id, data);
      setIsEditCompraOpen(false);
      setEditingCompra(null);
      toast.success('Compra atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar compra');
    }
  };

  const handleDeleteCompra = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta compra?')) return;
    
    try {
      await deleteCompra(id);
      toast.success('Compra excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir compra');
    }
  };

  const handleEditCompra = (compra: CompraComSaldo) => {
    setEditingCompra(compra);
    setIsEditCompraOpen(true);
  };

  const handlePagarTudo = (compra: CompraComSaldo) => {
    setCompraParaPagamento(compra);
    setIsPagamentoRapidoOpen(true);
  };

  const handlePagamentoParcial = (compra: CompraComSaldo) => {
    setCompraParaPagamento(compra);
    setIsPagamentoParcialOpen(true);
  };

  const handlePagamentoSuccess = () => {
    refreshCompras();
    setIsPagamentoRapidoOpen(false);
    setIsPagamentoParcialOpen(false);
    setCompraParaPagamento(null);
  };

  const handleReverterPagamento = async (compra: CompraComSaldo) => {
    if (!confirm('Tem certeza que deseja reverter todos os pagamentos desta compra? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const result = await reverterPagamento(compra.id);
      if (result.success) {
        toast.success('Pagamento revertido com sucesso!');
        refreshCompras();
      }
    } catch (error) {
      toast.error('Erro ao reverter pagamento');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aberta':
        return <Badge variant="destructive">Aberta</Badge>;
      case 'Parcial':
        return <Badge variant="secondary">Parcial</Badge>;
      case 'Quitada':
        return <Badge variant="default" className="bg-green-600">Quitada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (comprasLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando compras...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras Registradas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as compras e seus pagamentos
          </p>
        </div>
        <Dialog open={isNewCompraOpen} onOpenChange={setIsNewCompraOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nova Compra</DialogTitle>
            </DialogHeader>
            <CompraForm
              onSubmit={handleCreateCompra}
              onCancel={() => setIsNewCompraOpen(false)}
              fornecedores={fornecedores}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de totais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Compras</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totaisGerais.quantidadeCompras}
            </div>
            <p className="text-xs text-muted-foreground">
              Compras registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatBRL(totaisGerais.totalCompras)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total das compras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatBRL(totaisGerais.totalPago)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor já pago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Aberto</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatBRL(totaisGerais.emAberto)}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo pendente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtre as compras por descrição ou fornecedor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Digite a descrição ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={filtros.status || 'all'} 
                onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value === 'all' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Aberta">Aberta</SelectItem>
                  <SelectItem value="Parcial">Parcial</SelectItem>
                  <SelectItem value="Quitada">Quitada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFiltros({});
                  setSearchTerm('');
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de compras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Lista de Compras
          </CardTitle>
          <CardDescription>
            {comprasFiltradas.length} compra(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {comprasFiltradas.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">Nenhuma compra encontrada</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comprasFiltradas.map((compra) => (
                    <TableRow key={compra.id}>
                      <TableCell>
                        {formatDate(compra.data)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {compra.descricao}
                      </TableCell>
                      <TableCell>
                        {compra.fornecedor_nome || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatBRL(compra.valor_total)}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatBRL(compra.total_pago || 0)}
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {formatBRL(compra.saldo_aberto || 0)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(compra.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botões de pagamento - só aparecem se há saldo aberto */}
                          {(compra.saldo_aberto || 0) > 0 && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePagarTudo(compra)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Banknote className="h-4 w-4 mr-1" />
                                Pagar Tudo
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePagamentoParcial(compra)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                Parcial
                              </Button>
                            </>
                          )}

                          {/* Botão de reversão - só aparece se há pagamentos */}
                          {(compra.total_pago || 0) > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReverterPagamento(compra)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <Undo2 className="h-4 w-4 mr-1" />
                              Reverter
                            </Button>
                          )}
                          
                          {/* Botões de ação padrão */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCompra(compra)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCompra(compra.id)}
                            className="text-red-600 hover:text-red-700"
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

      {/* Modal de edição de compra */}
      <Dialog open={isEditCompraOpen} onOpenChange={setIsEditCompraOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Compra</DialogTitle>
          </DialogHeader>
          <CompraForm
            compra={editingCompra}
            onSubmit={handleUpdateCompra}
            onCancel={() => {
              setIsEditCompraOpen(false);
              setEditingCompra(null);
            }}
            fornecedores={fornecedores}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento Rápido */}
      <PagamentoRapidoModal
        open={isPagamentoRapidoOpen}
        onOpenChange={(open) => {
          setIsPagamentoRapidoOpen(open);
          if (!open) {
            setCompraParaPagamento(null);
          }
        }}
        compra={compraParaPagamento}
        onSuccess={handlePagamentoSuccess}
      />

      {/* Modal de Pagamento Parcial */}
      <PagamentoParcialModal
        open={isPagamentoParcialOpen}
        onOpenChange={(open) => {
          setIsPagamentoParcialOpen(open);
          if (!open) {
            setCompraParaPagamento(null);
          }
        }}
        compra={compraParaPagamento}
        onSuccess={handlePagamentoSuccess}
      />
    </div>
  );
}