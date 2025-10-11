import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { formatBRL } from '../../lib/utils';
import { AbatimentoComDetalhes } from '../../types/database';
import { CurrencyInput } from '../ui/CurrencyInput';
import { AlertCircle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface AbatimentoEditModalProps {
  abatimento: AbatimentoComDetalhes | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: { valor?: string; data_abatimento?: string; observacao?: string }) => Promise<void>;
  loading?: boolean;
}

export function AbatimentoEditModal({ 
  abatimento, 
  isOpen, 
  onClose, 
  onSave, 
  loading = false 
}: AbatimentoEditModalProps) {
  const [formData, setFormData] = useState({
    valor: '',
    data_abatimento: '',
    observacao: ''
  });
  const [valorNumerico, setValorNumerico] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (abatimento) {
      setFormData({
        valor: abatimento.valor.toString(),
        data_abatimento: abatimento.data_abatimento,
        observacao: abatimento.observacao || ''
      });
      setValorNumerico(abatimento.valor);
    }
  }, [abatimento]);

  const handleValorChange = (value: number) => {
    setValorNumerico(value);
    setFormData(prev => ({ ...prev, valor: value.toString() }));
    if (errors.valor) {
      setErrors(prev => ({ ...prev, valor: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.data_abatimento) {
      newErrors.data_abatimento = 'Data é obrigatória';
    }

    if (valorNumerico <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!abatimento || !validateForm()) return;

    try {
      setSaving(true);
      setErrors({});

      const updateData: any = {};
      
      // Só incluir campos que foram alterados
      if (valorNumerico !== abatimento.valor) {
        updateData.valor = valorNumerico.toString();
      }
      
      if (formData.data_abatimento !== abatimento.data_abatimento) {
        updateData.data_abatimento = formData.data_abatimento;
      }
      
      if (formData.observacao !== (abatimento.observacao || '')) {
        updateData.observacao = formData.observacao;
      }

      await onSave(abatimento.id, updateData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar abatimento:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Erro ao salvar abatimento' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setErrors({});
      onClose();
    }
  };

  if (!abatimento) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Abatimento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Abatimento */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-900 text-base">
                <DollarSign className="h-4 w-4" />
                Informações do Abatimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Sócio:</span>
                <span className="text-sm text-blue-900">{abatimento.socio.nome}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Conta:</span>
                <span className="text-sm text-blue-900">{abatimento.conta.nome}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Valor Original:</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {formatBRL(abatimento.valor)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Saldo Anterior:</span>
                <span className="text-sm text-blue-900">{formatBRL(abatimento.saldo_anterior)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Saldo Posterior:</span>
                <span className="text-sm text-blue-900">{formatBRL(abatimento.saldo_posterior)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Valor do Abatimento */}
          <div className="space-y-2">
            <Label htmlFor="valor">Novo Valor do Abatimento *</Label>
            <CurrencyInput
              id="valor"
              value={valorNumerico}
              onChange={handleValorChange}
              placeholder="R$ 0,00"
              className={errors.valor ? 'border-red-500' : ''}
            />
            {errors.valor && (
              <p className="text-sm text-red-500">{errors.valor}</p>
            )}
            {valorNumerico !== abatimento.valor && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  Alterar o valor irá recalcular os saldos do sócio automaticamente.
                </span>
              </div>
            )}
          </div>

          {/* Data do Abatimento */}
          <div className="space-y-2">
            <Label htmlFor="data">Data do Abatimento *</Label>
            <Input
              id="data"
              type="date"
              value={formData.data_abatimento}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, data_abatimento: e.target.value }));
                if (errors.data_abatimento) setErrors(prev => ({ ...prev, data_abatimento: '' }));
              }}
              className={errors.data_abatimento ? 'border-red-500' : ''}
            />
            {errors.data_abatimento && (
              <p className="text-sm text-red-500">{errors.data_abatimento}</p>
            )}
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={formData.observacao}
              onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
              placeholder="Observações sobre o abatimento..."
              rows={3}
            />
          </div>

          {/* Erro de submissão */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{errors.submit}</span>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || loading}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}