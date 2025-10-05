import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { FornecedorForm } from './FornecedorForm';
import { NovoFornecedorForm, Fornecedor } from '../types/database';

interface FornecedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NovoFornecedorForm) => void;
  loading?: boolean;
  fornecedor?: Fornecedor | null;
}

export function FornecedorModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false, 
  fornecedor 
}: FornecedorModalProps) {
  const isEditing = !!fornecedor;

  const handleSubmit = (data: NovoFornecedorForm) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </DialogTitle>
        </DialogHeader>
        
        <FornecedorForm
          onSubmit={handleSubmit}
          onCancel={onClose}
          loading={loading}
          initialData={fornecedor ? {
            nome: fornecedor.nome,
            tipo: fornecedor.tipo,
            status: fornecedor.status,
            observacao: fornecedor.observacao
          } : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}