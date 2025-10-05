import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { EntradaForm } from './EntradaForm';
import { NovaEntradaForm, Entrada } from '../types/database';

interface EntradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NovaEntradaForm) => void;
  loading?: boolean;
  editingEntry?: Entrada | null;
}

export function EntradaModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false, 
  editingEntry 
}: EntradaModalProps) {
  const title = editingEntry ? 'Editar Entrada' : 'Nova Entrada';

  const initialData = editingEntry ? {
    data: editingEntry.data,
    conta_id: editingEntry.conta_id,
    marketplace_id: editingEntry.marketplace_id,
    valor: editingEntry.valor.toString(),
    comissao_paga: editingEntry.comissao_paga,
    observacao: editingEntry.observacao
  } : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <EntradaForm
          onSubmit={onSubmit}
          onCancel={onClose}
          loading={loading}
          initialData={initialData}
        />
      </DialogContent>
    </Dialog>
  );
}