import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { CompraForm } from './CompraForm';
import { NovaCompraForm, Compra } from '../types/database';

interface CompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NovaCompraForm) => void;
  loading?: boolean;
  compra?: Compra | null;
  fornecedorId?: string;
}

export function CompraModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false, 
  compra,
  fornecedorId 
}: CompraModalProps) {
  const isEditing = !!compra;

  const handleSubmit = (data: NovaCompraForm) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Compra' : 'Nova Compra'}
          </DialogTitle>
        </DialogHeader>
        
        <CompraForm
          onSubmit={handleSubmit}
          onCancel={onClose}
          loading={loading}
          fornecedorId={fornecedorId}
          initialData={compra ? {
            fornecedor_id: compra.fornecedor_id,
            data: compra.data,
            descricao: compra.descricao,
            categoria: compra.categoria,
            valor_total: compra.valor_total,
            forma: compra.forma,
            vencimento: compra.vencimento
          } : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}