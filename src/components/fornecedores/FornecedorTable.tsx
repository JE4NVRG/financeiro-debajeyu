import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Eye, CheckCircle, Calculator } from 'lucide-react';
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
import { PagamentoRapidoModal } from './PagamentoRapidoModal';
import { PagamentoParcialModal } from './PagamentoParcialModal';
import { FornecedorComTotais } from '../../types/database';
import { formatBRL, formatDate } from '../../lib/utils';

interface FornecedorTableProps {
  fornecedores: FornecedorComTotais[];
  loading?: boolean;
  onEdit: (fornecedor: FornecedorComTotais) => void;
  onDelete: (id: string) => void;
  onView: (fornecedor: FornecedorComTotais) => void;
  onPaymentSuccess?: () => void;
}

export function FornecedorTable({ 
  fornecedores, 
  loading = false, 
  onEdit, 
  onDelete, 
  onView,
  onPaymentSuccess
}: FornecedorTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    fornecedor: FornecedorComTotais | null;
  }>({
    isOpen: false,
    fornecedor: null
  });

  const [pagamentoRapidoModal, setPagamentoRapidoModal] = useState<{
    isOpen: boolean;
    compra: any | null;
  }>({
    isOpen: false,
    compra: null
  });

  const [pagamentoParcialModal, setPagamentoParcialModal] = useState<{
    isOpen: boolean;
    compra: any | null;
  }>({
    isOpen: false,
    compra: null
  });

  const handleDeleteClick = (fornecedor: FornecedorComTotais) => {
    setDeleteConfirm({
      isOpen: true,
      fornecedor
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.fornecedor) {
      onDelete(deleteConfirm.fornecedor.id);
    }
    setDeleteConfirm({ isOpen: false, fornecedor: null });
  };

  const handlePagarTudo = (fornecedor: FornecedorComTotais) => {
    // Criar objeto compra simulado baseado no fornecedor
    const compraSimulada = {
      id: fornecedor.id, // Usar o ID do fornecedor diretamente
      fornecedor_id: fornecedor.id,
      descricao: `Pagamento total - ${fornecedor.nome}`,
      valor_total: fornecedor.total_aberto || 0,
      valor_pago: 0,
      saldo_aberto: fornecedor.total_aberto || 0,
      status: 'Pendente',
      data: new Date().toISOString(),
      fornecedores: {
        nome: fornecedor.nome
      }
    };

    setPagamentoRapidoModal({
      isOpen: true,
      compra: compraSimulada
    });
  };

  const handlePagamentoParcial = (fornecedor: FornecedorComTotais) => {
    // Criar objeto compra simulado baseado no fornecedor
    const compraSimulada = {
      id: fornecedor.id, // Usar o ID do fornecedor diretamente
      fornecedor_id: fornecedor.id,
      descricao: `Pagamento parcial - ${fornecedor.nome}`,
      valor_total: fornecedor.total_aberto || 0,
      valor_pago: 0,
      saldo_aberto: fornecedor.total_aberto || 0,
      status: 'Pendente',
      data: new Date().toISOString(),
      fornecedores: {
        nome: fornecedor.nome
      }
    };

    setPagamentoParcialModal({
      isOpen: true,
      compra: compraSimulada
    });
  };

  const handlePaymentSuccess = () => {
    onPaymentSuccess?.();
    setPagamentoRapidoModal({ isOpen: false, compra: null });
    setPagamentoParcialModal({ isOpen: false, compra: null });
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'Ativo' ? 'default' : 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    return (
      <Badge variant="outline">
        {tipo === 'Pessoa Física' ? 'PF' : 'PJ'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Gasto</TableHead>
              <TableHead className="text-right">Total Pago</TableHead>
              <TableHead className="text-right">Saldo Aberto</TableHead>
              <TableHead>Última Compra</TableHead>
              <TableHead className="text-center">Pagamentos</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20 ml-auto"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20 ml-auto"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20 ml-auto"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mx-auto"></div>
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (fornecedores.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Gasto</TableHead>
              <TableHead className="text-right">Total Pago</TableHead>
              <TableHead className="text-right">Saldo Aberto</TableHead>
              <TableHead>Última Compra</TableHead>
              <TableHead className="text-center">Pagamentos</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                Nenhum fornecedor encontrado
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Gasto</TableHead>
              <TableHead className="text-right">Total Pago</TableHead>
              <TableHead className="text-right">Saldo Aberto</TableHead>
              <TableHead>Última Compra</TableHead>
              <TableHead className="text-center">Pagamentos</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fornecedores.map((fornecedor) => {
              const temSaldoAberto = (fornecedor.total_aberto || 0) > 0;
              
              return (
                <TableRow key={fornecedor.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell 
                    className="font-medium"
                    onClick={() => onView(fornecedor)}
                  >
                    <div>
                      <div className="font-medium">{fornecedor.nome}</div>
                      {fornecedor.observacao && (
                        <div className="text-sm text-gray-500 truncate max-w-[200px]">
                          {fornecedor.observacao}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => onView(fornecedor)}>
                    {getTipoBadge(fornecedor.tipo)}
                  </TableCell>
                  <TableCell onClick={() => onView(fornecedor)}>
                    {getStatusBadge(fornecedor.status)}
                  </TableCell>
                  <TableCell 
                    className="text-right font-mono"
                    onClick={() => onView(fornecedor)}
                  >
                    {formatBRL(fornecedor.total_gasto || 0)}
                  </TableCell>
                  <TableCell 
                    className="text-right font-mono"
                    onClick={() => onView(fornecedor)}
                  >
                    {formatBRL(fornecedor.total_pago || 0)}
                  </TableCell>
                  <TableCell 
                    className="text-right font-mono"
                    onClick={() => onView(fornecedor)}
                  >
                    <span className={fornecedor.total_aberto && fornecedor.total_aberto > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatBRL(fornecedor.total_aberto || 0)}
                    </span>
                  </TableCell>
                  <TableCell onClick={() => onView(fornecedor)}>
                    {fornecedor.ultima_compra ? formatDate(fornecedor.ultima_compra) : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {temSaldoAberto ? (
                      <div className="flex gap-1 justify-center">
                        <Button
                          size="sm"
                          onClick={() => handlePagarTudo(fornecedor)}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-7 text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pagar Tudo
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePagamentoParcial(fornecedor)}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50 px-2 py-1 h-7 text-xs"
                        >
                          <Calculator className="h-3 w-3 mr-1" />
                          Parcial
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Quitado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(fornecedor)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(fornecedor)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(fornecedor)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmationDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) => setDeleteConfirm({ isOpen: open, fornecedor: open ? deleteConfirm.fornecedor : null })}
        onConfirm={handleDeleteConfirm}
        title="Excluir Fornecedor"
        description={`Tem certeza que deseja excluir o fornecedor "${deleteConfirm.fornecedor?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />

      <PagamentoRapidoModal
        open={pagamentoRapidoModal.isOpen}
        onOpenChange={(open) => setPagamentoRapidoModal({ isOpen: open, compra: open ? pagamentoRapidoModal.compra : null })}
        compra={pagamentoRapidoModal.compra}
        onSuccess={handlePaymentSuccess}
      />

      <PagamentoParcialModal
        open={pagamentoParcialModal.isOpen}
        onOpenChange={(open) => setPagamentoParcialModal({ isOpen: open, compra: open ? pagamentoParcialModal.compra : null })}
        compra={pagamentoParcialModal.compra}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}