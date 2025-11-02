import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import { DespesaForm } from './DespesaForm';
import { NovaDespesaForm, DespesaComDetalhes } from '../../types/database';

interface DespesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NovaDespesaForm) => void;
  loading?: boolean;
  editingDespesa?: DespesaComDetalhes | null;
}

export function DespesaModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false, 
  editingDespesa 
}: DespesaModalProps) {
  const title = editingDespesa ? 'Editar Despesa' : 'Nova Despesa';

  const initialData = editingDespesa ? {
    descricao: editingDespesa.descricao,
    valor: editingDespesa.valor.toString(),
    categoria_id: editingDespesa.categoria_id,
    conta_id: editingDespesa.conta_id,
    subtipo: editingDespesa.subtipo,
    data_vencimento: editingDespesa.data_vencimento,
    observacoes: editingDespesa.observacoes,
    recorrencia_config: editingDespesa.recorrencia_config
  } : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DespesaForm
          onSubmit={onSubmit}
          onCancel={onClose}
          loading={loading}
          initialData={initialData}
        />
      </DialogContent>
    </Dialog>
  );
}