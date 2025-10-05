import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Edit, Trash2, Filter, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { ConfirmationDialog } from '../components/ui/confirmation-dialog'
import { supabase, Investimento, Socio } from '../lib/supabase'
import { useBRLMask } from '../hooks/useBRLMask'
import { useToast } from '../components/ui/toast'

export function Investimentos() {
  const [investimentos, setInvestimentos] = useState<Investimento[]>([])
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [editingInvestimento, setEditingInvestimento] = useState<Investimento | null>(null)
  const [investimentoToDelete, setInvestimentoToDelete] = useState<Investimento | null>(null)
  const [selectedSocio, setSelectedSocio] = useState<string>('')
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0], // Data de hoje por padrão
    descricao: '',
    socio_id: ''
  })

  const valorMask = useBRLMask()
  const { addToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  // Carregar investimentos
  const fetchInvestimentos = async () => {
    try {
      const { data, error } = await supabase
        .from('investimentos')
        .select(`
          *,
          socios (
            id,
            nome
          )
        `)
        .order('data', { ascending: false })

      if (error) throw error
      setInvestimentos(data || [])
    } catch (error) {
      console.error('Erro ao carregar investimentos:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível carregar os investimentos'
      })
    }
  }

  // Carregar sócios
  const fetchSocios = async () => {
    try {
      const { data, error } = await supabase
        .from('socios')
        .select('*')
        .order('nome')

      if (error) throw error
      setSocios(data || [])
    } catch (error) {
      console.error('Erro ao carregar sócios:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível carregar os sócios'
      })
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchInvestimentos(), fetchSocios()])
      setLoading(false)
    }
    loadData()
  }, [])

  // Verificar se há filtro por sócio na URL
  useEffect(() => {
    const socioFilter = searchParams.get('socio')
    if (socioFilter) {
      setSelectedSocio(socioFilter)
    }
  }, [searchParams])

  // Formatar valor em BRL
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Formatar data - corrigido para evitar problema de timezone
  const formatDate = (dateString: string) => {
    // Criar data diretamente dos componentes da string para evitar problemas de timezone
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month é 0-indexed
    return date.toLocaleDateString('pt-BR')
  }

  // Calcular totais por sócio
  const getTotalsBySocio = () => {
    const totals = investimentos.reduce((acc, investimento) => {
      const socioId = investimento.socio_id
      const socioNome = investimento.socios?.nome || 'Desconhecido'
      
      if (!acc[socioId]) {
        acc[socioId] = {
          nome: socioNome,
          total: 0
        }
      }
      
      acc[socioId].total += investimento.valor
      return acc
    }, {} as Record<string, { nome: string; total: number }>)
    
    return Object.entries(totals).map(([id, data]) => ({
      id,
      nome: data.nome,
      total: data.total
    }))
  }

  // Filtrar investimentos por sócio
  const filteredInvestimentos = selectedSocio 
    ? investimentos.filter(inv => inv.socio_id === selectedSocio)
    : investimentos

  // Limpar filtro
  const clearFilter = () => {
    setSelectedSocio('')
    setSearchParams({})
  }

  // Limpar formulário
  const clearForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      socio_id: ''
    })
    valorMask.clear()
    setEditingInvestimento(null)
  }

  // Abrir modal para novo investimento
  const handleNewInvestimento = () => {
    clearForm()
    setIsDialogOpen(true)
  }

  // Abrir modal para editar investimento
  const handleEditInvestimento = (investimento: Investimento) => {
    setEditingInvestimento(investimento)
    setFormData({
      data: investimento.data,
      descricao: investimento.descricao,
      socio_id: investimento.socio_id
    })
    valorMask.setValue(valorMask.formatInputValue(investimento.valor.toString().replace('.', ',')))
    setIsDialogOpen(true)
  }

  // Salvar investimento (criar ou atualizar)
  const handleSaveInvestimento = async () => {
    try {
      const valorValue = valorMask.parseValue(valorMask.value)

      // Validação
      if (!formData.data) {
        addToast({
          type: 'error',
          title: 'Erro de validação',
          description: 'Data é obrigatória'
        })
        return
      }

      if (!formData.descricao.trim()) {
        addToast({
          type: 'error',
          title: 'Erro de validação',
          description: 'Descrição é obrigatória'
        })
        return
      }

      if (!formData.socio_id) {
        addToast({
          type: 'error',
          title: 'Erro de validação',
          description: 'Sócio é obrigatório'
        })
        return
      }

      if (valorValue <= 0) {
        addToast({
          type: 'error',
          title: 'Erro de validação',
          description: 'Valor deve ser maior que zero'
        })
        return
      }

      if (editingInvestimento) {
        // Atualizar investimento existente
        const { error } = await supabase
          .from('investimentos')
          .update({
            data: formData.data,
            descricao: formData.descricao.trim(),
            socio_id: formData.socio_id,
            valor: valorValue
          })
          .eq('id', editingInvestimento.id)

        if (error) throw error
        
        addToast({
          type: 'success',
          title: 'Sucesso',
          description: 'Investimento atualizado com sucesso'
        })
      } else {
        // Criar novo investimento
        const { error } = await supabase
          .from('investimentos')
          .insert({
            data: formData.data,
            descricao: formData.descricao.trim(),
            socio_id: formData.socio_id,
            valor: valorValue
          })

        if (error) throw error
        
        addToast({
          type: 'success',
          title: 'Sucesso',
          description: 'Investimento criado com sucesso'
        })
      }

      setIsDialogOpen(false)
      clearForm()
      fetchInvestimentos()
    } catch (error: any) {
      console.error('Erro ao salvar investimento:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: error.message || 'Erro ao salvar investimento'
      })
    }
  }

  // Abrir diálogo de confirmação para excluir investimento
  const handleDeleteInvestimento = (investimento: Investimento) => {
    setInvestimentoToDelete(investimento)
    setIsConfirmDialogOpen(true)
  }

  // Confirmar exclusão do investimento
  const confirmDeleteInvestimento = async () => {
    if (!investimentoToDelete) return

    try {
      const { error } = await supabase
        .from('investimentos')
        .delete()
        .eq('id', investimentoToDelete.id)

      if (error) throw error
      
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Investimento excluído com sucesso'
      })
      
      fetchInvestimentos()
    } catch (error: any) {
      console.error('Erro ao excluir investimento:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: error.message || 'Erro ao excluir investimento'
      })
    } finally {
      setInvestimentoToDelete(null)
    }
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investimentos</h1>
          <p className="text-muted-foreground">
            Gerencie os investimentos dos sócios
          </p>
        </div>
        <Button onClick={handleNewInvestimento}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Investimento
        </Button>
      </div>

      {/* Cards com totais por sócio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getTotalsBySocio().map((socio) => (
          <Card 
            key={socio.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedSocio === socio.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => {
              if (selectedSocio === socio.id) {
                clearFilter()
              } else {
                setSelectedSocio(socio.id)
                setSearchParams({ socio: socio.id })
              }
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {socio.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBRL(socio.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total investido
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela de investimentos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Investimentos</CardTitle>
              <CardDescription>
                {filteredInvestimentos.length} investimento(s) {selectedSocio ? 'filtrado(s)' : 'cadastrado(s)'}
              </CardDescription>
            </div>
            {selectedSocio && (
              <Button variant="outline" size="sm" onClick={clearFilter}>
                <X className="h-4 w-4 mr-2" />
                Limpar Filtro
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Sócio</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvestimentos.map((investimento) => (
                <TableRow key={investimento.id}>
                  <TableCell>{formatDate(investimento.data)}</TableCell>
                  <TableCell className="font-medium">{investimento.descricao}</TableCell>
                  <TableCell>{investimento.socios?.nome}</TableCell>
                  <TableCell>{formatBRL(investimento.valor)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditInvestimento(investimento)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInvestimento(investimento)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredInvestimentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {selectedSocio ? 'Nenhum investimento encontrado para este sócio' : 'Nenhum investimento cadastrado'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal para criar/editar investimento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingInvestimento ? 'Editar Investimento' : 'Novo Investimento'}
            </DialogTitle>
            <DialogDescription>
              {editingInvestimento 
                ? 'Atualize as informações do investimento'
                : 'Preencha as informações do novo investimento'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do investimento"
              />
            </div>
            
            <div>
              <Label htmlFor="socio_id">Sócio</Label>
              <Select
                value={formData.socio_id}
                onValueChange={(value) => setFormData({ ...formData, socio_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um sócio" />
                </SelectTrigger>
                <SelectContent>
                  {socios.map((socio) => (
                    <SelectItem key={socio.id} value={socio.id}>
                      {socio.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                value={valorMask.value}
                onChange={(e) => valorMask.handleChange(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveInvestimento}>
              {editingInvestimento ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para exclusão */}
      <ConfirmationDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        title="Excluir Investimento"
        description={`Tem certeza que deseja excluir o investimento "${investimentoToDelete?.descricao}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDeleteInvestimento}
      />
    </div>
  )
}