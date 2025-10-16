import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Marketplace, EditBlockedAmountForm } from '../types/database';
import { useMarketplaces } from '../hooks/useMarketplaces';
import { useBlockedAmounts } from '../hooks/useBlockedAmounts';
import { formatBRL, parseBRLToNumber } from '../lib/utils';
import { toast } from 'sonner';

interface EditBlockedAmountModalProps {
  marketplace: Marketplace | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditBlockedAmountModal({ marketplace, isOpen, onClose }: EditBlockedAmountModalProps) {
  const [form, setForm] = useState<EditBlockedAmountForm>({
    marketplace_id: '',
    valor: '',
    observacao: ''
  });
  const [loading, setLoading] = useState(false);
  const { updateBlockedAmount, refetch: refetchMarketplaces } = useMarketplaces();
  const { refetch: refetchBlockedAmounts } = useBlockedAmounts();

  React.useEffect(() => {
    if (marketplace) {
      setForm({
        marketplace_id: marketplace.id,
        valor: formatBRL(marketplace.dinheiro_a_liberar || 0),
        observacao: ''
      });
    }
  }, [marketplace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!marketplace) return;

    try {
      setLoading(true);
      await updateBlockedAmount(form);
      
      // Atualizar tanto os marketplaces quanto o total de valores bloqueados
      await Promise.all([
        refetchMarketplaces(),
        refetchBlockedAmounts()
      ]);
      
      onClose();
      setForm({
        marketplace_id: '',
        valor: '',
        observacao: ''
      });
    } catch (error) {
      console.error('Erro ao atualizar saldo a liberar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (value: string) => {
    // Remove apenas caracteres que não são números, vírgula ou ponto
    let cleanValue = value.replace(/[^\d,.]/g, '');
    
    // Se está vazio, permite campo vazio
    if (!cleanValue) {
      setForm(prev => ({
        ...prev,
        valor: ''
      }));
      return;
    }
    
    // Substitui múltiplos pontos/vírgulas por apenas um
    cleanValue = cleanValue.replace(/[,.]+/g, ',');
    
    // Remove zeros à esquerda desnecessários de forma mais agressiva
    // Mas preserva o zero se for o único dígito ou se houver vírgula depois
    if (cleanValue.match(/^0+\d/) && !cleanValue.startsWith('0,')) {
      cleanValue = cleanValue.replace(/^0+/, '');
    }
    
    // Se ficou vazio após remover zeros, coloca um zero
    if (!cleanValue || cleanValue === ',') {
      cleanValue = '0';
    }
    
    setForm(prev => ({
      ...prev,
      valor: cleanValue
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Editar Saldo a Liberar - {marketplace?.nome}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="valor">Saldo a Liberar</Label>
            <Input
              id="valor"
              type="text"
              placeholder="R$ 0,00"
              value={form.valor}
              onChange={(e) => handleValueChange(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              placeholder="Motivo da alteração..."
              value={form.observacao}
              onChange={(e) => setForm(prev => ({ ...prev, observacao: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}