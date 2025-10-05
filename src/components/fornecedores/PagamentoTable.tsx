import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatBRL, formatDate } from '../../lib/utils';
import { Edit, Trash2, Receipt } from 'lucide-react';

interface Pagamento {
  id: string;
  data: string;
  valor: number;
  metodo: 'dinheiro' | 'pix' | 'cartao' | 'transferencia';
  fornecedor_id: string;
  fornecedor?: {
    nome: string;
  };
  compra_id?: string;
  status: 'pendente' | 'processando' | 'concluido' | 'cancelado';
  observacao?: string;
}

interface PagamentoTableProps {
  pagamentos: any[];
  onEdit?: (pagamento: any) => void;
  onDelete?: (id: string) => void;
  onViewReceipt?: (pagamento: any) => void;
  loading?: boolean;
}

export function PagamentoTable({ pagamentos, onEdit, onDelete, onViewReceipt, loading = false }: PagamentoTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando pagamentos...</div>
      </div>
    );
  }

  if (pagamentos.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Nenhum pagamento encontrado</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: 'secondary',
      processando: 'outline',
      concluido: 'default',
      cancelado: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getMetodoBadge = (metodo: string) => {
    const labels = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      cartao: 'Cartão',
      transferencia: 'Transferência'
    };

    return (
      <Badge variant="outline">
        {labels[metodo as keyof typeof labels] || metodo}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagamentos.map((pagamento) => (
            <TableRow key={pagamento.id}>
              <TableCell>
                {formatDate(pagamento.data_pagamento || pagamento.data)}
              </TableCell>
              <TableCell className="font-medium">
                {pagamento.compra?.fornecedor?.nome || pagamento.fornecedor?.nome || 'N/A'}
              </TableCell>
              <TableCell className="text-red-600 font-medium">
                {formatBRL(pagamento.valor_pago || pagamento.valor)}
              </TableCell>
              <TableCell>{getMetodoBadge(pagamento.metodo || 'transferencia')}</TableCell>
              <TableCell>{getStatusBadge(pagamento.status || 'concluido')}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {onViewReceipt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewReceipt(pagamento)}
                    >
                      <Receipt className="h-4 w-4" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(pagamento)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(pagamento.id)}
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