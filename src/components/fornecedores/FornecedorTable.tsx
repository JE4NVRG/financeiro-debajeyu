import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2, Eye, CheckCircle, Calculator, Edit3 } from 'lucide-react';
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
import { PagamentoTotalFornecedorModal } from './PagamentoTotalFornecedorModal';
import { EditSupplierBalanceModal } from '../EditSupplierBalanceModal';
import { FornecedorComTotais } from '../../types/database';
import { formatBRL, formatDate } from '../../lib/utils';
import { usePagamentoFornecedor } from '../../hooks/usePagamentoFornecedor';
import { toast } from 'sonner';

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
  const { pagarTodasCompras, loading: pagamentoLoading } = usePagamentoFornecedor();
  
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

  const [editBalanceModal, setEditBalanceModal] = useState<{
    isOpen: boolean;
    fornecedor: FornecedorComTotais | null;
  }>({
    isOpen: false,
    fornecedor: null
  });

  const [pagamentoTotalModal, setPagamentoTotalModal] = useState<{
    isOpen: boolean;
    fornecedor: FornecedorComTotais | null;
  }>({
    isOpen: false,
    fornecedor: null
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

  const handlePagarTudo = async (fornecedor: FornecedorComTotais) => {
    console.log('🔍 [FORNECEDOR-TABLE] Abrindo modal de pagamento total para fornecedor:', {
      fornecedorId: fornecedor.id,
      nome: fornecedor.nome,
      totalAberto: fornecedor.total_aberto
    });

    // Abrir modal de pagamento total
    setPagamentoTotalModal({
      isOpen: true,
      fornecedor: fornecedor
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
    setPagamentoTotalModal({ isOpen: false, fornecedor: null });
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

  const handleEditBalance = (fornecedor: FornecedorComTotais) => {
    setEditBalanceModal({
      isOpen: true,
      fornecedor
    });
  };

  const handleBalanceEditSuccess = () => {
    onPaymentSuccess?.();
    setEditBalanceModal({ isOpen: false, fornecedor: null });
  };

  const getBalanceTypeBadge = (fornecedor: FornecedorComTotais) => {
    if (fornecedor.tem_ajuste_manual) {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
          Manual
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
        Auto
      </Badge>
    );
  };

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
              <TableHead className="text-right">Saldo Devedor</TableHead>
              <TableHead>Última Compra</TableHead>
              <TableHead className="text-center">Pagamentos</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fornecedores.map((fornecedor) => {
              const saldoDevedor = fornecedor.tem_ajuste_manual 
                ? fornecedor.saldo_devedor_manual 
                : (fornecedor.total_aberto || 0);
              const temSaldoAberto = saldoDevedor > 0;
              
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
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`font-mono ${saldoDevedor > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatBRL(saldoDevedor)}
                      </span>
                      {getBalanceTypeBadge(fornecedor)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditBalance(fornecedor)}
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
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
                          disabled={pagamentoLoading}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-7 text-xs disabled:opacity-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {pagamentoLoading ? 'Processando...' : 'Pagar Tudo'}
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
                        <DropdownMenuItem onClick={() => handleEditBalance(fornecedor)}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Editar Saldo
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

      <PagamentoTotalFornecedorModal
        open={pagamentoTotalModal.isOpen}
        onOpenChange={(open) => setPagamentoTotalModal({ isOpen: open, fornecedor: open ? pagamentoTotalModal.fornecedor : null })}
        fornecedor={pagamentoTotalModal.fornecedor}
        onSuccess={handlePaymentSuccess}
      />

      <EditSupplierBalanceModal
        isOpen={editBalanceModal.isOpen}
        onClose={() => setEditBalanceModal({ isOpen: false, fornecedor: null })}
        fornecedor={editBalanceModal.fornecedor}
        onSuccess={handleBalanceEditSuccess}
      />
    </>
  );
}