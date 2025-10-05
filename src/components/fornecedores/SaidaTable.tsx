import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatBRL, formatDate } from '../../lib/utils';
import { Edit, Trash2 } from 'lucide-react';

interface Saida {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  categoria: string;
  status: 'pendente' | 'pago' | 'cancelado';
}

interface SaidaTableProps {
  saidas?: Saida[];
  pagamentos?: any[];
  compras?: any[];
  fornecedores?: any[];
  onEdit?: (saida: Saida) => void;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function SaidaTable({ saidas = [], pagamentos, compras, fornecedores, onEdit, onDelete, onRefresh, loading = false }: SaidaTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando saídas...</div>
      </div>
    );
  }

  if (saidas.length === 0) {
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
          {saidas.map((saida) => (
            <TableRow key={saida.id}>
              <TableCell>
                {formatDate(saida.data)}
              </TableCell>
              <TableCell className="font-medium">{saida.descricao}</TableCell>
              <TableCell>{saida.categoria}</TableCell>
              <TableCell className="text-red-600 font-medium">
                {formatBRL(saida.valor)}
              </TableCell>
              <TableCell>{getStatusBadge(saida.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}