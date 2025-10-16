import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { ArrowLeft, Building2, DollarSign, AlertCircle, Plus, ShoppingCart, CreditCard, History, Edit3 } from 'lucide-react'
import { useFornecedores } from '../hooks/useFornecedores'
import { useCompras } from '../hooks/useCompras'
import { usePagamentosFornecedores } from '../hooks/usePagamentosFornecedores'
import { useSupplierBalance } from '../hooks/useSupplierBalance'
import { CompraTable } from '../components/fornecedores/CompraTable'
import { CompraForm } from '../components/fornecedores/CompraForm'
import { PagamentoTable } from '../components/fornecedores/PagamentoTable'
import { CompraModal } from '../components/CompraModal'
import { ConfirmationModal } from '../components/ui/ConfirmationModal'
import { EditSupplierBalanceModal } from '../components/EditSupplierBalanceModal'
import { formatBRL, formatDate } from '../lib/utils'
import { useToast } from '../components/ui/toast'
import type { Fornecedor, Compra, NovaCompraForm, FornecedorComTotais } from '../types/database'

export function FornecedorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isNewCompraOpen, setIsNewCompraOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('compras')
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [compraToDelete, setCompraToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editBalanceModal, setEditBalanceModal] = useState(false)

  const { fornecedores, loading: fornecedoresLoading, refetch: refetchFornecedores } = useFornecedores()
  const { compras, loading: comprasLoading, createCompra, updateCompra, deleteCompra, refetch: refreshCompras } = useCompras(id)
  const { pagamentos, loading: pagamentosLoading } = usePagamentosFornecedores()
  const { getBalanceHistory } = useSupplierBalance()
  const { addToast } = useToast()

  const [balanceHistory, setBalanceHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fornecedor = fornecedores?.find(f => f.id === id) as FornecedorComTotais | undefined
  const comprasFornecedor = compras || []
  const pagamentosFornecedor = pagamentos?.filter(p => 
    comprasFornecedor.some(c => c.id === p.compra_id)
  ) || []

  // Calcular totais do fornecedor
  const totaisFornecedor = {
    gastoTotal: comprasFornecedor.reduce((sum, compra) => sum + compra.valor_total, 0),
    totalPago: pagamentosFornecedor.reduce((sum, pagamento) => sum + pagamento.valor_pago, 0),
    emAberto: 0
  }
  totaisFornecedor.emAberto = totaisFornecedor.gastoTotal - totaisFornecedor.totalPago

  // Load balance history when tab changes to history
  useEffect(() => {
    if (activeTab === 'historico' && id) {
      loadBalanceHistory()
    }
  }, [activeTab, id])

  const loadBalanceHistory = async () => {
    if (!id) return
    
    setHistoryLoading(true)
    try {
      const history = await getBalanceHistory(id)
      setBalanceHistory(history)
    } catch (error) {
      console.error('Error loading balance history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleCreateCompra = async (data: any) => {
    try {
      await createCompra({
        fornecedor_id: id,
        data: data.data_compra,
        descricao: data.produto,
        categoria: 'Produto',
        valor_total: data.valor_total.toString(),
        forma: 'À Vista'
      })
      setIsNewCompraOpen(false)
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Despesa registrada com sucesso!'
      })
      refreshCompras()
    } catch (error: any) {
      console.error('Erro ao criar compra:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível registrar a despesa'
      })
    }
  }

  const handleEditCompra = (compra: Compra) => {
    setEditingCompra(compra)
    setIsEditModalOpen(true)
  }

  const handleUpdateCompra = async (data: NovaCompraForm) => {
    if (!editingCompra) return

    try {
      await updateCompra(editingCompra.id, data)
      setIsEditModalOpen(false)
      setEditingCompra(null)
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Compra atualizada com sucesso!'
      })
      refreshCompras()
    } catch (error: any) {
      console.error('Erro ao atualizar compra:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível atualizar a compra'
      })
    }
  }

  const handleDeleteClick = (compraId: string) => {
    setCompraToDelete(compraId)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!compraToDelete) return

    try {
      setIsDeleting(true)
      await deleteCompra(compraToDelete)
      setIsDeleteModalOpen(false)
      setCompraToDelete(null)
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Compra excluída com sucesso!'
      })
      refreshCompras()
    } catch (error: any) {
      console.error('Erro ao excluir compra:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: error.message || 'Não foi possível excluir a compra'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false)
    setCompraToDelete(null)
  }

  const handleEditBalance = () => {
    setEditBalanceModal(true)
  }

  const handleBalanceEditSuccess = () => {
    refetchFornecedores()
    loadBalanceHistory()
    setEditBalanceModal(false)
  }

  const getBalanceTypeBadge = (fornecedor: FornecedorComTotais) => {
    if (fornecedor.tem_ajuste_manual) {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
          Manual
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
        Auto
      </Badge>
    );
  }

  const loading = fornecedoresLoading || comprasLoading || pagamentosLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do fornecedor...</p>
        </div>
      </div>
    )
  }

  if (!fornecedor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Fornecedor não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O fornecedor que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => navigate('/fornecedores')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Fornecedores
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/fornecedores')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              {fornecedor?.nome}
            </h1>
            <p className="text-muted-foreground">
              {fornecedor?.tipo} • {fornecedor?.status}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {fornecedor && (
            <Button variant="outline" onClick={handleEditBalance}>
              <Edit3 className="mr-2 h-4 w-4" />
              Editar Saldo
            </Button>
          )}
          <Button onClick={() => setIsNewCompraOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Lançar Despesa
          </Button>
        </div>
      </div>

      <CompraForm
        isOpen={isNewCompraOpen}
        onClose={() => setIsNewCompraOpen(false)}
        onSubmit={handleCreateCompra}
        fornecedorNome={fornecedor?.nome || ''}
      />

      {/* Cards de resumo do fornecedor */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatBRL(totaisFornecedor.gastoTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {comprasFornecedor.length} compra(s) registrada(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatBRL(totaisFornecedor.totalPago)}
            </div>
            <p className="text-xs text-muted-foreground">
              {pagamentosFornecedor.length} pagamento(s) realizado(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Devedor</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${totaisFornecedor.emAberto > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {fornecedor?.tem_ajuste_manual 
                    ? formatBRL(fornecedor.saldo_devedor_manual || 0)
                    : formatBRL(totaisFornecedor.emAberto)
                  }
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {totaisFornecedor.emAberto > 0 ? 'Pendente de pagamento' : 'Tudo quitado'}
                  </p>
                  {fornecedor && getBalanceTypeBadge(fornecedor)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações do fornecedor */}
      {fornecedor?.observacao && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{fornecedor.observacao}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs de Compras, Pagamentos e Histórico */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compras" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Compras ({comprasFornecedor.length})
          </TabsTrigger>
          <TabsTrigger value="pagamentos" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pagamentos ({pagamentosFornecedor.length})
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de Saldo ({balanceHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compras Registradas</CardTitle>
              <CardDescription>
                Histórico de todas as compras realizadas com este fornecedor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompraTable 
                compras={comprasFornecedor}
                onView={() => {}}
                onEdit={handleEditCompra}
                onDelete={handleDeleteClick}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Realizados</CardTitle>
              <CardDescription>
                Histórico de todos os pagamentos feitos para este fornecedor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PagamentoTable 
                pagamentos={pagamentosFornecedor}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Ajustes de Saldo</CardTitle>
              <CardDescription>
                Histórico de todos os ajustes manuais realizados no saldo devedor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : balanceHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum ajuste de saldo foi realizado ainda.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {balanceHistory.map((entry, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {entry.tipo_operacao === 'manual_adjustment' ? 'Ajuste Manual' : 'Operação'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(entry.data_alteracao)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">
                            <span className="text-muted-foreground">De: </span>
                            <span className={entry.saldo_anterior > 0 ? 'text-red-600' : 'text-green-600'}>
                              {formatBRL(entry.saldo_anterior)}
                            </span>
                          </div>
                          <div className="font-mono text-sm">
                            <span className="text-muted-foreground">Para: </span>
                            <span className={entry.saldo_novo > 0 ? 'text-red-600' : 'text-green-600'}>
                              {formatBRL(entry.saldo_novo)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {entry.observacao && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <strong>Observação:</strong> {entry.observacao}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Edição */}
      <CompraModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingCompra(null)
        }}
        onSubmit={handleUpdateCompra}
        loading={comprasLoading}
        compra={editingCompra}
        fornecedorId={id}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir esta compra? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={isDeleting}
      />

      {/* Modal de Edição de Saldo */}
      {fornecedor && (
        <EditSupplierBalanceModal
          isOpen={editBalanceModal}
          onClose={() => setEditBalanceModal(false)}
          fornecedor={fornecedor}
          onSuccess={handleBalanceEditSuccess}
        />
      )}
    </div>
  )
}