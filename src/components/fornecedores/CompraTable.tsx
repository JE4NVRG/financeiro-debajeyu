import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatBRL, formatDate } from '../../lib/utils';
import { Edit, Trash2, Eye } from 'lucide-react';

interface Compra {
  id: string;
  data: string;
  descricao: string;
  valor_total: number;
  fornecedor_id: string;
  fornecedor_nome?: string;
  status: 'Aberta' | 'Parcial' | 'Quitada';
  observacao?: string;
}

interface CompraTableProps {
  compras: Compra[];
  onEdit?: (compra: Compra) => void;
  onDelete?: (id: string) => void;
  onView?: (compra: Compra) => void;
  loading?: boolean;
}

export function CompraTable({ compras, onEdit, onDelete, onView, loading = false }: CompraTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando compras...</div>
      </div>
    );
  }

  if (compras.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Nenhuma compra encontrada</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'Aberta': 'secondary',
      'Parcial': 'default', 
      'Quitada': 'default'
    } as const;

    const colors = {
      'Aberta': 'bg-orange-100 text-orange-800',
      'Parcial': 'bg-yellow-100 text-yellow-800',
      'Quitada': 'bg-green-100 text-green-800'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className={colors[status as keyof typeof colors]}>
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
            <TableHead>Fornecedor</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {compras.map((compra) => (
            <TableRow key={compra.id}>
              <TableCell>
                {formatDate(compra.data)}
              </TableCell>
              <TableCell className="font-medium">{compra.descricao}</TableCell>
              <TableCell>{compra.fornecedor_nome || 'N/A'}</TableCell>
              <TableCell className="text-red-600 font-medium">
                {formatBRL(compra.valor_total)}
              </TableCell>
              <TableCell>{getStatusBadge(compra.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(compra)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(compra)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(compra.id)}
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