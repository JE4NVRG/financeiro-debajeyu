import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Plus, Building2, DollarSign, AlertCircle } from 'lucide-react'
import { useFornecedores } from '../hooks/useFornecedores'
import { useCompras } from '../hooks/useCompras'
import { usePagamentosFornecedores } from '../hooks/usePagamentosFornecedores'
import { FornecedorTable } from '../components/fornecedores/FornecedorTable'
import { FornecedorForm } from '../components/fornecedores/FornecedorForm'
import { formatBRL } from '../lib/utils'
import { useToast } from '../components/ui/toast'
import { FornecedorComTotais } from '../types/database'

export function Fornecedores() {
  const navigate = useNavigate()
  const [isNewFornecedorOpen, setIsNewFornecedorOpen] = useState(false)
  const [isEditFornecedorOpen, setIsEditFornecedorOpen] = useState(false)
  const [editingFornecedor, setEditingFornecedor] = useState<FornecedorComTotais | null>(null)
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { fornecedores, loading: fornecedoresLoading, createFornecedor, refetch: refreshFornecedores, updateFornecedor, deleteFornecedor } = useFornecedores()
  const { compras, loading: comprasLoading } = useCompras()
  const { pagamentos, loading: pagamentosLoading } = usePagamentosFornecedores()
  const { addToast } = useToast()

  // Calcular totais gerais
  const totaisGerais = {
    gastoTotal: compras?.reduce((sum, compra) => sum + compra.valor_total, 0) || 0,
    totalPago: pagamentos?.reduce((sum, pagamento) => sum + pagamento.valor_pago, 0) || 0,
    emAberto: 0
  }
  totaisGerais.emAberto = totaisGerais.gastoTotal - totaisGerais.totalPago

  // Filtrar fornecedores
  const fornecedoresFiltrados = fornecedores?.filter(fornecedor => {
    const matchesTipo = tipoFilter === 'all' || fornecedor.tipo === tipoFilter
    const matchesStatus = statusFilter === 'all' || fornecedor.status === statusFilter
    const matchesSearch = searchTerm === '' || 
      fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesTipo && matchesStatus && matchesSearch
  }) || []

  const handleCreateFornecedor = async (data: any) => {
    try {
      await createFornecedor(data)
      setIsNewFornecedorOpen(false)
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Fornecedor criado com sucesso!'
      })
      refreshFornecedores()
    } catch (error: any) {
      console.error('Erro ao criar fornecedor:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível criar o fornecedor'
      })
    }
  }

  const handleEditFornecedor = (fornecedor: FornecedorComTotais) => {
    setEditingFornecedor(fornecedor)
    setIsEditFornecedorOpen(true)
  }

  const handleUpdateFornecedor = async (data: any) => {
    if (!editingFornecedor) return

    try {
      await updateFornecedor(editingFornecedor.id, data)
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Fornecedor atualizado com sucesso!'
      })
      setIsEditFornecedorOpen(false)
      setEditingFornecedor(null)
      refreshFornecedores()
    } catch (error: any) {
      console.error('Erro ao atualizar fornecedor:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o fornecedor'
      })
    }
  }

  const handleDeleteFornecedor = async (id: string) => {
    try {
      await deleteFornecedor(id)
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Fornecedor excluído com sucesso!'
      })
    } catch (error: any) {
      console.error('Erro ao excluir fornecedor:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível excluir o fornecedor'
      })
    }
  }

  const handleViewFornecedor = (fornecedor: FornecedorComTotais) => {
    navigate(`/fornecedores/${fornecedor.id}`)
  }

  const loading = fornecedoresLoading || comprasLoading || pagamentosLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando fornecedores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie seus fornecedores, compras e pagamentos
          </p>
        </div>
        <Dialog open={isNewFornecedorOpen} onOpenChange={setIsNewFornecedorOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Fornecedor</DialogTitle>
            </DialogHeader>
            <FornecedorForm
              onSubmit={handleCreateFornecedor}
              onCancel={() => setIsNewFornecedorOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de resumo geral */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatBRL(totaisGerais.gastoTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de todas as compras
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
              {formatBRL(totaisGerais.totalPago)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de pagamentos realizados
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
              Saldo pendente de pagamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtre os fornecedores por tipo, status ou nome
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por nome</Label>
              <Input
                id="search"
                placeholder="Digite o nome do fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                  <SelectItem value="Prestador de Serviço">Prestador de Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setTipoFilter('all')
                  setStatusFilter('all')
                  setSearchTerm('')
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Lista de Fornecedores
          </CardTitle>
          <CardDescription>
            {fornecedoresFiltrados.length} fornecedor(es) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FornecedorTable 
            fornecedores={fornecedoresFiltrados}
            onEdit={handleEditFornecedor}
            onDelete={handleDeleteFornecedor}
            onView={handleViewFornecedor}
          />
        </CardContent>
      </Card>

      {/* Modal de edição de fornecedor */}
      <Dialog open={isEditFornecedorOpen} onOpenChange={setIsEditFornecedorOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Fornecedor</DialogTitle>
          </DialogHeader>
          <FornecedorForm
            fornecedor={editingFornecedor}
            onSubmit={handleUpdateFornecedor}
            onCancel={() => {
              setIsEditFornecedorOpen(false)
              setEditingFornecedor(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}