import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { MoreHorizontal, Edit, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import { DespesaComDetalhes } from '../../types/database';
import { formatBRL, formatDate, formatDateTime } from '../../lib/utils';

interface DespesaTableProps {
  despesas: DespesaComDetalhes[];
  onEdit: (despesa: DespesaComDetalhes) => void;
  onDelete: (despesa: DespesaComDetalhes) => void;
  onMarcarComoPago: (despesa: DespesaComDetalhes) => void;
  onGerarProximaRecorrencia: (despesa: DespesaComDetalhes) => void;
  loading?: boolean;
}

export function DespesaTable({ 
  despesas, 
  onEdit, 
  onDelete, 
  onMarcarComoPago,
  onGerarProximaRecorrencia,
  loading = false 
}: DespesaTableProps) {
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    despesa: DespesaComDetalhes | null;
  }>({ isOpen: false, despesa: null });

  const handleDeleteClick = (despesa: DespesaComDetalhes) => {
    setDeleteConfirm({ isOpen: true, despesa });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.despesa) return;
    
    setActioningId(deleteConfirm.despesa.id);
    try {
      await onDelete(deleteConfirm.despesa);
    } finally {
      setActioningId(null);
      setDeleteConfirm({ isOpen: false, despesa: null });
    }
  };

  const handleMarcarComoPago = async (despesa: DespesaComDetalhes) => {
    setActioningId(despesa.id);
    try {
      await onMarcarComoPago(despesa);
    } finally {
      setActioningId(null);
    }
  };

  const handleGerarProximaRecorrencia = async (despesa: DespesaComDetalhes) => {
    setActioningId(despesa.id);
    try {
      await onGerarProximaRecorrencia(despesa);
    } finally {
      setActioningId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'pago':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'vencido':
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSubtipoBadge = (subtipo: string) => {
    switch (subtipo) {
      case 'fixa':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Fixa</Badge>;
      case 'avulsa':
        return <Badge variant="outline">Avulsa</Badge>;
      default:
        return <Badge variant="outline">{subtipo}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Carregando despesas...</div>
      </div>
    );
  }

  if (despesas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma despesa encontrada
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Observações</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {despesas.map((despesa) => (
            <TableRow key={despesa.id}>
              <TableCell className="font-medium max-w-[200px] truncate">
                {despesa.descricao}
              </TableCell>
              <TableCell>
                {despesa.categoria && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: despesa.categoria.cor }}
                    />
                    {despesa.categoria.nome || 'N/A'}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {despesa.conta?.nome || 'N/A'}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatBRL(despesa.valor)}
              </TableCell>
              <TableCell>
                {formatDate(despesa.data_vencimento)}
              </TableCell>
              <TableCell>
                {getStatusBadge(despesa.status)}
              </TableCell>
              <TableCell>
                {getSubtipoBadge(despesa.subtipo)}
              </TableCell>
              <TableCell className="max-w-[150px] truncate">
                {despesa.observacoes || '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDateTime(despesa.created_at)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      disabled={actioningId === despesa.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(despesa)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    
                    {despesa.status === 'pendente' && (
                      <DropdownMenuItem 
                        onClick={() => handleMarcarComoPago(despesa)}
                        disabled={actioningId === despesa.id}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {actioningId === despesa.id ? 'Marcando...' : 'Marcar como Pago'}
                      </DropdownMenuItem>
                    )}
                    
                    {despesa.subtipo === 'recorrente' && despesa.status === 'pago' && (
                      <DropdownMenuItem 
                        onClick={() => handleGerarProximaRecorrencia(despesa)}
                        disabled={actioningId === despesa.id}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {actioningId === despesa.id ? 'Gerando...' : 'Gerar Próxima'}
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem 
                      onClick={() => handleDeleteClick(despesa)}
                      className="text-red-600"
                      disabled={actioningId === despesa.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {actioningId === despesa.id ? 'Excluindo...' : 'Excluir'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ConfirmationDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => setDeleteConfirm({ isOpen: open, despesa: open ? deleteConfirm.despesa : null })}
        title="Excluir Despesa"
        description={`Tem certeza que deseja excluir a despesa "${deleteConfirm.despesa?.descricao}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}