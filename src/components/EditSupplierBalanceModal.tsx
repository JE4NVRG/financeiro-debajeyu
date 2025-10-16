import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, DollarSign } from 'lucide-react';
import { useBRLMask } from '@/hooks/useBRLMask';
import { useSupplierBalance } from '@/hooks/useSupplierBalance';
import { EditSupplierBalanceForm, Fornecedor } from '@/types/database';

interface EditSupplierBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedor: Fornecedor | null;
  onSuccess?: () => void;
}

export function EditSupplierBalanceModal({
  isOpen,
  onClose,
  fornecedor,
  onSuccess
}: EditSupplierBalanceModalProps) {
  const [form, setForm] = useState<EditSupplierBalanceForm>({
    fornecedor_id: fornecedor?.id || '',
    valor: '',
    observacao: ''
  });

  const { updateSupplierBalance, loading } = useSupplierBalance();
  const { value: valorFormatted, handleChange } = useBRLMask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fornecedor || !form.valor || !form.observacao.trim()) {
      return;
    }

    try {
      await updateSupplierBalance({
        ...form,
        valor: valorFormatted
      });
      
      onSuccess?.();
      onClose();
      
      // Reset form
      setForm({
        fornecedor_id: fornecedor.id,
        valor: '',
        observacao: ''
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset form
      setForm({
        fornecedor_id: fornecedor.id,
        valor: '',
        observacao: ''
      });
    }
  };

  // Don't render if fornecedor is null
  if (!fornecedor) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Editar Saldo Devedor
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Fornecedor: <span className="font-medium">{fornecedor.nome}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="valor">Novo Saldo Devedor *</Label>
            <Input
              id="valor"
              type="text"
              placeholder="R$ 0,00"
              value={valorFormatted}
              onChange={(e) => {
                const newValue = handleChange(e.target.value);
                setForm(prev => ({ ...prev, valor: newValue }));
              }}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Motivo do Ajuste *</Label>
            <Textarea
              id="observacao"
              placeholder="Descreva o motivo do ajuste manual..."
              value={form.observacao}
              onChange={(e) => setForm(prev => ({ ...prev, observacao: e.target.value }))}
              disabled={loading}
              maxLength={500}
              rows={3}
              required
            />
            <p className="text-xs text-gray-500">
              {form.observacao.length}/500 caracteres
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.valor || !form.observacao.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}