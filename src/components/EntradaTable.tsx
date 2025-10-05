import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Entrada } from '../types/database';
import { formatBRL, formatDate, formatDateTime } from '../lib/utils';

interface EntradaTableProps {
  entradas: Entrada[];
  onEdit: (entrada: Entrada) => void;
  onDelete: (entrada: Entrada) => void;
  loading?: boolean;
}

export function EntradaTable({ entradas, onEdit, onDelete, loading = false }: EntradaTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (entrada: Entrada) => {
    if (window.confirm(`Tem certeza que deseja excluir a entrada de ${formatBRL(entrada.valor)}?`)) {
      setDeletingId(entrada.id);
      try {
        await onDelete(entrada);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Carregando entradas...</div>
      </div>
    );
  }

  if (entradas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma entrada encontrada
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead>Marketplace</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-center">Comissão</TableHead>
            <TableHead>Observação</TableHead>
            <TableHead>Lançado por</TableHead>
            <TableHead>Lançado em</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entradas.map((entrada) => (
            <TableRow key={entrada.id}>
              <TableCell className="font-medium">
                {formatDate(entrada.data)}
              </TableCell>
              <TableCell>
                {entrada.conta?.nome || 'N/A'}
              </TableCell>
              <TableCell>
                {entrada.marketplace?.nome || 'N/A'}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatBRL(entrada.valor)}
              </TableCell>
              <TableCell className="text-center">
                {entrada.comissao_paga ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    4%
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    Não
                  </Badge>
                )}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {entrada.observacao || '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {entrada.usuario?.login || 'Sistema'}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDateTime(entrada.created_at)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      disabled={deletingId === entrada.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(entrada)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(entrada)}
                      className="text-red-600"
                      disabled={deletingId === entrada.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deletingId === entrada.id ? 'Excluindo...' : 'Excluir'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}