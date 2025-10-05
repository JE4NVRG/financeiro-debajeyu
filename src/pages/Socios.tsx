import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { ConfirmationDialog } from '../components/ui/confirmation-dialog'
import { supabase, Socio } from '../lib/supabase'
import { useCurrencyMask } from '../hooks/useCurrencyMask'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { useToast } from '../components/ui/toast'

export function Socios() {
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null)
  const [socioToDelete, setSocioToDelete] = useState<Socio | null>(null)
  const [selectedSocio, setSelectedSocio] = useState<string>('')
  const [formData, setFormData] = useState({
    nome: ''
  })
  
  const [preSaldoNumerico, setPreSaldoNumerico] = useState<number>(0)
  const currencyMask = useCurrencyMask()
  const { addToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

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
      await fetchSocios()
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

  // Filtrar sócios por sócio selecionado
  const filteredSocios = selectedSocio 
    ? socios.filter(socio => socio.id === selectedSocio)
    : socios

  // Limpar filtro
  const clearFilter = () => {
    setSelectedSocio('')
    setSearchParams({})
  }



  // Limpar formulário
  const clearForm = () => {
    setFormData({
      nome: ''
    })
    setPreSaldoNumerico(0)
    setEditingSocio(null)
  }

  // Abrir modal para novo sócio
  const handleNewSocio = () => {
    clearForm()
    setIsDialogOpen(true)
  }

  // Abrir modal para editar sócio
  const handleEditSocio = (socio: Socio) => {
    setEditingSocio(socio)
    setFormData({
      nome: socio.nome
    })
    setPreSaldoNumerico(socio.pre_saldo)
    setIsDialogOpen(true)
  }

  // Salvar sócio (criar ou atualizar)
  const handleSaveSocio = async () => {
    try {
      // Debug logs
      console.log('=== DEBUG SAVE SOCIO ===')
      console.log('preSaldoNumerico:', preSaldoNumerico)
      console.log('formData.nome:', formData.nome)
      console.log('editingSocio:', editingSocio)

      // Validação
      if (!formData.nome.trim()) {
        addToast({
          type: 'error',
          title: 'Erro de validação',
          description: 'Nome é obrigatório'
        })
        return
      }

      const preSaldoFinal = currencyMask.ensureTwoDecimals(preSaldoNumerico)

      if (editingSocio) {
        // Atualizar sócio existente
        console.log('Atualizando sócio ID:', editingSocio.id)
        const updateData = {
          nome: formData.nome.trim(),
          pre_saldo: preSaldoFinal
        }
        console.log('Update data:', updateData)
        
        const { data, error } = await supabase
          .from('socios')
          .update(updateData)
          .eq('id', editingSocio.id)
          .select()

        console.log('Update result - data:', data)
        console.log('Update result - error:', error)

        if (error) throw error
        
        addToast({
          type: 'success',
          title: 'Sucesso',
          description: 'Sócio atualizado com sucesso'
        })
      } else {
        // Criar novo sócio
        console.log('Criando novo sócio')
        const insertData = {
          nome: formData.nome.trim(),
          pre_saldo: preSaldoFinal
        }
        console.log('Insert data:', insertData)
        
        const { data, error } = await supabase
          .from('socios')
          .insert(insertData)
          .select()

        console.log('Insert result - data:', data)
        console.log('Insert result - error:', error)

        if (error) throw error
        
        addToast({
          type: 'success',
          title: 'Sucesso',
          description: 'Sócio criado com sucesso'
        })
      }

      setIsDialogOpen(false)
      clearForm()
      await fetchSocios() // Aguardar o fetch para garantir que os dados sejam atualizados
    } catch (error: any) {
      console.error('Erro ao salvar sócio:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: error.message || 'Erro ao salvar sócio'
      })
    }
  }

  // Abrir diálogo de confirmação para excluir sócio
  const handleDeleteSocio = (socio: Socio) => {
    setSocioToDelete(socio)
    setIsConfirmDialogOpen(true)
  }

  // Confirmar exclusão do sócio
  const confirmDeleteSocio = async () => {
    if (!socioToDelete) return

    try {
      const { error } = await supabase
        .from('socios')
        .delete()
        .eq('id', socioToDelete.id)

      if (error) throw error
      
      addToast({
        type: 'success',
        title: 'Sucesso',
        description: 'Sócio excluído com sucesso'
      })
      
      fetchSocios()
    } catch (error: any) {
      console.error('Erro ao excluir sócio:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: error.message || 'Erro ao excluir sócio'
      })
    } finally {
      setSocioToDelete(null)
    }
  }

  // Calcular total de pré-saldo
  const totalPreSaldo = socios.reduce((sum, socio) => sum + socio.pre_saldo, 0)

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sócios</h1>
          <p className="text-muted-foreground">
            Gerencie os sócios e seus pré-saldos
          </p>
        </div>
        <Button onClick={handleNewSocio}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Sócio
        </Button>
      </div>

      {/* Card com total de pré-saldo */}
      <Card>
        <CardHeader>
          <CardTitle>Total Pré-Saldo</CardTitle>
          <CardDescription>
            Soma dos pré-saldos de todos os sócios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatBRL(totalPreSaldo)}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de sócios */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Sócios</CardTitle>
              <CardDescription>
                {filteredSocios.length} sócio(s) {selectedSocio ? 'filtrado(s)' : 'cadastrado(s)'}
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
                <TableHead>Nome</TableHead>
                <TableHead>Pré-Saldo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSocios.map((socio) => (
                <TableRow key={socio.id}>
                  <TableCell className="font-medium">{socio.nome}</TableCell>
                  <TableCell>{formatBRL(socio.pre_saldo)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSocio(socio)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSocio(socio)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSocios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {selectedSocio ? 'Nenhum sócio encontrado com o filtro aplicado' : 'Nenhum sócio cadastrado'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal para criar/editar sócio */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSocio ? 'Editar Sócio' : 'Novo Sócio'}
            </DialogTitle>
            <DialogDescription>
              {editingSocio 
                ? 'Atualize as informações do sócio'
                : 'Preencha as informações do novo sócio'
              }
            </DialogDescription>
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
              <CurrencyInput
                id="pre_saldo"
                value={preSaldoNumerico}
                onChange={setPreSaldoNumerico}
                placeholder="0,00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSocio}>
              {editingSocio ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para exclusão */}
      <ConfirmationDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        title="Excluir Sócio"
        description={`Tem certeza que deseja excluir o sócio "${socioToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmDeleteSocio}
      />
    </div>
  )
}