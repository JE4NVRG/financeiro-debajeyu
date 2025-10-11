import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { formatBRL, formatDate } from '../../lib/utils';
import { Edit, Trash2 } from 'lucide-react';

interface Saida {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  categoria: string;
  status: 'pendente' | 'pago' | 'cancelado';
  tipo: 'pagamento' | 'abatimento';
}

interface SaidaTableProps {
  saidas?: Saida[];
  pagamentos?: any[];
  abatimentos?: any[];
  compras?: any[];
  fornecedores?: any[];
  onEdit?: (saida: Saida) => void;
  onDelete?: (id: string) => void;
  onEditAbatimento?: (abatimento: any) => void;
  onDeleteAbatimento?: (id: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function SaidaTable({ saidas = [], pagamentos = [], abatimentos = [], compras, fornecedores, onEdit, onDelete, onEditAbatimento, onDeleteAbatimento, onRefresh, loading = false }: SaidaTableProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    console.log('🔴 BOTÃO DE EXCLUSÃO CLICADO - ID:', id);
    e.preventDefault();
    e.stopPropagation();
    
    // Usar modal customizado ao invés do confirm() nativo
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    console.log('🔴 USUÁRIO CONFIRMOU EXCLUSÃO - ID:', itemToDelete);
    if (itemToDelete && onDeleteAbatimento) {
      onDeleteAbatimento(itemToDelete);
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleCancelDelete = () => {
    console.log('🔴 USUÁRIO CANCELOU EXCLUSÃO');
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  // Combinar pagamentos e abatimentos em uma lista unificada de saídas
  const saidasCombinadas = React.useMemo(() => {
    const saidasPagamentos = pagamentos.map(pagamento => ({
      id: pagamento.id,
      data: pagamento.data_pagamento,
      descricao: `Pagamento - ${pagamento.compra?.fornecedor?.nome || 'Fornecedor'}`,
      valor: pagamento.paid_value || pagamento.valor_pago,
      categoria: 'Pagamento a Fornecedor',
      status: 'pago' as const,
      tipo: 'pagamento' as const
    }));

    const saidasAbatimentos = abatimentos.map(abatimento => ({
      id: abatimento.id,
      data: abatimento.data_abatimento,
      descricao: `Abatimento - ${abatimento.socio?.nome || 'Sócio'}`,
      valor: abatimento.valor,
      categoria: 'Abatimento Pré-Saldo',
      status: 'pago' as const,
      tipo: 'abatimento' as const,
      observacao: abatimento.observacao
    }));

    // Combinar e ordenar por data (mais recentes primeiro)
    return [...saidasPagamentos, ...saidasAbatimentos]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [pagamentos, abatimentos]);

  // Usar saídas combinadas se não foram fornecidas saídas específicas
  const saidasParaExibir = saidas.length > 0 ? saidas : saidasCombinadas;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando saídas...</div>
      </div>
    );
  }

  if (saidasParaExibir.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Nenhuma saída encontrada</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: 'secondary',
      pago: 'default',
      cancelado: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {saidasParaExibir.map((saida) => (
            <TableRow key={`${saida.tipo}-${saida.id}`}>
              <TableCell>
                {formatDate(saida.data)}
              </TableCell>
              <TableCell className="font-medium">{saida.descricao}</TableCell>
              <TableCell>
                <Badge variant={saida.tipo === 'abatimento' ? 'secondary' : 'outline'}>
                  {saida.categoria}
                </Badge>
              </TableCell>
              <TableCell className="text-red-600 font-medium">
                {formatBRL(saida.valor)}
              </TableCell>
              <TableCell>{getStatusBadge(saida.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {saida.tipo === 'pagamento' && (
                    <>
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(saida)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(saida.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                  {saida.tipo === 'abatimento' && (
                    <>
                      {onEditAbatimento && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const abatimento = abatimentos.find(a => a.id === saida.id);
                            if (abatimento) onEditAbatimento(abatimento);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeleteAbatimento && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteClick(saida.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Tem certeza que deseja excluir este abatimento? Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}